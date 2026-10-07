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
  drop?: string;
};

export type DropRef = { id: string; name: string };
/** Ligne de la vue Artistes enrichie des campagnes auxquelles l'artiste participe. */
export type ArtistListRow = ArtistWithStats & { drops: DropRef[] };

/**
 * Campagnes (drops) par artiste : un artiste « participe » à un drop s'il y a au
 * moins une de ses œuvres — via la programmation (drop_oeuvres) OU le drop_id de
 * l'œuvre. Renvoie une map artist_id → drops (triés par nom).
 */
async function artistDropsMap(
  supabase: ReturnType<typeof createClient>,
): Promise<Map<string, DropRef[]>> {
  const [oeuvresRes, progRes, dropsRes] = await Promise.all([
    supabase.from("oeuvres").select("id, artist_id, drop_id"),
    supabase.from("drop_oeuvres").select("oeuvre_id, drop_id"),
    supabase.from("drops").select("id, name"),
  ]);

  const dropName = new Map<string, string>();
  for (const d of dropsRes.data ?? []) dropName.set(d.id, d.name);

  const oeuvreArtist = new Map<string, string>();
  const byArtist = new Map<string, Set<string>>();
  const add = (artistId: string | null, dropId: string | null) => {
    if (!artistId || !dropId || !dropName.has(dropId)) return;
    if (!byArtist.has(artistId)) byArtist.set(artistId, new Set());
    byArtist.get(artistId)!.add(dropId);
  };

  for (const o of oeuvresRes.data ?? []) {
    if (o.artist_id) oeuvreArtist.set(o.id, o.artist_id);
    add(o.artist_id, o.drop_id);
  }
  for (const p of progRes.data ?? []) {
    add(oeuvreArtist.get(p.oeuvre_id) ?? null, p.drop_id);
  }

  const out = new Map<string, DropRef[]>();
  for (const [artistId, set] of Array.from(byArtist.entries())) {
    out.set(
      artistId,
      Array.from(set)
        .map((id) => ({ id, name: dropName.get(id)! }))
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    );
  }
  return out;
}

/**
 * Artistes SIGNÉS (vue Artistes) : phase actif/suivi par défaut,
 * ou archivés (inactif). Ne renvoie jamais de prospects.
 * Chaque artiste porte la liste des campagnes auxquelles il participe.
 */
export async function getArtists(
  filter: SignedArtistsFilter = {},
): Promise<ArtistListRow[]> {
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

  const [{ data, error }, dropsMap] = await Promise.all([query, artistDropsMap(supabase)]);
  if (error) throw error;

  let rows: ArtistListRow[] = (data ?? []).map((a) => ({
    ...a,
    drops: dropsMap.get(a.id ?? "") ?? [],
  }));
  if (filter.drop) rows = rows.filter((a) => a.drops.some((d) => d.id === filter.drop));
  return rows;
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

export type PendingFile = ArtistFile & {
  artist_name: string | null;
  oeuvre_name: string | null;
};

/** Fichiers déposés en attente de validation (vue équipe). */
export async function getPendingFiles(): Promise<PendingFile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artist_files")
    .select("*, artists(name), oeuvres(name)")
    .eq("status", "en attente")
    .order("created_at", { ascending: false })
    .returns<
      (ArtistFile & {
        artists: { name: string } | null;
        oeuvres: { name: string } | null;
      })[]
    >();
  return (data ?? []).map((f) => {
    const { artists, oeuvres, ...rest } = f;
    return {
      ...rest,
      artist_name: artists?.name ?? null,
      oeuvre_name: oeuvres?.name ?? null,
    };
  });
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
