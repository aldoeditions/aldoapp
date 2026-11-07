// Self-test du calcul de relevé de droits d'auteur (pur).
//   npx tsx scripts/royalties-selftest.ts
// Valeurs attendues vérifiées À LA MAIN (jamais via la fonction testée).
import { computeStatement, type StatementSaleInput } from "../lib/royalties/computeStatement";
import type { SocialRate } from "../lib/fiscal";

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
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? "✅" : "❌"} ${name} — got ${got}, want ${want}`);
}

// === Cas campagne 1 : 6 ventes, 180 € TTC → 150 € HT → brut 45,00 € ===
const sixSales: StatementSaleInput[] = [
  { oeuvre_id: "o1", name: "Affiche A3", format: "A3", quantity: 6, unit_price_ttc_cents: 3000, tva_pct: 20 },
];

const sansDispense = computeStatement(sixSales, { commissionPct: 30, rate: RATE_2026, exempt: false });
eq("C1 total HT = 15000 c (150 €)", sansDispense.total_ht_cents, 15000);
eq("C1 brut = 4500 c (45,00 €)", sansDispense.brut_cents, 4500);
eq("C1 vieillesse = 277 c (2,77 €)", sansDispense.precompte!.breakdown.vieillesse_plaf, 277);
eq("C1 CSG = 407 c (4,07 €)", sansDispense.precompte!.breakdown.csg, 407);
eq("C1 CRDS = 22 c (0,22 €)", sansDispense.precompte!.breakdown.crds, 22);
eq("C1 CFP = 16 c (0,16 €)", sansDispense.precompte!.breakdown.cfp, 16);
eq("C1 précompte total = 722 c (7,22 €)", sansDispense.precompte!.total_cents, 722);
eq("C1 net = 3778 c (37,78 €)", sansDispense.net_cents, 3778);
eq("C1 contribution diffuseur = 50 c (0,50 €)", sansDispense.contribution_diffuseur_cents, 50);

const avecDispense = computeStatement(sixSales, { commissionPct: 30, rate: RATE_2026, exempt: true });
eq("C1 (dispense) précompte = null → 0", avecDispense.precompte ? 1 : 0, 0);
eq("C1 (dispense) net = brut = 4500 c", avecDispense.net_cents, 4500);
eq("C1 (dispense) diffuseur inchangé = 50 c", avecDispense.contribution_diffuseur_cents, 50);

// === Une vente A4 à 25 € TTC → 20,83 € HT → brut 6,25 € ===
const a4 = computeStatement(
  [{ oeuvre_id: "o2", name: "Affiche A4", format: "A4", quantity: 1, unit_price_ttc_cents: 2500, tva_pct: 20 }],
  { commissionPct: 30, rate: RATE_2026, exempt: false },
);
eq("A4 HT unitaire = 2083 c (20,83 €)", a4.lines[0].unit_ht_cents, 2083);
eq("A4 brut = 625 c (6,25 €)", a4.brut_cents, 625);

// === Remise : prix réellement payé (20 € au lieu de 25) × 2 ===
const remise = computeStatement(
  [{ oeuvre_id: "o3", name: "Promo", format: "A4", quantity: 2, unit_price_ttc_cents: 2000, tva_pct: 20 }],
  { commissionPct: 30, rate: RATE_2026, exempt: false },
);
// 2000/1,2 = 1666,67 → 1667 c ; ×2 = 3334 ; brut = 3334×30% = 1000,2 → 1000 c
eq("Remise total HT = 3334 c", remise.total_ht_cents, 3334);
eq("Remise brut = 1000 c (10,00 €)", remise.brut_cents, 1000);

// === Relevé à 0 € (aucune vente) ===
const vide = computeStatement([], { commissionPct: 30, rate: RATE_2026, exempt: false });
eq("Vide : brut = 0", vide.brut_cents, 0);
eq("Vide : net = 0", vide.net_cents, 0);
eq("Vide : diffuseur = 0", vide.contribution_diffuseur_cents, 0);

// === Taux commission figé différent (ex. 25 %) — jamais en dur ===
const autreTaux = computeStatement(sixSales, { commissionPct: 25, rate: RATE_2026, exempt: true });
eq("Commission 25% sur 150 € HT → brut 3750 c", autreTaux.brut_cents, 3750);

console.log(fails === 0 ? "\n✅ Tous les tests passent." : `\n❌ ${fails} test(s) en échec.`);
process.exit(fails === 0 ? 0 : 1);
