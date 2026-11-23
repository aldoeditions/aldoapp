// Smoke test de la signature : rendu PDF + géométrie des champs DocuSeal.
// 1) le PDF se rend et la page de signature est bien la DERNIÈRE ;
// 2) signatureFields() produit 2 champs (Artiste, Aldo) en ratios 0–1, sur la
//    dernière page, sans chevauchement.
import { PDFDocument } from "pdf-lib";
import { buildContractData, renderContractPdf } from "@/lib/contracts/generate";
import { signatureFields } from "@/lib/contracts/signature-layout";

const data = buildContractData({
  artist: {
    name: "Test", civility: "Madame", first_name: "Aglaé", last_name: "Rochette",
    birth_date: "1990-05-01", birth_place: "Tours", mda_number: null, siret: null,
    is_maison_des_artistes: null, is_artiste_auteur: true, address: "1 rue du Test",
    city: "Tours", postal_code: "37000", email: "test@example.com",
  },
  iban: "FR7630006000011234567890189",
  drop: { name: "N°3 - 25 Novembre/29 Décembre", start_date: "2026-11-25", end_date: "2026-12-29" },
  oeuvres: [{ title: "Bavures Buvards", format: "A3, A4", fileInfo: "TIFF · 42,0 Mo", createdAt: "01/01/2026" }],
  commissionPct: 30,
});

function overlaps(a: { x: number; y: number; w: number; h: number }, b: typeof a): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

(async () => {
  const pdf = await renderContractPdf(data);
  const pageCount = (await PDFDocument.load(pdf)).getPageCount();
  const fields = signatureFields(pageCount);

  const [artiste, aldo] = fields;
  const aArea = artiste.areas[0];
  const bArea = aldo.areas[0];
  const inRange = (r: { x: number; y: number; w: number; h: number }) =>
    [r.x, r.y, r.w, r.h].every((v) => v > 0 && v < 1) && r.x + r.w <= 1 && r.y + r.h <= 1;

  const checks: [string, boolean][] = [
    ["PDF rendu (> 1 Ko)", pdf.length > 1000],
    ["≥ 4 pages (garde, corps, annexe, signature)", pageCount >= 4],
    ["2 champs", fields.length === 2],
    ["rôles Artiste + Aldo", artiste.role === "Artiste" && aldo.role === "Aldo"],
    ["type signature", artiste.type === "signature" && aldo.type === "signature"],
    ["champs sur la dernière page", aArea.page === pageCount && bArea.page === pageCount],
    ["ratios dans 0–1", inRange(aArea) && inRange(bArea)],
    ["pas de chevauchement", !overlaps(aArea, bArea)],
  ];

  console.log(`PDF ${pdf.length} o, ${pageCount} pages. Champs :`, JSON.stringify(fields, null, 2));
  let okAll = true;
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "ok  " : "FAIL"} — ${label}`);
    if (!ok) okAll = false;
  }
  console.log(okAll ? "OK" : "ÉCHEC");
  process.exit(okAll ? 0 : 1);
})();
