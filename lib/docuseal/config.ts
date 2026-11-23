import "server-only";

/**
 * Configuration DocuSeal (signature électronique). Les secrets viennent de
 * l'environnement (Vercel) et ne sont JAMAIS exposés côté client ni au MCP.
 *
 * Le compte Aldo est sur docuseal.com (hôte global `https://api.docuseal.com`).
 * L'hôte reste pilotable par `DOCUSEAL_API_URL` (il existe aussi un hôte UE
 * `https://api.docuseal.eu` pour les comptes de la région UE — pas le nôtre).
 *
 * Vérifié dans la doc DocuSeal (23/11/2026) :
 *  - en-tête d'auth : `X-Auth-Token` ;
 *  - webhooks signés HMAC-SHA256 dans l'en-tête `X-Docuseal-Signature`
 *    (format `timestamp.signature`, contenu signé `timestamp.corps_brut`) ;
 *  - pas de paramètre de langue à l'API : la langue vient des réglages du compte.
 */

export const DOCUSEAL_ROLE_ARTISTE = "Artiste";
export const DOCUSEAL_ROLE_ALDO = "Aldo";

/** Événements de webhook (cf. doc « Webhook »). */
export const DOCUSEAL_EVENTS = {
  formCompleted: "form.completed",
  submissionCompleted: "submission.completed",
  formDeclined: "form.declined",
} as const;

export type DocusealConfig = {
  apiUrl: string;
  apiKey: string;
};

/** Config API (URL + clé). Lève si un secret manque (message lisible). */
export function getDocusealConfig(): DocusealConfig {
  const apiUrl = (process.env.DOCUSEAL_API_URL || "https://api.docuseal.com").replace(/\/+$/, "");
  const apiKey = process.env.DOCUSEAL_API_KEY || "";
  if (!apiKey) throw new Error("Signature indisponible : clé API DocuSeal absente (DOCUSEAL_API_KEY).");
  return { apiUrl, apiKey };
}

/** Secret du webhook (onglet HMAC de DocuSeal, valeur `whsec_…`). */
export function getDocusealWebhookSecret(): string | null {
  return process.env.DOCUSEAL_WEBHOOK_SECRET || null;
}
