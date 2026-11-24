import "server-only";

/**
 * Configuration Google Drive (classement des contrats signés, Phase 3 du
 * connecteur Aldo). Compte de service Google Cloud, accès au dossier
 * `ALDO/Artistes` par PARTAGE (pas de rôle IAM projet) — voir REPRISE.md pour
 * la marche à suivre pas à pas.
 *
 * `GOOGLE_SERVICE_ACCOUNT_JSON` : le JSON **entier** de la clé du compte de
 * service (téléchargé depuis Google Cloud Console), en une seule ligne.
 * `GOOGLE_DRIVE_ARTISTES_FOLDER_ID` : id du dossier Drive `ALDO/Artistes`
 * (dans l'URL du dossier : `drive.google.com/drive/folders/{ID}`).
 */

export type GoogleDriveConfig = {
  clientEmail: string;
  privateKey: string;
  artistesFolderId: string;
};

export function getGoogleDriveConfig(): GoogleDriveConfig {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  const artistesFolderId = (process.env.GOOGLE_DRIVE_ARTISTES_FOLDER_ID || "").trim();
  if (!raw) throw new Error("Classement Drive indisponible : GOOGLE_SERVICE_ACCOUNT_JSON absent.");
  if (!artistesFolderId) throw new Error("Classement Drive indisponible : GOOGLE_DRIVE_ARTISTES_FOLDER_ID absent.");

  let parsed: { client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Classement Drive indisponible : GOOGLE_SERVICE_ACCOUNT_JSON n'est pas un JSON valide.");
  }
  const clientEmail = parsed.client_email || "";
  const privateKey = parsed.private_key || "";
  if (!clientEmail || !privateKey) {
    throw new Error("Classement Drive indisponible : client_email / private_key absents du JSON du compte de service.");
  }
  return { clientEmail, privateKey, artistesFolderId };
}
