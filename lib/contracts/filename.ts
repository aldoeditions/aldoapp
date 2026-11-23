/**
 * Nommage et rattachement des contrats par nom de fichier.
 *
 * Convention de nom : `C{n}_{Prénom Nom}_Contrat.pdf` (n = numéro de campagne,
 * « Prénom Nom » = bloc identité du contrat). Le rattachement d'un PDF signé
 * tolère les accents, la casse et les suffixes ajoutés par l'outil de
 * signature (« _signé », « - Signed »…).
 */

/** Numéro de campagne depuis le nom du drop (« N°3 - … » → 3). */
export function campaignNumberFromDropName(name: string | null | undefined): number | null {
  if (!name) return null;
  const m = name.match(/n[°ºo]\s*(\d+)/i) ?? name.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Nom de fichier d'un contrat brouillon. */
export function contractFileName(campaignNumber: number | null, fullName: string): string {
  const prefix = campaignNumber != null ? `C${campaignNumber}_` : "";
  return `${prefix}${fullName}_Contrat.pdf`;
}

/** Forme canonique d'un nom : sans accents, minuscules, séparateurs unifiés. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Déduit (numéro de campagne, nom canonique) d'un nom de fichier signé.
 * Retire l'extension, le préfixe C{n}, les tokens « contrat » et les suffixes
 * de signature (« signé », « signed », « sign »…).
 */
export function parseSignedFileName(filename: string): { num: number | null; name: string } {
  const base = filename.replace(/\.[a-z0-9]+$/i, ""); // sans extension
  const numMatch = base.match(/^\s*C?\s*(\d+)[\s_.-]+/i);
  const num = numMatch ? Number(numMatch[1]) : null;
  const afterNum = numMatch ? base.slice(numMatch[0].length) : base;

  // Canonise puis retire les tokens parasites (contrat / signature).
  const tokens = normalizeName(afterNum)
    .split(" ")
    .filter((t) => t && !/^(contrat|contract|signe|signed|sign|final|v\d+)$/.test(t));

  return { num, name: tokens.join(" ") };
}

/**
 * Rattache un nom de fichier à l'un des artistes candidats (par nom canonique).
 * Retourne l'artist_id le mieux apparié, ou null. Si `campaignNumber` est connu
 * et que le fichier porte un numéro différent, on refuse (évite un C2 sur un C3).
 */
export function matchSignedToArtist(
  filename: string,
  candidates: { artist_id: string; full_name: string }[],
  campaignNumber: number | null,
): string | null {
  const parsed = parseSignedFileName(filename);
  if (!parsed.name) return null;
  if (campaignNumber != null && parsed.num != null && parsed.num !== campaignNumber) return null;

  // Égalité exacte du nom canonique en priorité, sinon inclusion (préfixe/suffixe).
  let exact: string | null = null;
  let loose: string | null = null;
  for (const c of candidates) {
    const cn = normalizeName(c.full_name);
    if (!cn) continue;
    if (cn === parsed.name) {
      if (exact) return null; // ambigu : deux artistes au même nom canonique
      exact = c.artist_id;
    } else if (parsed.name.includes(cn) || cn.includes(parsed.name)) {
      loose = loose === null ? c.artist_id : "__ambig__";
    }
  }
  if (exact) return exact;
  return loose && loose !== "__ambig__" ? loose : null;
}
