/**
 * Géométrie PARTAGÉE des zones de signature, en points PDF (origine en haut à
 * gauche, comme react-pdf). Utilisée à deux endroits pour garantir l'alignement :
 *   - le template PDF (template.tsx) dessine les cadres « signature » à ces
 *     coordonnées sur une page dédiée (la DERNIÈRE page du contrat) ;
 *   - l'envoi DocuSeal (lib/docuseal) place les champs signature aux mêmes
 *     coordonnées, converties en ratios 0–1 de la taille de page.
 *
 * On abandonne les balises de texte `{{…}}` (non détectées de façon fiable à
 * cause de la police sous-ensemblée de @react-pdf) au profit de ce placement
 * explicite par coordonnées.
 */

export const A4 = { w: 595.28, h: 841.89 }; // points

export type Rect = { x: number; y: number; w: number; h: number }; // pt, origine haut-gauche

const BOX_TOP = 380;
const BOX_H = 120;
const BOX_W = 224;
const LEFT_X = 62; // = marge gauche de la page
const RIGHT_X = A4.w - 62 - BOX_W; // symétrique à droite

/** Cadres visibles (bordure + libellé) dessinés sur la page de signature. */
export const SIGN_BOX: Record<"aldo" | "artiste", Rect> = {
  aldo: { x: LEFT_X, y: BOX_TOP, w: BOX_W, h: BOX_H },
  artiste: { x: RIGHT_X, y: BOX_TOP, w: BOX_W, h: BOX_H },
};

/** Zone exacte du champ signature DANS chaque cadre (sous le libellé). */
function fieldRect(box: Rect): Rect {
  return { x: box.x + 14, y: box.y + 40, w: box.w - 28, h: 64 };
}

export const SIGN_FIELD: Record<"aldo" | "artiste", Rect> = {
  aldo: fieldRect(SIGN_BOX.aldo),
  artiste: fieldRect(SIGN_BOX.artiste),
};

export type DocusealArea = { x: number; y: number; w: number; h: number; page: number };

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Convertit un rectangle en points en zone DocuSeal (ratios 0–1, page 1-indexée). */
export function toDocusealArea(r: Rect, page: number): DocusealArea {
  return {
    x: round6(r.x / A4.w),
    y: round6(r.y / A4.h),
    w: round6(r.w / A4.w),
    h: round6(r.h / A4.h),
    page,
  };
}

export type DocusealField = {
  name: string;
  role: string;
  type: "signature";
  required: boolean;
  areas: DocusealArea[];
};

/**
 * Les deux champs signature à placer sur `page` (1-indexée, la page de
 * signature = dernière page du PDF). Les rôles correspondent EXACTEMENT aux
 * submitters de la soumission (« Artiste », « Aldo »).
 */
export function signatureFields(page: number): DocusealField[] {
  return [
    { name: "Signature artiste", role: "Artiste", type: "signature", required: true, areas: [toDocusealArea(SIGN_FIELD.artiste, page)] },
    { name: "Signature Aldo", role: "Aldo", type: "signature", required: true, areas: [toDocusealArea(SIGN_FIELD.aldo, page)] },
  ];
}
