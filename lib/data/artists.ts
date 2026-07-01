import { createClient } from "@/lib/supabase/server";
import type {
  ArtistWithStats,
  Artist,
  ArtistPhase,
  Oeuvre,
  Contract,
  Payment,
  ArtistFile,
} from "@/types/database";

export type SignedArtistsFilter = {
  archived?: boolean;
  q?: string;
};

/**
 * Artistes SIGNÉS (vue Artistes) : phase actif/suivi par défaut,
 * ou archivés (inactif). Ne renvoie jamais de prospects.
 */
export async function getArtists(
  filter: SignedArtistsFilter = {},
): Promise<ArtistWithStats[]> {
  const supabase = createClient();
  let query = supabase
    .from("artists_with_stats")
    .select("*")
    .order("name", { ascending: true });

  const phases: ArtistPhase[] = filter.archived
    ? ["inactif"]
    : ["actif", "suivi"];
  query = query.in("phase", phases);
  if (filter.q) query = query.ilike("name", `%${filter.q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Compteurs signés / archivés pour les onglets de la vue Artistes. */
export async function getSignedCounts(): Promise<{
  signed: number;
  archived: number;
}> {
  const supabase = createClient();
  const { data } = await supabase.from("artists").select("phase");
  let signed = 0;
  let archived = 0;
  for (const row of data ?? []) {
    if (row.phase === "actif" || row.phase === "suivi") signed++;
    else if (row.phase === "inactif") archived++;
  }
  return { signed, archived };
}

export type ArtistDetail = {
  artist: ArtistWithStats;
  oeuvres: (Oeuvre & { drop_name: string | null })[];
  contracts: Contract[];
  payments: (Payment & { drop_name: string | null })[];
  files: ArtistFile[];
};

/** Fiche artiste complète : profil + œuvres, contrats, paiements, fichiers. */
export async function getArtistDetail(id: string): Promise<ArtistDetail | null> {
  const supabase = createClient();

  const { data: artist } = await supabase
    .from("artists_with_stats")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!artist) return null;

  const [oeuvresRes, contractsRes, paymentsRes, filesRes] = await Promise.all([
    supabase
      .from("oeuvres")
      .select("*, drops(name)")
      .eq("artist_id", id)
      .order("created_at", { ascending: false })
      .returns<(Oeuvre & { drops: { name: string } | null })[]>(),
    supabase
      .from("contracts")
      .select("*")
      .eq("artist_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("*, drops(name)")
      .eq("artist_id", id)
      .order("created_at", { ascending: false })
      .returns<(Payment & { drops: { name: string } | null })[]>(),
    supabase
      .from("artist_files")
      .select("*")
      .eq("artist_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const oeuvres = (oeuvresRes.data ?? []).map((o) => {
    const { drops, ...rest } = o as Oeuvre & { drops: { name: string } | null };
    return { ...rest, drop_name: drops?.name ?? null };
  });

  const payments = (paymentsRes.data ?? []).map((p) => {
    const { drops, ...rest } = p as Payment & { drops: { name: string } | null };
    return { ...rest, drop_name: drops?.name ?? null };
  });

  return {
    artist: artist as ArtistWithStats,
    oeuvres,
    contracts: (contractsRes.data ?? []) as Contract[],
    payments,
    files: (filesRes.data ?? []) as ArtistFile[],
  };
}

/** Ligne artiste brute (pour pré-remplir un formulaire d'édition). */
export async function getArtistRow(id: string): Promise<Artist | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
