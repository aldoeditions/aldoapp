"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { buildContractData, renderContractPdf } from "@/lib/contracts/generate";
import { dateJjMmAaaa } from "@/lib/contracts/format";
import type { ContractOeuvre } from "@/lib/contracts/types";

const BUCKET = "contracts";

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "artistes")) throw new Error("Accès refusé : droits insuffisants.");
  return user;
}

function mimeLabel(mime: string | null): string {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return "JPEG";
  if (m.includes("png")) return "PNG";
  if (m.includes("tiff")) return "TIFF";
  if (m.includes("pdf")) return "PDF";
  if (m.includes("photoshop") || m.includes("psd")) return "PSD";
  return m.split("/").pop()?.toUpperCase() || "Fichier";
}

function sizeMo(bytes: number | null): string {
  if (!bytes) return "";
  return ` · ${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/** Génère le PDF du contrat, le stocke et crée l'entrée contracts (brouillon). */
export async function generateContract(
  artistId: string,
  dropId: string,
): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    const supabase = createClient();
    const admin = createAdminClient();

    const [artistRes, dropRes, bankingRes, oeuvresRes] = await Promise.all([
      supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
      supabase.from("drops").select("*").eq("id", dropId).maybeSingle(),
      admin.from("artist_banking").select("iban").eq("artist_id", artistId).maybeSingle(),
      supabase.from("oeuvres").select("id, name, format, created_at").eq("artist_id", artistId).eq("drop_id", dropId),
    ]);

    const artist = artistRes.data;
    const drop = dropRes.data;
    if (!artist) return { error: "Artiste introuvable." };
    if (!drop) return { error: "Campagne introuvable." };

    const oeuvreRows = oeuvresRes.data ?? [];
    // Caractéristiques du fichier : depuis le dernier dépôt validé de l'œuvre.
    const { data: files } = oeuvreRows.length
      ? await admin
          .from("artist_files")
          .select("oeuvre_id, status, mime_type, file_size, created_at")
          .in("oeuvre_id", oeuvreRows.map((o) => o.id))
      : { data: [] as { oeuvre_id: string | null; status: string | null; mime_type: string | null; file_size: number | null; created_at: string | null }[] };

    const bestFile = new Map<string, { mime_type: string | null; file_size: number | null }>();
    for (const f of files ?? []) {
      if (!f.oeuvre_id) continue;
      const cur = bestFile.get(f.oeuvre_id);
      // priorité au validé ; sinon on garde le premier rencontré
      if (!cur || f.status === "validé") bestFile.set(f.oeuvre_id, { mime_type: f.mime_type, file_size: f.file_size });
    }

    const oeuvres: ContractOeuvre[] = oeuvreRows.map((o) => {
      const f = bestFile.get(o.id);
      return {
        title: o.name,
        format: o.format ?? "—",
        fileInfo: f ? `${mimeLabel(f.mime_type)}${sizeMo(f.file_size)}` : "Fichier HD fourni",
        createdAt: dateJjMmAaaa(o.created_at),
      };
    });

    const commissionPct = artist.commission_pct ?? 30;
    const data = buildContractData({
      artist,
      iban: bankingRes.data?.iban ?? null,
      drop,
      oeuvres,
      commissionPct,
    });

    const pdf = await renderContractPdf(data);

    const dateStr = new Date().toISOString().slice(0, 10);
    const path = `${artistId}/${dropId}-${dateStr}.pdf`;
    const up = await admin.storage.from(BUCKET).upload(path, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (up.error) return { error: up.error.message };

    const { error } = await supabase.from("contracts").insert({
      artist_id: artistId,
      drop_id: dropId,
      status: "brouillon",
      commission_pct: commissionPct,
      generated_at: new Date().toISOString(),
      pdf_path: path,
    });
    if (error) return { error: error.message };

    revalidatePath(`/artistes/${artistId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Marque le contrat comme envoyé. */
export async function markContractSent(artistId: string, id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ status: "envoyé", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(`/artistes/${artistId}`);
}

/** Marque le contrat comme signé (+ upload optionnel du PDF signé retourné). */
export async function markContractSigned(
  artistId: string,
  id: string,
  fd: FormData,
): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    const supabase = createClient();
    const admin = createAdminClient();

    const update: { status: string; signed_at: string; file_path?: string } = {
      status: "signé",
      signed_at: new Date().toISOString(),
    };

    const file = fd.get("signed");
    if (file instanceof File && file.size > 0) {
      const path = `${artistId}/signed-${id}-${Date.now()}.pdf`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const up = await admin.storage.from(BUCKET).upload(path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (up.error) return { error: up.error.message };
      update.file_path = path;
    }

    const { error } = await supabase.from("contracts").update(update).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath(`/artistes/${artistId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Supprime un contrat généré. */
export async function deleteContract(artistId: string, id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/artistes/${artistId}`);
}
