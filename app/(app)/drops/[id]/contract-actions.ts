"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { markContractSent, markContractSigned } from "@/app/(app)/artistes/contract-actions";
import { regenerateDraftContractInto } from "@/lib/contracts/service";
import { sendContractForSignature, sendTestSignature } from "@/lib/docuseal/signature";

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "artistes")) throw new Error("Accès refusé : droits insuffisants.");
  return user;
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

/**
 * Régénère les PDF des contrats EN BROUILLON du drop (pour y intégrer les
 * balises de signature). Ne touche jamais un contrat envoyé ou signé.
 */
export async function regenerateDraftContracts(
  dropId: string,
): Promise<{ count: number; errors: string[] }> {
  await assertCanEdit();
  const supabase = createClient();
  const admin = createAdminClient();
  const { data } = await supabase
    .from("contracts")
    .select("id")
    .eq("drop_id", dropId)
    .eq("status", "brouillon");

  const errors: string[] = [];
  let count = 0;
  for (const c of data ?? []) {
    const res = await regenerateDraftContractInto({ supabase, admin, contractId: c.id });
    if (res.error) errors.push(res.error);
    else if (!res.skipped) count++;
  }
  revalidatePath(`/drops/${dropId}`);
  return { count, errors };
}

/**
 * Envoie en signature (DocuSeal) les contrats EN BROUILLON du drop (option :
 * restreindre à certains artistes). Chaque contrat passe à « envoyé ».
 */
export async function sendContractsForSignature(
  dropId: string,
  artistIds?: string[],
): Promise<{ sent: number; errors: string[] }> {
  await assertCanEdit();
  const supabase = createClient();
  const admin = createAdminClient();
  let q = supabase
    .from("contracts")
    .select("id, artist_id, artists(name)")
    .eq("drop_id", dropId)
    .eq("status", "brouillon");
  if (artistIds?.length) q = q.in("artist_id", artistIds);
  const { data } = await q.returns<{ id: string; artist_id: string; artists: { name: string | null } | null }[]>();

  const errors: string[] = [];
  let sent = 0;
  for (const c of data ?? []) {
    try {
      const res = await sendContractForSignature({ supabase, admin, contractId: c.id });
      if (res.error) errors.push(`${c.artists?.name ?? c.artist_id} : ${res.error}`);
      else sent++;
    } catch (e) {
      errors.push(`${c.artists?.name ?? c.artist_id} : ${e instanceof Error ? e.message : "Erreur inattendue."}`);
    }
  }
  revalidatePath(`/drops/${dropId}`);
  return { sent, errors };
}

/**
 * TEST : envoie un contrat de test à l'adresse de l'admin connecté, à partir
 * d'un brouillon du drop, SANS modifier aucun contrat. À utiliser avant tout
 * envoi réel.
 */
export async function sendTestSignatureToMe(dropId: string): Promise<{ error?: string; email?: string; verification?: string }> {
  const user = await assertCanEdit();
  if (!user.email) return { error: "Votre compte n'a pas d'e-mail." };
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: draft } = await supabase
    .from("contracts")
    .select("id")
    .eq("drop_id", dropId)
    .eq("status", "brouillon")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!draft) return { error: "Aucun contrat en brouillon dans cette campagne pour tester." };
  try {
    const res = await sendTestSignature({ admin, contractId: draft.id, email: user.email });
    if (res.error) return { error: res.error };
    return { email: user.email, verification: res.verification };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
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
