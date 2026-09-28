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
  social_regime?: string | null;
  address: string | null;
  city: string | null;
  postal_code?: string | null;
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

const fullAddress = (a: GenArtist): string => {
  const cityLine = [a.postal_code, a.city].map((x) => (x ?? "").trim()).filter(Boolean).join(" ");
  return [(a.address ?? "").trim(), cityLine].filter(Boolean).join(", ") || "—";
};

function pctLabel(pct: number): string {
  return Number.isInteger(pct) ? String(pct) : String(pct).replace(".", ",");
}

/** Construit l'objet ContractData (toutes valeurs déjà formatées) à injecter. */
export function buildContractData(input: GenInput): ContractData {
  const { artist, iban, drop, oeuvres, commissionPct } = input;

  // Contrat : on utilise le nom + prénom du bloc identité, JAMAIS le pseudo
  // (champ « Nom » = nom d'affichage dans l'app). Repli sur le pseudo seulement
  // si l'identité légale n'a pas été saisie (missingContractFields la réclame).
  const firstName = (artist.first_name ?? "").trim();
  const lastName = (artist.last_name ?? "").trim();
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

  // Statut social : piloté par social_regime (0025). Repli sur is_artiste_auteur
  // pour les fiches non encore migrées.
  const regime =
    artist.social_regime ??
    (artist.is_artiste_auteur === false ? "bnc_siret" : "artiste_auteur_precompte");
  const isAuteur = regime === "artiste_auteur_precompte" || regime === "artiste_auteur_dispense";
  const isPrecompte = regime === "artiste_auteur_precompte";
  const siret = (artist.siret ?? "").trim();

  let statutClause: string;
  if (siret) {
    statutClause = `${immatricule} sous le numéro SIRET ${siret}`;
  } else if (isAuteur) {
    statutClause = `${inscrit} en qualité d'artiste-auteur auprès de la Sécurité sociale des artistes-auteurs`;
  } else {
    statutClause = "dont l'immatriculation est en cours";
  }

  const auteurApposition = isAuteur ? ", artiste-auteur," : ",";
  const identityLine =
    `${civPrefix}${notifName}${auteurApposition} ${neLe} ${dateJjMmAaaa(artist.birth_date)} ` +
    `à ${artist.birth_place ?? "—"}, demeurant ${address}, ${statutClause}.`;

  // Clauses de l'article 5.3 adaptées au statut (voir body.ts).
  const qualite = isAuteur ? "sa qualité d'artiste-auteur" : "son activité de création";
  const statutSocialBullet = isAuteur
    ? "Maintenir son affiliation à la Sécurité sociale des artistes-auteurs (ou à tout organisme lui succédant) auprès de l'organisme compétent ;"
    : "Maintenir son immatriculation et son affiliation au régime social dont il relève (micro-entrepreneur / travailleur indépendant) auprès de l'organisme compétent ;";

  // Clause 7.3 — précompte (art. RÉMUNÉRATION), selon le régime.
  const precompteClause = isPrecompte
    ? "L'Artiste relevant du régime des artistes-auteurs, Aldo, en sa qualité de diffuseur, procédera au précompte des cotisations et contributions sociales dues par l'Artiste (assurance vieillesse, CSG, CRDS et contribution à la formation professionnelle) sur le montant brut de la rémunération, et les reversera à l'Urssaf pour le compte de l'Artiste, conformément aux articles L382-1 et suivants du Code de la sécurité sociale. Le montant net effectivement versé à l'Artiste s'entend après déduction de ce précompte. Aldo acquitte en outre, à sa charge exclusive, la contribution due par le diffuseur."
    : "L'Artiste déclare assurer lui-même la déclaration et le paiement de l'ensemble de ses cotisations et contributions sociales et fiscales (dispense de précompte ou immatriculation sous numéro SIRET). En conséquence, aucun précompte ne sera opéré par Aldo sur la rémunération, l'Artiste faisant son affaire personnelle de ses obligations sociales et fiscales.";

  return {
    civility,
    firstName,
    lastName,
    fullName,
    identityLine,
    qualite,
    statutSocialBullet,
    precompteClause,
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
  if (!(artist.first_name ?? "").trim()) missing.push("Prénom");
  if (!(artist.last_name ?? "").trim()) missing.push("Nom (bloc identité)");
  if (!artist.birth_date) missing.push("Date de naissance");
  if (!artist.birth_place) missing.push("Lieu de naissance");
  if (!(artist.address ?? "").trim()) missing.push("Adresse postale");
  if (!(artist.email ?? "").trim()) missing.push("Email");
  if (!(iban ?? "").trim()) missing.push("IBAN");
  return missing;
}
