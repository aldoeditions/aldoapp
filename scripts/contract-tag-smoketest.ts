// Smoke test : le PDF du contrat se rend bien avec la balise de signature.
import { buildContractData, renderContractPdf } from "@/lib/contracts/generate";

const data = buildContractData({
  artist: {
    name: "Test",
    civility: "Madame",
    first_name: "Aglaé",
    last_name: "Rochette",
    birth_date: "1990-05-01",
    birth_place: "Tours",
    mda_number: null,
    siret: null,
    is_maison_des_artistes: null,
    is_artiste_auteur: true,
    address: "1 rue du Test",
    city: "Tours",
    postal_code: "37000",
    email: "test@example.com",
  },
  iban: "FR7630006000011234567890189",
  drop: { name: "N°3 - 25 Novembre/29 Décembre", start_date: "2026-11-25", end_date: "2026-12-29" },
  oeuvres: [{ title: "Bavures Buvards", format: "A3, A4", fileInfo: "TIFF · 42,0 Mo", createdAt: "01/01/2026" }],
  commissionPct: 30,
});

(async () => {
  console.log("signatureTag =", data.signatureTag);
  const pdf = await renderContractPdf(data);
  console.log("PDF rendu :", pdf.length, "octets");
  console.log(data.signatureTag && pdf.length > 1000 ? "OK" : "ÉCHEC");
})();
