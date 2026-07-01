import { createClient } from "@/lib/supabase/server";
import { PIPE_STATUSES } from "@/lib/constants";

export type PipeCard = {
  id: string;
  name: string;
  avatar_url: string | null;
  type: string | null;
  style: string | null;
  renommee: string | null;
  contacted_by: string | null;
  first_contact_date: string | null;
  pipe_status: string | null;
};

const SELECT =
  "id, name, avatar_url, type, style, renommee, contacted_by, first_contact_date, pipe_status";

export type ProspectsFilter = {
  q?: string;
  pipe?: string;
  by?: string;
};

/** Base de prospection = artistes en phase `prospect` (filtrable). */
export async function getProspects(
  filter: ProspectsFilter = {},
): Promise<PipeCard[]> {
  const supabase = createClient();
  let query = supabase
    .from("artists")
    .select(SELECT)
    .eq("phase", "prospect")
    .order("first_contact_date", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  if (filter.pipe) query = query.eq("pipe_status", filter.pipe);
  if (filter.by) query = query.eq("contacted_by", filter.by);
  if (filter.q) query = query.ilike("name", `%${filter.q}%`);

  const { data } = await query;
  return (data ?? []) as PipeCard[];
}

export type PipeColumn = { status: string; label: string; cards: PipeCard[] };

/** Prospects regroupés par étape (pour la vue Kanban). */
export async function getPipeline(
  filter: ProspectsFilter = {},
): Promise<PipeColumn[]> {
  const prospects = await getProspects({ q: filter.q, by: filter.by });

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
