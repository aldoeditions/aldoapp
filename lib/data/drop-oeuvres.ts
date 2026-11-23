import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

type Db = SupabaseClient<Database>;

export type ProgrammedOeuvre = {
  id: string;
  name: string;
  format: string | null;
  artist_id: string | null;
  created_at: string | null;
};

/**
 * Œuvres PROGRAMMÉES sur un drop via `drop_oeuvres` (relation M:N → gère les
 * rééditions). C'est la source de vérité pour « les œuvres d'une campagne » :
 * le seul `oeuvres.drop_id` ignore toute œuvre reprogrammée depuis une autre
 * campagne (cf. lib/data/drops.ts, qui suit déjà cette règle).
 *
 * Une œuvre n'apparaît qu'une fois même si la programmation la liste en double.
 * `client` est optionnel : par défaut le client scopé par cookie ; les appels
 * MCP / service passent leur propre client (bearer OAuth).
 */
export async function getProgrammedOeuvres(
  dropId: string,
  client?: Db,
): Promise<ProgrammedOeuvre[]> {
  const supabase = client ?? createClient();
  const { data } = await supabase
    .from("drop_oeuvres")
    .select("oeuvres(id, name, format, artist_id, created_at)")
    .eq("drop_id", dropId);

  const rows = ((data ?? []) as unknown as { oeuvres: ProgrammedOeuvre | null }[])
    .map((r) => r.oeuvres)
    .filter((o): o is ProgrammedOeuvre => Boolean(o));

  const byId = new Map<string, ProgrammedOeuvre>();
  for (const o of rows) if (!byId.has(o.id)) byId.set(o.id, o);
  return Array.from(byId.values());
}
