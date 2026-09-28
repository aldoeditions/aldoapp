/**
 * Calcul social artiste-auteur (diffuseur) — précompte, net, contribution diffuseur.
 *
 * RÈGLES (voir migration 0024) :
 *  • Tout est en CENTIMES ENTIERS. Aucun arrondi flottant ne sort d'ici.
 *  • Les taux ne sont JAMAIS codés en dur : ils viennent d'une ligne `social_rates`
 *    (barème daté), passée en argument. On applique le barème en vigueur à la
 *    DATE du versement (résolution côté données, cf. lib/data/social-rates.ts).
 *  • Assiette = rémunération BRUTE artiste (les 30 % du prix HT), en centimes.
 *  • Arrondi demi-supérieur (half-up) sur le TOTAL de chaque versement.
 *  • La contribution diffuseur est un COÛT ALDO : elle n'est jamais retenue à
 *    l'artiste ni affichée sur son portail.
 *
 * NB : à ne pas confondre avec lib/social.ts (module Réseaux sociaux).
 */

export type SocialRate = {
  id: string;
  effective_from: string;
  vieillesse_plaf_taux: number;
  vieillesse_plaf_assiette: number;
  plafond_ss_annuel_cents: number;
  vieillesse_deplaf_taux: number;
  vieillesse_deplaf_assiette: number;
  csg_taux: number;
  csg_assiette: number;
  crds_taux: number;
  crds_assiette: number;
  cfp_taux: number;
  cfp_assiette: number;
  contribution_diffuseur_taux: number;
};

export type PrecompteBreakdown = {
  vieillesse_plaf: number;
  vieillesse_deplaf: number;
  csg: number;
  crds: number;
  cfp: number;
};

export type Versement = {
  gross_cents: number;
  precompte_cents: number;
  net_cents: number;
  contribution_diffuseur_cents: number;
  breakdown: PrecompteBreakdown;
  exempt: boolean;
};

/** Arrondi commercial au centime, demi-supérieur (0,5 → 1). Montants positifs. */
export function roundHalfUp(x: number): number {
  return Math.floor(x + 0.5);
}

/** Applique un taux et une assiette (en %) à une base en centimes (résultat flottant). */
function ligne(baseCents: number, assiettePct: number, tauxPct: number): number {
  return baseCents * (assiettePct / 100) * (tauxPct / 100);
}

/**
 * Précompte (part artiste) sur la rémunération brute.
 * La vieillesse plafonnée est calculée dans la limite du plafond annuel restant
 * (cumul des versements déjà faits à l'artiste sur l'année).
 */
export function computePrecompte(
  grossCents: number,
  rate: SocialRate,
  opts: { exempt?: boolean; priorYearGrossCents?: number } = {},
): { total: number; breakdown: PrecompteBreakdown } {
  const zero: PrecompteBreakdown = {
    vieillesse_plaf: 0,
    vieillesse_deplaf: 0,
    csg: 0,
    crds: 0,
    cfp: 0,
  };
  if (opts.exempt || grossCents <= 0) return { total: 0, breakdown: zero };

  const prior = Math.max(0, opts.priorYearGrossCents ?? 0);
  const plafondRestant = Math.max(0, rate.plafond_ss_annuel_cents - prior);
  const baseVieillessePlaf = Math.min(grossCents, plafondRestant);

  const breakdown: PrecompteBreakdown = {
    vieillesse_plaf: ligne(baseVieillessePlaf, rate.vieillesse_plaf_assiette, rate.vieillesse_plaf_taux),
    vieillesse_deplaf: ligne(grossCents, rate.vieillesse_deplaf_assiette, rate.vieillesse_deplaf_taux),
    csg: ligne(grossCents, rate.csg_assiette, rate.csg_taux),
    crds: ligne(grossCents, rate.crds_assiette, rate.crds_taux),
    cfp: ligne(grossCents, rate.cfp_assiette, rate.cfp_taux),
  };

  const total =
    breakdown.vieillesse_plaf +
    breakdown.vieillesse_deplaf +
    breakdown.csg +
    breakdown.crds +
    breakdown.cfp;

  return { total, breakdown };
}

/** Contribution diffuseur (coût Aldo) = taux × rémunération brute, arrondi au centime. */
export function computeContributionDiffuseur(grossCents: number, rate: SocialRate): number {
  if (grossCents <= 0) return 0;
  return roundHalfUp(grossCents * (rate.contribution_diffuseur_taux / 100));
}

/**
 * Décomposition complète d'un versement à partir de la rémunération brute (centimes).
 * net = brut − précompte. La contribution diffuseur s'ajoute EN PLUS (côté Aldo).
 */
export function computeVersement(
  grossCents: number,
  rate: SocialRate,
  opts: { exempt?: boolean; priorYearGrossCents?: number } = {},
): Versement {
  const g = Math.max(0, Math.round(grossCents));
  const { total, breakdown } = computePrecompte(g, rate, opts);
  const precompte_cents = roundHalfUp(total);
  return {
    gross_cents: g,
    precompte_cents,
    net_cents: g - precompte_cents,
    contribution_diffuseur_cents: computeContributionDiffuseur(g, rate),
    breakdown,
    exempt: Boolean(opts.exempt),
  };
}

/** Taux de précompte effectif (indicatif, %) pour un barème donné, hors plafond. */
export function tauxPrecompteEffectif(rate: SocialRate): number {
  const surCent = computePrecompte(10_000, rate).total; // sur 100,00 €
  return surCent / 100; // → pourcentage
}
