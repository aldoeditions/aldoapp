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

export type ArtistsFilter = {
  phase?: string;
  q?: string;
};

/** Liste des artistes (vue enrichie) avec filtre phase + recherche nom. */
export async function getArtists(
  filter: ArtistsFilter = {},
): Promise<ArtistWithStats[]> {
  const supabase = createClient();
  let query = supabase
    .from("artists_with_stats")
    .select("*")
    .order("name", { ascending: true });

  if (filter.phase) query = query.eq("phase", filter.phase as ArtistPhase);
  if (filter.q) query = query.ilike("name", `%${filter.q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Répartition du nombre d'artistes par phase (pour les onglets de filtre). */
export async function getArtistPhaseCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase.from("artists").select("phase");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const p = row.phase ?? "—";
    counts[p] = (counts[p] ?? 0) + 1;
  }
  return counts;
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
