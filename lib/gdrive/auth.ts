import "server-only";
import { createSign } from "node:crypto";
import { getGoogleDriveConfig } from "./config";

/**
 * Authentification OAuth2 du compte de service Google, SANS dépendance (JWT
 * signé à la main avec `node:crypto`, comme la vérification HMAC du webhook
 * DocuSeal). Flux "Service Account" standard :
 *   1. on signe un JWT (RS256) avec la clé privée du compte de service ;
 *   2. on l'échange contre un access token auprès de Google.
 * Portée `drive` (lecture/écriture) : nécessaire pour retrouver un dossier
 * déjà partagé avec le compte de service (la portée `drive.file` ne verrait
 * que les fichiers créés par l'app elle-même).
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signJwt(clientEmail: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256").update(signingInput).sign(privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

let cached: { token: string; expiresAt: number } | null = null;

/** Access token Google (mis en cache en mémoire pour la durée de vie de l'instance). */
export async function getDriveAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) return cached.token;

  const { clientEmail, privateKey } = getGoogleDriveConfig();
  const assertion = signJwt(clientEmail, privateKey);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Authentification Google Drive refusée (${res.status})${detail ? ` : ${detail.slice(0, 200)}` : ""}.`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return cached.token;
}
