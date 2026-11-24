import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { buildGoogleAuthUrl } from "@/lib/gdrive/auth";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/gdrive/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Démarre la connexion Google Drive (bouton « Connecter » de Paramètres).
 * Réservé aux admins (accès « parametres » en écriture). `state` anti-CSRF
 * posé en cookie httpOnly, vérifié au retour par `/api/google/callback`.
 */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!canEdit(user.role, "parametres")) {
    return NextResponse.redirect(new URL("/parametres?drive_error=Acc%C3%A8s%20refus%C3%A9.", req.url));
  }

  let authUrl: string;
  try {
    const state = randomBytes(16).toString("hex");
    authUrl = buildGoogleAuthUrl(state);
    const res = NextResponse.redirect(authUrl);
    res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuration Google Drive manquante.";
    return NextResponse.redirect(new URL(`/parametres?drive_error=${encodeURIComponent(msg)}`, req.url));
  }
}
