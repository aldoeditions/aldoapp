// Vérifie le token Shopify Admin API depuis .env.local (n'affiche aucun secret).
//   node scripts/shopify-ping.mjs
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}

const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER = "2024-10";

if (!shop || !token) {
  console.error("❌ SHOPIFY_STORE_DOMAIN ou SHOPIFY_ADMIN_ACCESS_TOKEN manquant dans .env.local");
  process.exit(1);
}
console.log("Domaine :", shop, "· token", token.slice(0, 6) + "…(" + token.length + " car.)");

const h = { "X-Shopify-Access-Token": token, "Content-Type": "application/json" };
const base = `https://${shop}/admin/api/${VER}`;

async function get(path) {
  try {
    const r = await fetch(`${base}${path}`, { headers: h });
    let body = "";
    try { body = JSON.stringify(await r.json()); } catch { body = "(non-json)"; }
    return `${r.status}  ${body.slice(0, 200)}`;
  } catch (e) {
    return `ERREUR réseau: ${e.message}`;
  }
}

console.log("\nshop.json          :", await get("/shop.json"));
console.log("orders/count       :", await get("/orders/count.json?status=any"));
console.log("products/count     :", await get("/products/count.json"));
try {
  const r = await fetch(`https://${shop}/admin/oauth/access_scopes.json`, { headers: h });
  console.log("scopes accordés    :", r.status, JSON.stringify(await r.json()));
} catch (e) {
  console.log("scopes accordés    : ERREUR", e.message);
}
console.log("\n✅ = status 200 partout. 401/403 = token invalide ou scope manquant.");
