/**
 * Selftest du garde-fou de confidentialité du serveur MCP.
 * Lancer : npx tsx scripts/mcp-redaction-selftest.ts
 *
 * Vérifie que assertNoSensitive() :
 *  - laisse passer des sorties d'outils légitimes (y compris l'e-mail pro) ;
 *  - échoue dès qu'une clé interdite (iban, secu, adresse, coût, client…) ou
 *    une valeur de type IBAN apparaît, même imbriquée.
 */
import { assertNoSensitive, SensitiveLeakError } from "../lib/mcp/redact";

let pass = 0;
let fail = 0;

function shouldPass(label: string, value: unknown) {
  try {
    assertNoSensitive(value, "test");
    pass++;
    console.log(`  ok   — ${label}`);
  } catch (e) {
    fail++;
    console.error(`  FAIL — ${label} a été rejeté : ${(e as Error).message}`);
  }
}

function shouldFail(label: string, value: unknown) {
  try {
    assertNoSensitive(value, "test");
    fail++;
    console.error(`  FAIL — ${label} aurait dû être rejeté`);
  } catch (e) {
    if (e instanceof SensitiveLeakError) {
      pass++;
      console.log(`  ok   — ${label} rejeté (${e.message})`);
    } else {
      fail++;
      console.error(`  FAIL — ${label} a levé une erreur inattendue : ${(e as Error).message}`);
    }
  }
}

console.log("Sorties légitimes (doivent passer) :");
shouldPass("lister_campagnes", { campagnes: [{ numero: 3, nom: "N°3", nb_oeuvres: 20, nb_artistes: 16, statut: "actif" }] });
shouldPass("etat_campagne avec e-mail pro", {
  campagne: { nom: "N°3" },
  artistes: [{ nom_affiche: "Nina", nom_contrat: "Nina Baldo", email_pro: "nina@exemple.fr", identite_complete: true, champs_manquants: [] }],
});
shouldPass("ventes_campagne", { par_oeuvre: [{ oeuvre: "Aube", artiste: "Nina", exemplaires: 4, ca_ttc: 100, ca_ht: 83.33, commission_due: 25 }] });
shouldPass("fiche_publique_artiste", {
  artistes: [{
    artist_id: "a1", nom_affiche: "Nina", pseudo: "nina", bio: "Illustratrice à Tours.",
    instagram: "https://instagram.com/nina", site_web: "https://nina.art",
    avatar_url: "https://x.supabase.co/storage/v1/object/public/artist-assets/a1/avatar.jpg",
    interview: [{ question: "Ton premier contact avec l'art ?", reponse: "Un livre d'images." }],
    fiche_complete: false, champs_publics_manquants: ["Site web"],
  }],
});

console.log("\nSorties interdites (doivent échouer) :");
shouldFail("IBAN en clé", { artiste: "Nina", iban: "FR7630006000011234567890189" });
shouldFail("valeur de type IBAN", { note: "RIB : FR76 3000 6000 0112 3456 7890 189" });
shouldFail("n° de sécu", { artiste: "Nina", numero_secu: "1 85 12 75 108 185 42" });
shouldFail("adresse postale", { artiste: "Nina", address: "12 rue des Lilas" });
shouldFail("date de naissance", { artiste: "Nina", birth_date: "1990-01-01" });
shouldFail("coût imbriqué", { campagne: { nom: "N°3", total_cout: 420 } });
shouldFail("résultat net (marge)", { drop: { resultat_net: 1200 } });
shouldFail("donnée client", { vente: { client_email: "acheteur@exemple.fr" } });
shouldFail("contribution diffuseur", { ligne: { diffuseur: 1.1 } });
shouldFail("téléphone (fiche publique)", { artistes: [{ nom_affiche: "Nina", telephone: "06 12 34 56 78" }] });
shouldFail("statut social (fiche publique)", { artistes: [{ nom_affiche: "Nina", social_regime: "artiste_auteur_precompte" }] });
shouldFail("SIRET (fiche publique)", { artistes: [{ nom_affiche: "Nina", siret: "12345678900012" }] });

console.log(`\n${pass} ok, ${fail} échec(s).`);
process.exit(fail === 0 ? 0 : 1);
