import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ContractDocument } from "./template";
import {
  dateFrLongue,
  dateJjMmAaaa,
  nombreEnLettres,
  ibanGroupe,
} from "./format";
import type { ContractData, ContractOeuvre } from "./types";

export type GenArtist = {
  name: string;
  civility: string | null;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  mda_number: string | null;
  address: string | null;
  city: string | null;
  email: string | null;
};

export type GenDrop = { name: string; start_date: string | null; end_date: string | null };

export type GenInput = {
  artist: GenArtist;
  iban: string | null;
  drop: GenDrop;
  oeuvres: ContractOeuvre[];
  commissionPct: number;
  generationDate?: Date;
};

const fullAddress = (a: GenArtist): string =>
  [a.address, a.city].map((x) => (x ?? "").trim()).filter(Boolean).join(" ") || "—";

function pctLabel(pct: number): string {
  return Number.isInteger(pct) ? String(pct) : String(pct).replace(".", ",");
}

/** Construit l'objet ContractData (toutes valeurs déjà formatées) à injecter. */
export function buildContractData(input: GenInput): ContractData {
  const { artist, iban, drop, oeuvres, commissionPct } = input;

  const firstName = (artist.first_name ?? artist.name.split(" ")[0] ?? "").trim();
  const lastName = (artist.last_name ?? artist.name.split(" ").slice(1).join(" ") ?? "").trim();
  const fullName = artist.name.trim();
  const notifName = lastName ? `${lastName.toUpperCase()} ${firstName}`.trim() : fullName;

  const civility = (artist.civility === "Madame" || artist.civility === "Monsieur")
    ? artist.civility
    : null;
  const masc = civility === "Monsieur";
  const neLe = civility ? (masc ? "né le" : "née le") : "né(e) le";
  const inscrit = civility ? (masc ? "inscrit" : "inscrite") : "inscrit(e)";
  const civPrefix = civility ? `${civility} ` : "";

  const address = fullAddress(artist);
  const mda = (artist.mda_number ?? "").trim() || "en cours d'inscription";

  const identityLine =
    `${civPrefix}${notifName}, artiste-auteur, ${neLe} ${dateJjMmAaaa(artist.birth_date)} ` +
    `à ${artist.birth_place ?? "—"}, demeurant ${address}, ${inscrit} à la MDA sous le numéro ${mda}.`;

  return {
    civility,
    firstName,
    lastName,
    fullName,
    identityLine,
    address,
    email: (artist.email ?? "").trim() || "—",
    iban: ibanGroupe(iban),
    notifName,
    campaignName: drop.name,
    campaignStart: dateFrLongue(drop.start_date),
    campaignEnd: dateFrLongue(drop.end_date),
    commissionPct: pctLabel(commissionPct),
    commissionWords: nombreEnLettres(commissionPct),
    generationDate: dateJjMmAaaa(input.generationDate ?? new Date()),
    generationPlace: "Bordeaux",
    oeuvres,
  };
}

/** Remplace les caractères hors WinAnsi (Helvetica) par un équivalent sûr. */
function winAnsiSafe(s: string): string {
  return s.replace(/[^\x00-\xFF–—×€’“”…]/g, "?");
}

/**
 * Rend le PDF du contrat en Buffer, puis imprime le pied de page « page X/Y »
 * centré sur chaque page via pdf-lib (le `render`/`totalPages` de react-pdf
 * plante « unsupported number » sur ce contenu).
 */
export async function renderContractPdf(data: ContractData): Promise<Buffer> {
  const rendered = await renderToBuffer(<ContractDocument data={data} />);

  const pdf = await PDFDocument.load(rendered);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;
  const size = 7.5;
  const grey = rgb(0x8a / 255, 0x87 / 255, 0x80 / 255);

  pages.forEach((page, i) => {
    const text = winAnsiSafe(
      `Contrat Aldo Éditions × ${data.fullName} — page ${i + 1}/${total}`,
    );
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (page.getWidth() - width) / 2,
      y: 30,
      size,
      font,
      color: grey,
    });
  });

  return Buffer.from(await pdf.save());
}

/** Champs obligatoires manquants pour générer un contrat conforme. */
export function missingContractFields(artist: GenArtist, iban: string | null): string[] {
  const missing: string[] = [];
  if (!artist.birth_date) missing.push("Date de naissance");
  if (!artist.birth_place) missing.push("Lieu de naissance");
  if (!(artist.address ?? "").trim()) missing.push("Adresse postale");
  if (!(artist.email ?? "").trim()) missing.push("Email");
  if (!(iban ?? "").trim()) missing.push("IBAN");
  return missing;
}
