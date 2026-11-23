"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { markContractSent, markContractSigned } from "@/app/(app)/artistes/contract-actions";

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "artistes")) throw new Error("Accès refusé : droits insuffisants.");
}

/**
 * Passe tous les BROUILLONS du drop à « envoyé ». Réutilise markContractSent
 * (source unique) contrat par contrat. Ne touche jamais aux envoyés/signés.
 */
export async function markAllContractsSent(
  dropId: string,
): Promise<{ count: number; errors: string[] }> {
  await assertCanEdit();
  const supabase = createClient();
  const { data } = await supabase
    .from("contracts")
    .select("id, artist_id")
    .eq("drop_id", dropId)
    .eq("status", "brouillon");

  const errors: string[] = [];
  let count = 0;
  for (const c of data ?? []) {
    if (!c.artist_id) continue;
    try {
      await markContractSent(c.artist_id, c.id);
      count++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Erreur inattendue.");
    }
  }
  revalidatePath(`/drops/${dropId}`);
  return { count, errors };
}

export type SignedResult = { contract_id: string; ok: boolean; error?: string };

/**
 * Dépôt en lot des PDF signés. Le FormData porte un fichier par contrat, sous
 * une clé = id du contrat (le rattachement a été validé côté UI). On vérifie
 * que chaque contrat appartient bien au drop, puis on réutilise
 * markContractSigned (source unique : statut « signé », date, upload bucket).
 */
export async function attachSignedContracts(
  dropId: string,
  fd: FormData,
): Promise<{ results: SignedResult[] }> {
  await assertCanEdit();
  const supabase = createClient();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, artist_id")
    .eq("drop_id", dropId);
  const artistByContract = new Map((contracts ?? []).map((c) => [c.id, c.artist_id]));

  const pairs: { contractId: string; file: File }[] = [];
  fd.forEach((value, key) => {
    if (value instanceof File && value.size > 0) pairs.push({ contractId: key, file: value });
  });

  const results: SignedResult[] = [];
  for (const { contractId, file } of pairs) {
    const artistId = artistByContract.get(contractId);
    if (!artistId) {
      results.push({ contract_id: contractId, ok: false, error: "Contrat hors de cette campagne." });
      continue;
    }
    const single = new FormData();
    single.append("signed", file, file.name);
    const res = await markContractSigned(artistId, contractId, single);
    results.push({ contract_id: contractId, ok: !res.error, error: res.error });
  }

  revalidatePath(`/drops/${dropId}`);
  return { results };
}
