import "server-only";

/**
 * Configuration Google Drive (classement des contrats signés, Phase 3 du
 * connecteur Aldo). Accès par OAuth 2.0 UTILISATEUR (compte
 * contact@aldo-editions.com), pas par compte de service : la création de
 * clés de compte de service a été bloquée par Google, et un compte de
 * service n'a de toute façon pas de quota pour écrire dans un « Mon Drive »
 * personnel (seulement dans un Drive partagé).
 *
 * `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` : identifiants du
 * client OAuth « Web » créé dans Google Cloud Console (écran de
 * consentement + URI de redirection autorisée = `{NEXT_PUBLIC_SITE_URL}/api/google/callback`).
 * `GOOGLE_DRIVE_ARTISTES_FOLDER_ID` : id du dossier Drive `ALDO/Artistes`
 * (inchangé depuis la version compte de service).
 */

export type GoogleDriveConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  artistesFolderId: string;
};

export function getGoogleDriveConfig(): GoogleDriveConfig {
  const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  const artistesFolderId = (process.env.GOOGLE_DRIVE_ARTISTES_FOLDER_ID || "").trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google Drive non configuré : GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET absents.");
  }
  if (!siteUrl) throw new Error("Google Drive non configuré : NEXT_PUBLIC_SITE_URL absent.");
  if (!artistesFolderId) throw new Error("Google Drive non configuré : GOOGLE_DRIVE_ARTISTES_FOLDER_ID absent.");

  return { clientId, clientSecret, redirectUri: `${siteUrl}/api/google/callback`, artistesFolderId };
}

export const GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/drive";

/** Cookie httpOnly du `state` anti-CSRF, posé par /api/google/authorize, vérifié par /api/google/callback. */
export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
