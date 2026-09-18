import "server-only";

/** Accès à l'API Admin Shopify (serveur uniquement). */
const API_VERSION = "2024-10";

export function shopifyEnv(): { shop: string; token: string; base: string } | null {
  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!shop || !token) return null;
  return { shop, token, base: `https://${shop}/admin/api/${API_VERSION}` };
}

/** GET Admin API → JSON. Lève une erreur lisible en cas d'échec. */
export async function shopifyGet<T = unknown>(path: string): Promise<T> {
  const e = shopifyEnv();
  if (!e) throw new Error("Configuration Shopify manquante (SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_ACCESS_TOKEN).");
  const r = await fetch(`${e.base}${path}`, {
    headers: { "X-Shopify-Access-Token": e.token },
    cache: "no-store",
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Shopify ${r.status} — ${body.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
}
