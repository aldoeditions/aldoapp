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
  siret: string | null;
  is_maison_des_artistes: boolean | null;
  is_artiste_auteur: boolean | null;
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
  // Contrat : on utilise le nom légal (nom + prénom), jamais le pseudo.
  const legalName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fullName = legalName || artist.name.trim();
  const notifName = lastName ? `${lastName.toUpperCase()} ${firstName}`.trim() : fullName;

  const civility = (artist.civility === "Madame" || artist.civility === "Monsieur")
    ? artist.civility
    : null;
  const masc = civility === "Monsieur";
  const neLe = civility ? (masc ? "né le" : "née le") : "né(e) le";
  const inscrit = civility ? (masc ? "inscrit" : "inscrite") : "inscrit(e)";
  const immatricule = civility ? (masc ? "immatriculé" : "immatriculée") : "immatriculé(e)";
  const civPrefix = civility ? `${civility} ` : "";

  const address = fullAddress(artist);

  // Statut administratif : MDA (si inscrit) sinon SIRET (autoentrepreneur).
  const isAuteur = artist.is_artiste_auteur !== false; // défaut : oui
  const isMDA = artist.is_maison_des_artistes === true;
  const mdaNum = (artist.mda_number ?? "").trim();
  const siret = (artist.siret ?? "").trim();

  let statutClause: string;
  if (isMDA && mdaNum) {
    statutClause = `${inscrit} à la Maison des Artistes sous le numéro ${mdaNum}`;
  } else if (siret) {
    statutClause = `${immatricule} sous le numéro SIRET ${siret}`;
  } else if (mdaNum) {
    statutClause = `${inscrit} à la Maison des Artistes sous le numéro ${mdaNum}`;
  } else {
    statutClause = "dont l'immatriculation est en cours";
  }

  const auteurApposition = isAuteur ? ", artiste-auteur," : ",";
  const identityLine =
    `${civPrefix}${notifName}${auteurApposition} ${neLe} ${dateJjMmAaaa(artist.birth_date)} ` +
    `à ${artist.birth_place ?? "—"}, demeurant ${address}, ${statutClause}.`;

  // Clauses de l'article 5.3 adaptées au statut (voir body.ts).
  const qualite = isAuteur ? "sa qualité d'artiste-auteur" : "son activité de création";
  const statutSocialBullet =
    isMDA
      ? "Maintenir son inscription à la Maison des Artistes ou à l'Agessa (ou tout organisme lui succédant) ;"
      : "Maintenir son immatriculation et son affiliation au régime social dont il relève (micro-entrepreneur / travailleur indépendant, ou Sécurité sociale des artistes-auteurs selon sa situation) auprès de l'organisme compétent ;";

  return {
    civility,
    firstName,
    lastName,
    fullName,
    identityLine,
    qualite,
    statutSocialBullet,
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

/**
 * Regroupe les œuvres d'un même VISUEL (même titre) en une seule ligne d'annexe,
 * en fusionnant les formats (ex. A3 + A4 → « A3, A4 »). Dans l'app, un visuel
 * décliné en A3 et A4 = deux lignes `oeuvres` distinctes du même drop.
 */
export function groupOeuvresByTitle(
  rows: { title: string; format: string | null; fileInfo: string; createdAt: string | null }[],
): ContractOeuvre[] {
  const map = new Map<
    string,
    { title: string; formats: Set<string>; fileInfo: string; createdAt: string | null }
  >();
  for (const r of rows) {
    const key = r.title.trim().toLowerCase();
    const cur = map.get(key) ?? { title: r.title.trim(), formats: new Set<string>(), fileInfo: "", createdAt: null };
    if (r.format) cur.formats.add(r.format);
    if (!cur.fileInfo && r.fileInfo) cur.fileInfo = r.fileInfo;
    if (r.createdAt && (!cur.createdAt || r.createdAt < cur.createdAt)) cur.createdAt = r.createdAt;
    map.set(key, cur);
  }
  return Array.from(map.values()).map((g) => ({
    title: g.title,
    format: Array.from(g.formats).sort().join(", ") || "—",
    fileInfo: g.fileInfo || "Fichier HD fourni",
    createdAt: dateJjMmAaaa(g.createdAt),
  }));
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
