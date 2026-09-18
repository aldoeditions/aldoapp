import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ⚠️ ROUTE TEMPORAIRE — obtention du token Admin API par OAuth (offline).
 * À SUPPRIMER une fois le SHOPIFY_ADMIN_ACCESS_TOKEN récupéré.
 *
 * Usage :
 *   1. Régler SHOPIFY_API_KEY (= ID client) et SHOPIFY_API_SECRET (= Secret) dans l'env.
 *   2. Ajouter cette URL dans les "Allowed redirection URL(s)" de l'app (dev dashboard) :
 *        https://app.aldo-editions.com/api/shopify/install
 *   3. Ouvrir dans le navigateur (connecté à l'admin boutique) :
 *        https://app.aldo-editions.com/api/shopify/install?shop=xxxx.myshopify.com
 *   4. Approuver → la page affiche { access_token: "shpat_/shpua_..." }.
 *   5. Copier le token dans SHOPIFY_ADMIN_ACCESS_TOKEN, puis SUPPRIMER cette route.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCOPES = "read_orders,read_products";
const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/** Vérifie le HMAC (hex) de la query Shopify avec le client secret. */
function verifyQueryHmac(params: URLSearchParams, secret: string): boolean {
  const hmac = params.get("hmac");
  if (!hmac) return false;
  const message = Array.from(params.entries())
    .filter(([k]) => k !== "hmac" && k !== "signature")
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("&");
  const digest = createHmac("sha256", secret).update(message).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmac);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const key = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!key || !secret) {
    return NextResponse.json(
      { error: "SHOPIFY_API_KEY / SHOPIFY_API_SECRET manquants dans l'environnement." },
      { status: 500 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const shop = (sp.get("shop") ?? process.env.SHOPIFY_STORE_DOMAIN ?? "").toLowerCase();
  if (!SHOP_RE.test(shop)) {
    return NextResponse.json({ error: "Paramètre ?shop=xxxx.myshopify.com invalide." }, { status: 400 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/shopify/install`;
  const code = sp.get("code");

  // ── Démarrage : redirection vers l'écran d'autorisation Shopify ──
  if (!code) {
    const nonce = randomBytes(16).toString("hex");
    const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
    authorize.searchParams.set("client_id", key);
    authorize.searchParams.set("scope", SCOPES);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("state", nonce);
    const res = NextResponse.redirect(authorize.toString());
    res.cookies.set("shopify_oauth_state", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/api/shopify/install",
    });
    return res;
  }

  // ── Callback : vérif HMAC + state, puis échange code → token ──
  if (!verifyQueryHmac(sp, secret)) {
    return NextResponse.json({ error: "Signature (hmac) invalide." }, { status: 401 });
  }
  const cookieState = req.cookies.get("shopify_oauth_state")?.value;
  if (cookieState && cookieState !== sp.get("state")) {
    return NextResponse.json({ error: "State OAuth invalide (rejoue l'installation)." }, { status: 401 });
  }

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: key, client_secret: secret, code }),
  });
  const data = (await tokenRes.json()) as { access_token?: string; scope?: string };
  if (!tokenRes.ok || !data.access_token) {
    return NextResponse.json({ error: "Échec de l'échange du code.", detail: data }, { status: 502 });
  }

  console.log(`[shopify install] token obtenu pour ${shop} (scopes: ${data.scope})`);
  return NextResponse.json({
    ok: true,
    shop,
    access_token: data.access_token,
    scope: data.scope,
    next: "Copie access_token dans SHOPIFY_ADMIN_ACCESS_TOKEN (Vercel + .env.local), puis SUPPRIME cette route.",
  });
}
