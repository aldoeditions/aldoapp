"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import {
  CONTRACTS_BUCKET,
  generateContractInto,
  markContractSentInto,
} from "@/lib/contracts/service";

const BUCKET = CONTRACTS_BUCKET;

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "artistes")) throw new Error("Accès refusé : droits insuffisants.");
  return user;
}

/** Génère le PDF du contrat, le stocke et crée l'entrée contracts (brouillon). */
export async function generateContract(
  artistId: string,
  dropId: string,
): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    const res = await generateContractInto({
      supabase: createClient(),
      admin: createAdminClient(),
      artistId,
      dropId,
    });
    if (res.error) return res;
    revalidatePath(`/artistes/${artistId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Marque le contrat comme envoyé. */
export async function markContractSent(artistId: string, id: string) {
  await assertCanEdit();
  const res = await markContractSentInto({ supabase: createClient(), id });
  if (res.error) throw new Error(res.error);
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
