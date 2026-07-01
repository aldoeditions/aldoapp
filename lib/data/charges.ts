import { createClient } from "@/lib/supabase/server";
import type { Charge } from "@/types/database";

export type ChargesFilter = {
  drop?: string;
  type?: string;
  categorie?: string;
  q?: string;
};

export type ChargeRow = Charge & { drop_name: string | null };

/** Liste des charges (+ nom du drop). */
export async function getCharges(filter: ChargesFilter = {}): Promise<ChargeRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("charges")
    .select("*, drops(name)")
    .order("created_at", { ascending: false });

  if (filter.drop) query = query.eq("drop_id", filter.drop);
  if (filter.type) query = query.eq("type", filter.type);
  if (filter.categorie) query = query.eq("categorie", filter.categorie);
  if (filter.q) query = query.ilike("name", `%${filter.q}%`);

  const { data } = await query.returns<
    (Charge & { drops: { name: string } | null })[]
  >();

  return (data ?? []).map((c) => {
    const { drops, ...rest } = c;
    return { ...rest, drop_name: drops?.name ?? null };
  });
}

export type ChargesTotals = { total: number; fixe: number; variable: number };

/** Totaux des charges (sur le périmètre filtré). */
export function chargesTotals(rows: ChargeRow[]): ChargesTotals {
  let total = 0;
  let fixe = 0;
  let variable = 0;
  for (const c of rows) {
    const m = c.montant ?? 0;
    total += m;
    if (c.type === "Fixe") fixe += m;
    else if (c.type === "Variable") variable += m;
  }
  return { total, fixe, variable };
}
