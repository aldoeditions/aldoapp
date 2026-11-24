import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { decryptSensitive } from "@/lib/crypto";
import { getGoogleDriveConfig, GOOGLE_OAUTH_SCOPE } from "./config";

/**
 * OAuth 2.0 UTILISATEUR Google (compte contact@aldo-editions.com), connecté
 * depuis Paramètres. Le refresh token est stocké CHIFFRÉ dans
 * `company_settings` (même mécanisme que `lib/crypto.ts`, clé `ARTIST_DATA_KEY`).
 *
 * L'app Google est en mode « Test » : le refresh token expire au bout de
 * 7 jours sans reconnexion (limite Google, pas un bug) — d'où la date de
 * connexion affichée dans Paramètres.
 */

type Db = SupabaseClient<Database>;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/** URL de l'écran de consentement Google (access_type=offline + prompt=consent → refresh token garanti). */
export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleDriveConfig();
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export type GoogleTokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

/** Échange le `code` de retour contre un access token + (normalement) un refresh token. */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getGoogleDriveConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Échange du code Google refusé (${res.status})${detail ? ` : ${detail.slice(0, 200)}` : ""}.`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

/** E-mail du compte connecté (pour l'affichage « Connecté en tant que … »). */
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

/** Révoque le refresh token côté Google (best-effort, appelé à la déconnexion). */
export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" }).catch(() => {});
}

let cached: { token: string; expiresAt: number } | null = null;

/** Vide le cache en mémoire (à appeler à la déconnexion). */
export function clearDriveTokenCache(): void {
  cached = null;
}

/**
 * Access token Drive courant (rafraîchi depuis le refresh token stocké).
 * Erreur CLAIRE et distincte si Drive n'est pas connecté vs connexion expirée/révoquée.
 */
export async function getDriveAccessToken(admin: Db): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) return cached.token;

  const { data } = await admin
    .from("company_settings")
    .select("google_drive_refresh_token_enc")
    .eq("id", 1)
    .maybeSingle();
  const refreshToken = decryptSensitive(data?.google_drive_refresh_token_enc ?? null);
  if (!refreshToken) {
    throw new Error("Google Drive n'est pas connecté — connecte-le dans Paramètres.");
  }

  const { clientId, clientSecret } = getGoogleDriveConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 400 && /invalid_grant/i.test(detail)) {
      throw new Error("Connexion Google Drive expirée ou révoquée — reconnecte-la dans Paramètres.");
    }
    throw new Error(`Authentification Google Drive refusée (${res.status}).`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return cached.token;
}
