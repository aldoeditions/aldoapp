import "server-only";

/**
 * Configuration DocuSeal (signature électronique). Les secrets viennent de
 * l'environnement (Vercel) et ne sont JAMAIS exposés côté client ni au MCP.
 *
 * Vérifié dans la doc DocuSeal (23/11/2026) :
 *  - hôte UE : https://api.docuseal.eu ; en-tête d'auth : `X-Auth-Token` ;
 *  - webhooks signés HMAC-SHA256 dans l'en-tête `X-Docuseal-Signature`
 *    (format `timestamp.signature`, contenu signé `timestamp.corps_brut`) ;
 *  - pas de paramètre de langue à l'API : la langue vient des réglages du compte.
 */

export const DOCUSEAL_ROLE_ARTISTE = "Artiste";

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
  const apiUrl = (process.env.DOCUSEAL_API_URL || "https://api.docuseal.eu").replace(/\/+$/, "");
  const apiKey = process.env.DOCUSEAL_API_KEY || "";
  if (!apiKey) throw new Error("Signature indisponible : clé API DocuSeal absente (DOCUSEAL_API_KEY).");
  return { apiUrl, apiKey };
}

/** Secret du webhook (onglet HMAC de DocuSeal, valeur `whsec_…`). */
export function getDocusealWebhookSecret(): string | null {
  return process.env.DOCUSEAL_WEBHOOK_SECRET || null;
}
