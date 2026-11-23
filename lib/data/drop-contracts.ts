import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { missingContractFields } from "@/lib/contracts/generate";
import { campaignNumberFromDropName } from "@/lib/contracts/filename";

export type DropContractRow = {
  artist_id: string;
  display_name: string; // pseudo (artists.name)
  full_name: string; // « Prénom Nom » du bloc identité (repli pseudo)
  missing: string[]; // champs identité manquants (aucune valeur bancaire)
  contract: {
    id: string;
    status: string; // brouillon | envoyé | signé
    generated_at: string | null;
    sent_at: string | null;
    signed_at: string | null;
    pdf_path: string | null;
    file_path: string | null;
  } | null;
};

export type DropContracts = {
  drop: { id: string; name: string } | null;
  campaign_number: number | null;
  rows: DropContractRow[];
};

type ArtistIdentity = {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  address: string | null;
  email: string | null;
};

/**
 * Artistes ayant au moins une œuvre dans ce drop, avec le statut de leur
 * contrat pour CE drop et les champs identité nécessaires au nom de fichier.
 * Les données bancaires ne sont jamais renvoyées (l'IBAN sert uniquement, côté
 * serveur, à calculer les champs manquants).
 */
export async function getDropContracts(dropId: string): Promise<DropContracts> {
  const supabase = createClient();
  const admin = createAdminClient();

  const [dropRes, progRes] = await Promise.all([
    supabase.from("drops").select("id, name").eq("id", dropId).maybeSingle(),
    supabase.from("drop_oeuvres").select("oeuvres(artist_id)").eq("drop_id", dropId),
  ]);

  const drop = dropRes.data ?? null;
  const artistIds = Array.from(
    new Set(
      ((progRes.data ?? []) as unknown as { oeuvres: { artist_id: string | null } | null }[])
        .map((r) => r.oeuvres?.artist_id)
        .filter((x): x is string => Boolean(x)),
    ),
  );

  if (artistIds.length === 0) {
    return { drop, campaign_number: campaignNumberFromDropName(drop?.name), rows: [] };
  }

  const [artistsRes, bankingRes, contractsRes] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, first_name, last_name, birth_date, birth_place, address, email")
      .in("id", artistIds)
      .returns<ArtistIdentity[]>(),
    admin.from("artist_banking").select("artist_id, iban").in("artist_id", artistIds),
    supabase
      .from("contracts")
      .select("id, artist_id, status, generated_at, sent_at, signed_at, pdf_path, file_path")
      .eq("drop_id", dropId)
      .order("created_at", { ascending: false }),
  ]);

  const ibanByArtist = new Map((bankingRes.data ?? []).map((b) => [b.artist_id, b.iban]));
  // 1er contrat rencontré = le plus récent (tri desc) → contrat « primaire ».
  const contractByArtist = new Map<string, DropContractRow["contract"]>();
  for (const c of contractsRes.data ?? []) {
    if (!c.artist_id || contractByArtist.has(c.artist_id)) continue;
    contractByArtist.set(c.artist_id, {
      id: c.id,
      status: c.status,
      generated_at: c.generated_at,
      sent_at: c.sent_at,
      signed_at: c.signed_at,
      pdf_path: c.pdf_path,
      file_path: c.file_path,
    });
  }

  const rows: DropContractRow[] = (artistsRes.data ?? []).map((a) => {
    const fullName = [a.first_name, a.last_name].map((x) => (x ?? "").trim()).filter(Boolean).join(" ").trim() || a.name;
    return {
      artist_id: a.id,
      display_name: a.name,
      full_name: fullName,
      missing: missingContractFields(
        {
          name: a.name,
          civility: null,
          first_name: a.first_name,
          last_name: a.last_name,
          birth_date: a.birth_date,
          birth_place: a.birth_place,
          mda_number: null,
          siret: null,
          is_maison_des_artistes: null,
          is_artiste_auteur: null,
          address: a.address,
          city: null,
          email: a.email,
        },
        ibanByArtist.get(a.id) ?? null,
      ),
      contract: contractByArtist.get(a.id) ?? null,
    };
  });

  rows.sort((x, y) => x.display_name.localeCompare(y.display_name, "fr"));

  return { drop, campaign_number: campaignNumberFromDropName(drop?.name), rows };
}
