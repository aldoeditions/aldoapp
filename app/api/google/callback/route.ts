import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSensitive } from "@/lib/crypto";
import { exchangeCodeForTokens, fetchGoogleEmail, clearDriveTokenCache } from "@/lib/gdrive/auth";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/gdrive/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Retour de l'écran de consentement Google. Stocke le refresh token CHIFFRÉ. */
export async function GET(req: NextRequest) {
  const fail = (msg: string) => {
    const res = NextResponse.redirect(new URL(`/parametres?drive_error=${encodeURIComponent(msg)}`, req.url));
    res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return res;
  };

  const user = await requireUser();
  if (!canEdit(user.role, "parametres")) return fail("Accès refusé.");

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) return fail("Connexion refusée côté Google.");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("Requête invalide (vérification anti-CSRF échouée) — réessaie.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return fail("Google n'a pas renvoyé de refresh token — réessaie (le consentement doit être redemandé).");
    }
    const email = await fetchGoogleEmail(tokens.access_token);
    const admin = createAdminClient();
    const { error: dbError } = await admin
      .from("company_settings")
      .update({
        google_drive_refresh_token_enc: encryptSensitive(tokens.refresh_token),
        google_drive_connected_email: email,
        google_drive_connected_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (dbError) return fail(dbError.message);
    clearDriveTokenCache();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Échec de la connexion Google Drive.");
  }

  const res = NextResponse.redirect(new URL("/parametres?drive_connected=1", req.url));
  res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return res;
}
