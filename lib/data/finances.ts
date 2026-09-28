import { createClient } from "@/lib/supabase/server";
import type { DropPnl, Charge, Oeuvre } from "@/types/database";

/** Ligne P&L enrichie de la contribution diffuseur (coût Aldo, hors vue SQL). */
export type PnlRow = DropPnl & { contribution_diffuseur: number };

/** Contribution diffuseur cumulée par drop (centimes → euros), depuis les versements. */
async function contributionByDrop(
  supabase: ReturnType<typeof createClient>,
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("payments")
    .select("drop_id, contribution_diffuseur_cents");
  const m = new Map<string, number>();
  for (const p of data ?? []) {
    if (!p.drop_id) continue;
    m.set(p.drop_id, (m.get(p.drop_id) ?? 0) + (p.contribution_diffuseur_cents ?? 0));
  }
  return m;
}

/**
 * Toutes les lignes P&L (une par drop), triées par date de début.
 * La contribution diffuseur (1,1 % de la rému versée) est un coût Aldo : on la
 * retranche du résultat net et on l'expose à part pour l'affichage.
 */
export async function getAllPnl(): Promise<PnlRow[]> {
  const supabase = createClient();
  const [pnlRes, contrib] = await Promise.all([
    supabase.from("drop_pnl").select("*").order("start_date", { ascending: false }),
    contributionByDrop(supabase),
  ]);
  return (pnlRes.data ?? []).map((r) => {
    const row = r as DropPnl;
    const diff = (contrib.get(row.id ?? "") ?? 0) / 100;
    return {
      ...row,
      contribution_diffuseur: diff,
      resultat_net: (row.resultat_net ?? 0) - diff,
    } as PnlRow;
  });
}

export type GlobalPnl = {
  ca_brut: number; // TTC (encaissé)
  ca_ht: number; // HT
  nb_ventes: number;
  total_commissions: number;
  total_impression: number;
  total_packaging: number;
  total_charges: number;
  total_diffuseur: number; // contribution diffuseur (coût Aldo)
  resultat_net: number;
  marge: number; // ratio net / CA HT
};

/** Agrège toutes les lignes P&L en un total global. */
export function computeGlobal(rows: PnlRow[]): GlobalPnl {
  const g: GlobalPnl = {
    ca_brut: 0,
    ca_ht: 0,
    nb_ventes: 0,
    total_commissions: 0,
    total_impression: 0,
    total_packaging: 0,
    total_charges: 0,
    total_diffuseur: 0,
    resultat_net: 0,
    marge: 0,
  };
  for (const r of rows) {
    g.ca_brut += r.ca_brut ?? 0;
    g.ca_ht += r.ca_ht ?? 0;
    g.nb_ventes += r.nb_ventes ?? 0;
    g.total_commissions += r.total_commissions ?? 0;
    g.total_impression += r.total_impression ?? 0;
    g.total_packaging += r.total_packaging ?? 0;
    g.total_charges += r.total_charges ?? 0;
    g.total_diffuseur += r.contribution_diffuseur ?? 0;
    g.resultat_net += r.resultat_net ?? 0; // déjà net de la contribution diffuseur
  }
  g.marge = g.ca_ht > 0 ? g.resultat_net / g.ca_ht : 0;
  return g;
}

export type OeuvreContribution = {
  id: string;
  name: string;
  format: string;
  nb_ventes: number;
  ca_brut: number; // TTC
  marge: number; // HT
};

export type DropFinance = {
  pnl: PnlRow;
  charges: Charge[];
  oeuvres: OeuvreContribution[];
};

/** Finance détaillée d'un drop : P&L + charges + contribution des œuvres. */
export async function getDropFinance(id: string): Promise<DropFinance | null> {
  const supabase = createClient();

  const { data: pnlBase } = await supabase
    .from("drop_pnl")
    .select("*")
    .eq("id", id)
    .maybeSingle<DropPnl>();
  if (!pnlBase) return null;

  const { data: pays } = await supabase
    .from("payments")
    .select("contribution_diffuseur_cents")
    .eq("drop_id", id);
  const diff =
    (pays ?? []).reduce((s, p) => s + (p.contribution_diffuseur_cents ?? 0), 0) / 100;
  const pnl: PnlRow = {
    ...pnlBase,
    contribution_diffuseur: diff,
    resultat_net: (pnlBase.resultat_net ?? 0) - diff,
  };

  const [chargesRes, oeuvresRes, statsRes] = await Promise.all([
    supabase.from("charges").select("*").eq("drop_id", id).order("montant", { ascending: false }),
    supabase
      .from("oeuvres")
      .select("id, name, format, cout_impression, cout_packaging, price")
      .eq("drop_id", id),
    // Ventes RÉELLES par œuvre pour cette campagne (commandes payées).
    supabase.from("oeuvre_stats").select("oeuvre_id, nb_ventes, ca_brut, ca_ht").eq("drop_id", id),
  ]);

  const realStats = new Map<string, { nb: number; ca: number; caHt: number }>();
  for (const s of statsRes.data ?? []) {
    if (s.oeuvre_id) realStats.set(s.oeuvre_id, { nb: s.nb_ventes ?? 0, ca: s.ca_brut ?? 0, caHt: s.ca_ht ?? 0 });
  }

  const COMMISSION = 0.3;
  const oeuvres: OeuvreContribution[] = (oeuvresRes.data ?? [])
    .map((o: Pick<Oeuvre, "id" | "name" | "format" | "cout_impression" | "cout_packaging" | "price">) => {
      const st = realStats.get(o.id);
      const nb = st?.nb ?? 0;
      const ca = st?.ca ?? 0; // TTC (affichage)
      const caHt = st?.caHt ?? 0; // HT (marge + commission)
      const marge =
        caHt - caHt * COMMISSION - nb * (o.cout_impression ?? 0) - nb * (o.cout_packaging ?? 0);
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
