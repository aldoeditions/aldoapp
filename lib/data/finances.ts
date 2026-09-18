import { createClient } from "@/lib/supabase/server";
import type { DropPnl, Charge, Oeuvre } from "@/types/database";

/** Toutes les lignes P&L (une par drop), triées par date de début. */
export async function getAllPnl(): Promise<DropPnl[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("drop_pnl")
    .select("*")
    .order("start_date", { ascending: false });
  return (data ?? []) as DropPnl[];
}

export type GlobalPnl = {
  ca_brut: number;
  nb_ventes: number;
  total_commissions: number;
  total_impression: number;
  total_packaging: number;
  total_charges: number;
  resultat_net: number;
  marge: number; // ratio net / CA
};

/** Agrège toutes les lignes P&L en un total global. */
export function computeGlobal(rows: DropPnl[]): GlobalPnl {
  const g: GlobalPnl = {
    ca_brut: 0,
    nb_ventes: 0,
    total_commissions: 0,
    total_impression: 0,
    total_packaging: 0,
    total_charges: 0,
    resultat_net: 0,
    marge: 0,
  };
  for (const r of rows) {
    g.ca_brut += r.ca_brut ?? 0;
    g.nb_ventes += r.nb_ventes ?? 0;
    g.total_commissions += r.total_commissions ?? 0;
    g.total_impression += r.total_impression ?? 0;
    g.total_packaging += r.total_packaging ?? 0;
    g.total_charges += r.total_charges ?? 0;
    g.resultat_net += r.resultat_net ?? 0;
  }
  g.marge = g.ca_brut > 0 ? g.resultat_net / g.ca_brut : 0;
  return g;
}

export type OeuvreContribution = {
  id: string;
  name: string;
  format: string;
  nb_ventes: number;
  ca_brut: number;
  marge: number;
};

export type DropFinance = {
  pnl: DropPnl;
  charges: Charge[];
  oeuvres: OeuvreContribution[];
};

/** Finance détaillée d'un drop : P&L + charges + contribution des œuvres. */
export async function getDropFinance(id: string): Promise<DropFinance | null> {
  const supabase = createClient();

  const { data: pnl } = await supabase
    .from("drop_pnl")
    .select("*")
    .eq("id", id)
    .maybeSingle<DropPnl>();
  if (!pnl) return null;

  const [chargesRes, oeuvresRes, statsRes] = await Promise.all([
    supabase.from("charges").select("*").eq("drop_id", id).order("montant", { ascending: false }),
    supabase
      .from("oeuvres")
      .select("id, name, format, nb_ventes, ca_brut, cout_impression, cout_packaging, price")
      .eq("drop_id", id),
    // Ventes RÉELLES par œuvre pour cette campagne (commandes payées).
    supabase.from("oeuvre_stats").select("oeuvre_id, nb_ventes, ca_brut").eq("drop_id", id),
  ]);

  const realStats = new Map<string, { nb: number; ca: number }>();
  for (const s of statsRes.data ?? []) {
    if (s.oeuvre_id) realStats.set(s.oeuvre_id, { nb: s.nb_ventes ?? 0, ca: s.ca_brut ?? 0 });
  }

  const COMMISSION = 0.3;
  const oeuvres: OeuvreContribution[] = (oeuvresRes.data ?? [])
    .map((o: Pick<Oeuvre, "id" | "name" | "format" | "nb_ventes" | "ca_brut" | "cout_impression" | "cout_packaging" | "price">) => {
      const nb = realStats.get(o.id)?.nb ?? 0;
      const ca = realStats.get(o.id)?.ca ?? 0;
      const marge =
        ca - ca * COMMISSION - nb * (o.cout_impression ?? 0) - nb * (o.cout_packaging ?? 0);
      return {
        id: o.id,
        name: o.name,
        format: o.format,
        nb_ventes: nb,
        ca_brut: ca,
        marge: Math.round(marge * 100) / 100,
      };
    })
    .sort((a, b) => b.ca_brut - a.ca_brut);

  return {
    pnl,
    charges: (chargesRes.data ?? []) as Charge[],
    oeuvres,
  };
}
