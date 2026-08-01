import { createClient } from "@/lib/supabase/server";
import { PIPE_STATUSES } from "@/lib/constants";
import type { Artist } from "@/types/database";

// Ligne artiste complète : permet d'ouvrir/éditer le prospect dans le drawer
// (le formulaire a besoin de tous les champs pour préremplir).
export type PipeCard = Artist;

export type ProspectsFilter = {
  q?: string;
  pipe?: string;
  drop?: boolean; // « pour les prochains drop » uniquement
};

/** Base de prospection = artistes en phase `prospect` (filtrable). */
export async function getProspects(
  filter: ProspectsFilter = {},
): Promise<PipeCard[]> {
  const supabase = createClient();
  let query = supabase
    .from("artists")
    .select("*")
    .eq("phase", "prospect")
    // Plus récemment ajoutés en premier.
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  if (filter.pipe) query = query.eq("pipe_status", filter.pipe);
  if (filter.drop) query = query.eq("dans_le_pipe", true);
  if (filter.q) query = query.ilike("name", `%${filter.q}%`);

  const { data } = await query;
  return (data ?? []) as PipeCard[];
}

export type PipeColumn = { status: string; label: string; cards: PipeCard[] };

/** Prospects regroupés par étape (pour la vue Kanban). */
export async function getPipeline(
  filter: ProspectsFilter = {},
): Promise<PipeColumn[]> {
  const prospects = await getProspects({ q: filter.q, drop: filter.drop });

  const columns: PipeColumn[] = PIPE_STATUSES.map((s) => ({
    status: s.value,
    label: s.label,
    cards: [],
  }));
  const byStatus = new Map(columns.map((c) => [c.status, c]));
  const fallback = columns[0];

  for (const a of prospects) {
    const col = (a.pipe_status && byStatus.get(a.pipe_status)) || fallback;
    col.cards.push(a);
  }
  return columns;
}

/** Compteur de prospects (total, pour l'en-tête). */
export async function getProspectCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("artists")
    .select("id", { count: "exact", head: true })
    .eq("phase", "prospect");
  return count ?? 0;
}
