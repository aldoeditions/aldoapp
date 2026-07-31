/**
 * Test de rendu du contrat PDF (isolé, sans DB). Écrit data/test-contract.pdf.
 * Lancer :  npx tsx --conditions=react-server scripts/test-contract-pdf.tsx
 */
import { writeFileSync } from "node:fs";
import { buildContractData, renderContractPdf, groupOeuvresByTitle } from "../lib/contracts/generate";

const data = buildContractData({
  artist: {
    name: "Diane Cartron",
    civility: "Madame",
    first_name: "Diane",
    last_name: "Cartron",
    birth_date: "1995-10-25",
    birth_place: "Mont-de-Marsan",
    mda_number: "48845",
    address: "29 rue Hippolyte Maindron",
    city: "75014 Paris",
    email: "contact.dianecartron@gmail.com",
  },
  iban: "FR76 1027 8375 3600 0105 2050 567",
  drop: { name: "Drop de Mars 2026", start_date: "2026-03-01", end_date: "2026-03-31" },
  oeuvres: groupOeuvresByTitle([
    { title: "Herbier #1", format: "A3", fileInfo: "JPEG · 300 DPI · 2,0 Mo", createdAt: "2026-02-12" },
    { title: "Herbier #1", format: "A4", fileInfo: "JPEG · 300 DPI · 2,0 Mo", createdAt: "2026-02-12" },
    { title: "Monstera", format: "A4", fileInfo: "TIFF · 300 DPI · 8,4 Mo", createdAt: "2026-02-20" },
  ]),
  commissionPct: 30,
  generationDate: new Date(2026, 3, 9),
});

(async () => {
  const buf = await renderContractPdf(data);
  writeFileSync("data/test-contract.pdf", buf);
  console.log("OK →", buf.length, "octets écrits dans data/test-contract.pdf");
  console.log("identityLine:", data.identityLine);
  console.log("commissionWords:", data.commissionWords, "| pct:", data.commissionPct);
})();
