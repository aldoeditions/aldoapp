import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildContractData, renderContractPdf, groupOeuvresByTitle } from "@/lib/contracts/generate";
import { getProgrammedOeuvres } from "@/lib/data/drop-oeuvres";

/**
 * Cœur métier de la génération / du statut des contrats, SANS vérification de
 * droits ni revalidatePath. Source unique partagée par :
 *   - les Server Actions (app/(app)/artistes/contract-actions.ts), scopées par cookie ;
 *   - le serveur MCP (lib/mcp/tools.ts), scopé par token OAuth.
 *
 * `supabase` est le client scopé à l'utilisateur (RLS appliquée) ; `admin` est le
 * client service_role, réservé au Storage et à l'IBAN (champs sensibles).
 */

export const CONTRACTS_BUCKET = "contracts";

type Db = SupabaseClient<Database>;

export function mimeLabel(mime: string | null): string {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return "JPEG";
  if (m.includes("png")) return "PNG";
  if (m.includes("tiff")) return "TIFF";
  if (m.includes("pdf")) return "PDF";
  if (m.includes("photoshop") || m.includes("psd")) return "PSD";
  return m.split("/").pop()?.toUpperCase() || "Fichier";
}

export function sizeMo(bytes: number | null): string {
  if (!bytes) return "";
  return ` · ${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/**
 * Génère le PDF du contrat (brouillon), le stocke et crée la ligne `contracts`.
 * Ne vérifie PAS les droits : l'appelant l'a déjà fait.
 */
export async function generateContractInto(args: {
  supabase: Db;
  admin: Db;
  artistId: string;
  dropId: string;
}): Promise<{ error?: string }> {
  const { supabase, admin, artistId, dropId } = args;

  const [artistRes, dropRes, bankingRes, programmes] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
    supabase.from("drops").select("*").eq("id", dropId).maybeSingle(),
    admin.from("artist_banking").select("iban").eq("artist_id", artistId).maybeSingle(),
    // Œuvres PROGRAMMÉES sur ce drop (drop_oeuvres) → prend en compte les
    // rééditions, contrairement au seul oeuvres.drop_id.
    getProgrammedOeuvres(dropId, supabase),
  ]);

  const artist = artistRes.data;
  const drop = dropRes.data;
  if (!artist) return { error: "Artiste introuvable." };
  if (!drop) return { error: "Campagne introuvable." };

  const oeuvreRows = programmes.filter((o) => o.artist_id === artistId);
  // Garde-fou : jamais de contrat avec une annexe vide.
  if (oeuvreRows.length === 0) {
    return { error: "Aucune œuvre programmée sur cette campagne pour cet artiste." };
  }
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
    if (!cur || f.status === "validé") bestFile.set(f.oeuvre_id, { mime_type: f.mime_type, file_size: f.file_size });
  }

  const oeuvres = groupOeuvresByTitle(
    oeuvreRows.map((o) => {
      const f = bestFile.get(o.id);
      return {
        title: o.name,
        format: o.format ?? null,
        fileInfo: f ? `${mimeLabel(f.mime_type)}${sizeMo(f.file_size)}` : "Fichier HD fourni",
        createdAt: o.created_at,
      };
    }),
  );

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
  const up = await admin.storage.from(CONTRACTS_BUCKET).upload(path, pdf, {
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

  return {};
}

/** Passe un contrat au statut « envoyé » (sans vérif de droits ni revalidate). */
export async function markContractSentInto(args: { supabase: Db; id: string }): Promise<{ error?: string }> {
  const { error } = await args.supabase
    .from("contracts")
    .update({ status: "envoyé", sent_at: new Date().toISOString() })
    .eq("id", args.id);
  return error ? { error: error.message } : {};
}
