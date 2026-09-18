import { createClient } from "@/lib/supabase/server";
import type { Oeuvre } from "@/types/database";

export type OeuvreCatalogRow = Oeuvre & {
  artist_name: string | null;
  drop_name: string | null;
  ventes_total: number;
  ca_total: number;
  nb_campagnes: number;
};

export type OeuvreCatalogFilter = {
  artist?: string;
  /** id de drop, ou "none" pour les œuvres sans drop. */
  drop?: string;
  q?: string;
  /** "ventes" pour trier par ventes totales décroissantes. */
  sort?: string;
};

/** Catalogue global des œuvres (indépendant des drops), filtrable. */
export async function getOeuvresCatalog(
  filter: OeuvreCatalogFilter = {},
): Promise<OeuvreCatalogRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("oeuvres")
    .select("*, artists(name), drops(name)")
    .order("created_at", { ascending: false });

  if (filter.artist) query = query.eq("artist_id", filter.artist);
  if (filter.drop === "none") query = query.is("drop_id", null);
  else if (filter.drop) query = query.eq("drop_id", filter.drop);
  if (filter.q) query = query.ilike("name", `%${filter.q}%`);

  const { data } = await query.returns<
    (Oeuvre & { artists: { name: string } | null; drops: { name: string } | null })[]
  >();

  const rows = data ?? [];

  // Statistiques de ventes (toutes campagnes) depuis la vue calculée.
  const ids = rows.map((o) => o.id);
  const stats = new Map<string, { ventes: number; ca: number; camps: number }>();
  if (ids.length) {
    const { data: st } = await supabase
      .from("oeuvre_stats_total")
      .select("oeuvre_id, nb_ventes, ca_brut, nb_campagnes")
      .in("oeuvre_id", ids);
    for (const s of st ?? []) {
      if (s.oeuvre_id) stats.set(s.oeuvre_id, { ventes: s.nb_ventes ?? 0, ca: s.ca_brut ?? 0, camps: s.nb_campagnes ?? 0 });
    }
  }

  const mapped = rows.map((o) => {
    const { artists, drops, ...rest } = o;
    const s = stats.get(o.id);
    return {
      ...rest,
      artist_name: artists?.name ?? null,
      drop_name: drops?.name ?? null,
      ventes_total: s?.ventes ?? 0,
      ca_total: s?.ca ?? 0,
      nb_campagnes: s?.camps ?? 0,
    };
  });

  // Tri par ventes décroissantes si demandé (outil de réédition).
  if (filter.sort === "ventes") mapped.sort((a, b) => b.ventes_total - a.ventes_total);
  return mapped;
}

export type AttachableOeuvre = {
  id: string;
  name: string;
  artist_name: string | null;
  drop_name: string | null;
};

/**
 * Œuvres programmables sur ce drop : tout le catalogue SAUF celles déjà
 * programmées sur ce drop (via drop_oeuvres). Une œuvre déjà dans une autre
 * campagne reste proposée (réédition).
 */
export async function getAttachableOeuvres(dropId: string): Promise<AttachableOeuvre[]> {
  const supabase = createClient();
  const { data: prog } = await supabase.from("drop_oeuvres").select("oeuvre_id").eq("drop_id", dropId);
  const already = new Set((prog ?? []).map((p) => p.oeuvre_id));

  const { data } = await supabase
    .from("oeuvres")
    .select("id, name, artists(name), drops(name)")
    .order("created_at", { ascending: false })
    .returns<
      { id: string; name: string; artists: { name: string } | null; drops: { name: string } | null }[]
    >();
  return (data ?? [])
    .filter((o) => !already.has(o.id))
    .map((o) => ({
      id: o.id,
      name: o.name,
      artist_name: o.artists?.name ?? null,
      drop_name: o.drops?.name ?? null,
    }));
}

/** Compteurs pour l'en-tête (total + sans drop). */
export async function getOeuvreCounts(): Promise<{ total: number; unassigned: number }> {
  const supabase = createClient();
  const [{ count: total }, { count: unassigned }] = await Promise.all([
    supabase.from("oeuvres").select("*", { count: "exact", head: true }),
    supabase.from("oeuvres").select("*", { count: "exact", head: true }).is("drop_id", null),
  ]);
  return { total: total ?? 0, unassigned: unassigned ?? 0 };
}
