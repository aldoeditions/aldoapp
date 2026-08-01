import { createClient } from "@/lib/supabase/server";
import type { Oeuvre } from "@/types/database";

export type OeuvreCatalogRow = Oeuvre & {
  artist_name: string | null;
  drop_name: string | null;
};

export type OeuvreCatalogFilter = {
  artist?: string;
  /** id de drop, ou "none" pour les œuvres sans drop. */
  drop?: string;
  q?: string;
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

  return (data ?? []).map((o) => {
    const { artists, drops, ...rest } = o;
    return { ...rest, artist_name: artists?.name ?? null, drop_name: drops?.name ?? null };
  });
}

export type AttachableOeuvre = {
  id: string;
  name: string;
  artist_name: string | null;
  drop_name: string | null;
};

/** Œuvres rattachables à un drop : non rattachées, ou rattachées à un AUTRE drop. */
export async function getAttachableOeuvres(dropId: string): Promise<AttachableOeuvre[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("oeuvres")
    .select("id, name, artists(name), drops(name)")
    .or(`drop_id.is.null,drop_id.neq.${dropId}`)
    .order("created_at", { ascending: false })
    .returns<
      { id: string; name: string; artists: { name: string } | null; drops: { name: string } | null }[]
    >();
  return (data ?? []).map((o) => ({
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
