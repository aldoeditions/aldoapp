/**
 * Garde-fou de confidentialité du serveur MCP (règle absolue n°1 et n°2 de
 * CLAUDE.md). Aucun outil ne doit renvoyer de donnée sensible : IBAN/BIC,
 * n° de sécurité sociale, adresse postale, date/lieu de naissance, données
 * clients, coûts/marges/contribution diffuseur, contenu de PDF, URL signée
 * vers un bucket privé, clé service_role.
 *
 * Fonctionnement : liste blanche par outil (on ne construit QUE des objets de
 * sortie explicites), PLUS ce filet de sécurité qui parcourt la réponse et
 * échoue si une clé interdite apparaît. Testé par scripts/mcp-redaction-selftest.ts.
 *
 * NB : l'e-mail *professionnel* d'un artiste est autorisé (il sert à l'envoi des
 * contrats). Les e-mails/identités de clients, eux, ne transitent jamais.
 */

/** Motifs de NOMS de champs interdits en sortie. */
const FORBIDDEN_KEY_PATTERNS: RegExp[] = [
  /iban/i,
  /\bbic\b/i,
  /swift/i,
  /rib\b/i,
  /banking|bancaire/i,
  /secu/i,
  /social.?security|ssn/i,
  /\bnir\b/i,
  /birth|naissance/i,
  /address|adresse/i,
  /postal|code_postal/i,
  /\bpdf\b|base64|file_content|contenu/i,
  /signed_?url|signedurl/i,
  /service_?role/i,
  /cost|co[uû]t/i,
  /marge|margin/i,
  /packaging/i,
  /impression/i,
  /resultat_net|benefice|profit/i,
  /diffuseur/i,
  /client|customer|acheteur/i,
];

/** Motifs de VALEURS qui ressemblent à des données sensibles (filet grossier). */
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/;

export class SensitiveLeakError extends Error {
  constructor(tool: string, where: string) {
    super(`Fuite potentielle de donnée sensible (outil « ${tool} », champ « ${where} »).`);
    this.name = "SensitiveLeakError";
  }
}

function keyIsForbidden(key: string): boolean {
  return FORBIDDEN_KEY_PATTERNS.some((re) => re.test(key));
}

/**
 * Parcourt récursivement une valeur de sortie et lève SensitiveLeakError si une
 * clé interdite ou une valeur de type IBAN est détectée. À appeler sur TOUT
 * résultat d'outil avant de le renvoyer.
 */
export function assertNoSensitive(value: unknown, tool: string, path = ""): void {
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    if (IBAN_RE.test(value.replace(/\s/g, ""))) {
      throw new SensitiveLeakError(tool, `${path} (valeur de type IBAN)`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoSensitive(v, tool, `${path}[${i}]`));
    return;
  }

  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (keyIsForbidden(k)) throw new SensitiveLeakError(tool, path ? `${path}.${k}` : k);
      assertNoSensitive(v, tool, path ? `${path}.${k}` : k);
    }
  }
}
