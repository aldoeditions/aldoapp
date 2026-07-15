import { createClient } from "@/lib/supabase/server";
import type { FormatKey } from "@/lib/constants";
import type { Drop, DropPnl, Oeuvre } from "@/types/database";

export type DropWithStats = Drop & {
  pnl: DropPnl | null;
  nb_oeuvres: number;
};

/** Liste des drops + stats (drop_pnl) + nb d'œuvres. */
export async function getDrops(): Promise<DropWithStats[]> {
  const supabase = createClient();
  const [dropsRes, pnlRes, oeuvresRes] = await Promise.all([
    supabase.from("drops").select("*").order("start_date", { ascending: false }),
    supabase.from("drop_pnl").select("*"),
    supabase.from("oeuvres").select("drop_id"),
  ]);

  const pnlById = new Map((pnlRes.data ?? []).map((p) => [p.id, p]));
  const countById = new Map<string, number>();
  for (const o of oeuvresRes.data ?? []) {
    if (o.drop_id) countById.set(o.drop_id, (countById.get(o.drop_id) ?? 0) + 1);
  }

  return (dropsRes.data ?? []).map((d) => ({
    ...d,
    pnl: pnlById.get(d.id) ?? null,
    nb_oeuvres: countById.get(d.id) ?? 0,
  }));
}

export type OeuvreWithArtist = Oeuvre & {
  artist_name: string | null;
  /** État fichier DÉRIVÉ des fichiers réellement déposés (source de vérité). */
  file_state: "validé" | "en attente" | "refusé" | null;
};

/** Priorité d'affichage de l'état fichier d'une œuvre à partir de ses dépôts. */
function deriveFileState(
  statuses: (string | null)[],
): OeuvreWithArtist["file_state"] {
  if (statuses.some((s) => s === "validé")) return "validé";
  if (statuses.some((s) => s === "en attente")) return "en attente";
  if (statuses.some((s) => s === "refusé")) return "refusé";
  return null;
}

export type DropDetail = {
  drop: Drop;
  pnl: DropPnl | null;
  oeuvres: OeuvreWithArtist[];
};

/** Détail d'un drop : infos + P&L + œuvres (avec nom d'artiste). */
export async function getDropDetail(id: string): Promise<DropDetail | null> {
  const supabase = createClient();

  const { data: drop } = await supabase
    .from("drops")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!drop) return null;

  const [pnlRes, oeuvresRes] = await Promise.all([
    supabase.from("drop_pnl").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("oeuvres")
      .select("*, artists(name)")
      .eq("drop_id", id)
      .order("created_at", { ascending: false })
      .returns<(Oeuvre & { artists: { name: string } | null })[]>(),
  ]);

  const oeuvreIds = (oeuvresRes.data ?? []).map((o) => o.id);
  const { data: filesData } = oeuvreIds.length
    ? await supabase
        .from("artist_files")
        .select("oeuvre_id, status")
        .in("oeuvre_id", oeuvreIds)
    : { data: [] as { oeuvre_id: string | null; status: string | null }[] };

  const statusesByOeuvre = new Map<string, (string | null)[]>();
  for (const f of filesData ?? []) {
    if (!f.oeuvre_id) continue;
    const arr = statusesByOeuvre.get(f.oeuvre_id) ?? [];
    arr.push(f.status);
    statusesByOeuvre.set(f.oeuvre_id, arr);
  }

  const oeuvres = (oeuvresRes.data ?? []).map((o) => {
    const { artists, ...rest } = o;
    return {
      ...rest,
      artist_name: artists?.name ?? null,
      file_state: deriveFileState(statusesByOeuvre.get(o.id) ?? []),
    };
  });

  return {
    drop: drop as Drop,
    pnl: (pnlRes.data ?? null) as DropPnl | null,
    oeuvres,
  };
}

/** Liste légère des artistes pour un sélecteur (id + nom). */
export async function getArtistsForSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artists")
    .select("id, name")
    .order("name", { ascending: true });
  return (data ?? []).map((a) => ({ id: a.id, name: a.name }));
}

export type CostByFormat = Record<
  FormatKey,
  { prix: number; impression: number; packaging: number }
>;

/** Prix de vente + coûts unitaires par format, depuis la table params. */
export async function getCostParams(): Promise<CostByFormat> {
  const supabase = createClient();
  const { data } = await supabase
    .from("params")
    .select("type, format, prix_vente, valeur");

  const result: CostByFormat = {
    A3: { prix: 40, impression: 0, packaging: 0 },
    A4: { prix: 25, impression: 0, packaging: 0 },
  };

  for (const p of data ?? []) {
    const fmt = p.format as FormatKey;
    if (!result[fmt]) continue;
    if (p.type === "Impression") {
      result[fmt].impression = p.valeur ?? 0;
      if (p.prix_vente != null) result[fmt].prix = p.prix_vente;
    } else if (p.type === "Packaging") {
      result[fmt].packaging = p.valeur ?? 0;
    }
  }
  return result;
}
