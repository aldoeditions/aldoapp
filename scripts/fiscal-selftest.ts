// Self-test de la couche calcul social (précompte / net / contribution diffuseur).
//   npx tsx scripts/social-selftest.ts
// Purement local, aucune base de données. Vérifie les exemples Urssaf 2026.
import {
  computeVersement,
  computeContributionDiffuseur,
  tauxPrecompteEffectif,
  roundHalfUp,
  type SocialRate,
} from "../lib/fiscal";

// Barème 2026 (identique à la ligne insérée par la migration 0024).
const RATE_2026: SocialRate = {
  id: "test-2026",
  effective_from: "2026-01-01",
  vieillesse_plaf_taux: 6.15,
  vieillesse_plaf_assiette: 100,
  plafond_ss_annuel_cents: 4_806_000,
  vieillesse_deplaf_taux: 0,
  vieillesse_deplaf_assiette: 100,
  csg_taux: 9.2,
  csg_assiette: 98.25,
  crds_taux: 0.5,
  crds_assiette: 98.25,
  cfp_taux: 0.35,
  cfp_assiette: 100,
  contribution_diffuseur_taux: 1.1,
};

let fails = 0;
function eq(name: string, got: number, want: number) {
  const pass = got === want;
  if (!pass) fails++;
  console.log(`${pass ? "✅" : "❌"} ${name} — got ${got}, want ${want}`);
}

// --- A3 : rémunération artiste 10,00 € (30 % du HT) ---
const a3 = computeVersement(1000, RATE_2026);
eq("A3 précompte = 160 c (1,60 €)", a3.precompte_cents, 160);
eq("A3 net = 840 c (8,40 €)", a3.net_cents, 840);
eq("A3 contribution diffuseur = 11 c (0,11 €)", a3.contribution_diffuseur_cents, 11);
eq("A3 net = brut - précompte", a3.net_cents, a3.gross_cents - a3.precompte_cents);

// --- A4 : rémunération artiste 6,25 € ---
const a4 = computeVersement(625, RATE_2026);
eq("A4 précompte = 100 c (1,00 €)", a4.precompte_cents, 100);
eq("A4 net = 525 c (5,25 €)", a4.net_cents, 525);
eq("A4 contribution diffuseur = 7 c (0,07 €)", a4.contribution_diffuseur_cents, 7);

// --- Dispense de précompte : 0 retenu, diffuseur toujours dû ---
const disp = computeVersement(1000, RATE_2026, { exempt: true });
eq("Dispense → précompte = 0", disp.precompte_cents, 0);
eq("Dispense → net = brut", disp.net_cents, 1000);
eq("Dispense → diffuseur inchangé (11 c)", disp.contribution_diffuseur_cents, 11);

// --- Taux effectif ≈ 16,03 % ---
const taux = Math.round(tauxPrecompteEffectif(RATE_2026) * 100) / 100;
eq("Taux précompte effectif = 16,03 %", taux, 16.03);

// --- Plafond vieillesse : au-delà du plafond, plus de vieillesse plafonnée ---
const overCap = computeVersement(100_000, RATE_2026, {
  priorYearGrossCents: 4_806_000, // plafond déjà atteint sur l'année
});
const noCap = computeVersement(100_000, RATE_2026, { priorYearGrossCents: 0 });
eq(
  "Plafond atteint → précompte sans la part vieillesse plafonnée",
  overCap.precompte_cents,
  noCap.precompte_cents - roundHalfUp(100_000 * 0.0615),
);

// --- Arrondi half-up ---
eq("roundHalfUp(6.875 c → 7)", computeContributionDiffuseur(625, RATE_2026), 7);

console.log(fails === 0 ? "\n✅ Tous les tests passent." : `\n❌ ${fails} test(s) en échec.`);
process.exit(fails === 0 ? 0 : 1);
