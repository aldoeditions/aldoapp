/**
 * Calcul PUR d'un relevé de droits d'auteur (RDA) — aucun accès base de données.
 *
 * Entrée : les lignes de vente RETENUES (déjà filtrées en amont : commandes
 * payées, hors annulées/remboursées/test, frais de port exclus, prix réellement
 * payé après remises), le taux de commission FIGÉ de la campagne, le barème
 * social daté, et le statut d'exemption de précompte.
 *
 * Tout est en CENTIMES ENTIERS. Arrondi commercial PAR LIGNE (cf. lib/fiscal).
 * La contribution diffuseur est un coût Aldo : elle N'EST JAMAIS affichée à
 * l'artiste (ni PDF, ni portail) — elle sert seulement au récap Urssaf.
 */
import {
  computePrecompte,
  computeContributionDiffuseur,
  roundHalfUp,
  type SocialRate,
  type PrecompteBreakdown,
} from "@/lib/fiscal";

/** Une ligne de vente retenue (montants en centimes, HT exclu = TTC payé). */
export type StatementSaleInput = {
  oeuvre_id: string | null;
  name: string;
  format: string | null;
  quantity: number;
  /** Prix unitaire TTC réellement payé (après remises), frais de port exclus. */
  unit_price_ttc_cents: number;
  /** Taux de TVA de la ligne en % (ex. 20). Lu depuis la commande / Paramètres. */
  tva_pct: number;
};

export type StatementLine = {
  oeuvre_id: string | null;
  name: string;
  format: string | null;
  quantity: number;
  unit_ht_cents: number;
  line_ht_cents: number;
};

export type StatementResult = {
  lines: StatementLine[];
  total_ht_cents: number;
  commission_pct: number;
  brut_cents: number;
  exempt: boolean;
  /** Détail du précompte (centimes) ou null si dispense/exemption. */
  precompte: { total_cents: number; breakdown: PrecompteBreakdown } | null;
  net_cents: number;
  /** Coût Aldo — JAMAIS exposé à l'artiste. */
  contribution_diffuseur_cents: number;
};

/** HT (centimes) à partir d'un TTC (centimes) et d'un taux de TVA en %. */
export function htFromTtcCents(ttcCents: number, tvaPct: number): number {
  if (ttcCents <= 0) return 0;
  return roundHalfUp(ttcCents / (1 + tvaPct / 100));
}

export type StatementOptions = {
  /** Taux de commission figé de la campagne, en % (ex. 30). Jamais en dur. */
  commissionPct: number;
  rate: SocialRate;
  /** true = dispense de précompte valide (ou régime sans précompte). */
  exempt: boolean;
};

/**
 * Calcule un relevé à partir des lignes de vente retenues.
 * Un relevé à 0 € (aucune vente) est valide et renvoyé tel quel.
 */
export function computeStatement(
  sales: StatementSaleInput[],
  opts: StatementOptions,
): StatementResult {
  const lines: StatementLine[] = sales.map((s) => {
    const unit_ht_cents = htFromTtcCents(Math.max(0, Math.round(s.unit_price_ttc_cents)), s.tva_pct);
    const qty = Math.max(0, Math.round(s.quantity));
    return {
      oeuvre_id: s.oeuvre_id,
      name: s.name,
      format: s.format,
      quantity: qty,
      unit_ht_cents,
      line_ht_cents: unit_ht_cents * qty,
    };
  });

  const total_ht_cents = lines.reduce((sum, l) => sum + l.line_ht_cents, 0);
  const brut_cents = roundHalfUp(total_ht_cents * (opts.commissionPct / 100));

  const { total, breakdown } = computePrecompte(brut_cents, opts.rate, { exempt: opts.exempt });
  const precompte = opts.exempt
    ? null
    : { total_cents: total, breakdown };
  const precompte_cents = precompte ? precompte.total_cents : 0;

  return {
    lines,
    total_ht_cents,
    commission_pct: opts.commissionPct,
    brut_cents,
    exempt: opts.exempt,
    precompte,
    net_cents: brut_cents - precompte_cents,
    contribution_diffuseur_cents: computeContributionDiffuseur(brut_cents, opts.rate),
  };
}
