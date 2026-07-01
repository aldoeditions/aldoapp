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

export type PipeColumn = {
  status: string;
  label: string;
  cards: PipeCard[];
};

/** Prospects (phase prospect/suivi) regroupés par étape de pipeline. */
export async function getPipeline(): Promise<PipeColumn[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artists")
    .select(
      "id, name, avatar_url, type, style, renommee, contacted_by, first_contact_date, pipe_status",
    )
    .in("phase", ["prospect", "suivi"])
    .order("first_contact_date", { ascending: false, nullsFirst: false });

  const columns: PipeColumn[] = PIPE_STATUSES.map((s) => ({
    status: s.value,
    label: s.label,
    cards: [],
  }));
  const byStatus = new Map(columns.map((c) => [c.status, c]));
  const fallback = columns[0]; // "prospect"

  for (const a of data ?? []) {
    const col = (a.pipe_status && byStatus.get(a.pipe_status)) || fallback;
    col.cards.push(a as PipeCard);
  }
  return columns;
}

export type SuiviArtist = {
  id: string;
  name: string;
  avatar_url: string | null;
  phase: string | null;
  pipe_status: string | null;
  kit_impression: string | null;
  visuels: string | null;
  demande_infos: string | null;
  contrat_status: string | null;
};

/** Artistes en suivi de lancement (phase suivi ou pipeline confirmé). */
export async function getSuiviArtists(): Promise<SuiviArtist[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artists")
    .select(
      "id, name, avatar_url, phase, pipe_status, kit_impression, visuels, demande_infos, contrat_status",
    )
    .or("phase.eq.suivi,pipe_status.eq.confirmé")
    .order("name", { ascending: true });

  return (data ?? []) as SuiviArtist[];
}
