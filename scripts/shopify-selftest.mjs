// Tests d'intégration Shopify (Étape 8) — exécutable, nettoie ce qu'il crée.
//   node scripts/shopify-selftest.mjs [url_webhook]
// Par défaut, cible la prod : https://app.aldo-editions.com/api/webhooks/shopify
// Vérifie : (A) webhook signé → commande + résolution SKU + idempotence,
//           (B) SKU inconnu non bloquant, (C) stats distinctes par campagne.
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const t = line.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
const URL = process.argv[2] || "https://app.aldo-editions.com/api/webhooks/shopify";
const SECRET = env.SHOPIFY_WEBHOOK_SECRET;
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const results = [];
const ok = (name, cond, detail = "") => { results.push({ name, pass: !!cond, detail }); console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

function sign(body) { return createHmac("sha256", SECRET).update(body, "utf8").digest("base64"); }
async function sendWebhook(topic, webhookId, payload) {
  const body = JSON.stringify(payload);
  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Hmac-Sha256": sign(body), "X-Shopify-Topic": topic, "X-Shopify-Webhook-Id": webhookId },
    body,
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
const order = (id, sku, qty, price) => ({
  id, name: `#SELFTEST-${id}`, email: "selftest@aldo.test", created_at: new Date().toISOString(),
  financial_status: "paid", subtotal_price: String(qty * price), total_price: String(qty * price + 5),
  total_shipping_price_set: { shop_money: { amount: "5.00" } },
  line_items: [{ id: 1, sku, title: "Selftest", quantity: qty, price: String(price) }],
});

const OID_A = "990000001", OID_B = "990000002";
const cleanup = async () => {
  const { data: os } = await s.from("orders").select("id").in("shopify_order_id", [OID_A, OID_B]);
  for (const o of os ?? []) await s.from("order_items").delete().eq("order_id", o.id);
  await s.from("orders").delete().in("shopify_order_id", [OID_A, OID_B]);
  await s.from("webhook_events").delete().like("shopify_webhook_id", "selftest-%");
};

try {
  if (!SECRET) { console.error("SHOPIFY_WEBHOOK_SECRET manquant"); process.exit(1); }
  await cleanup(); // état propre

  // Signature invalide → 401
  const bad = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Hmac-Sha256": "invalide", "X-Shopify-Topic": "orders/create", "X-Shopify-Webhook-Id": "selftest-bad" }, body: "{}" });
  ok("Signature invalide rejetée (401)", bad.status === 401, `status ${bad.status}`);

  // (A) Webhook signé → commande + résolution SKU
  const { data: known } = await s.from("oeuvres").select("id, sku").not("sku", "is", null).limit(1).maybeSingle();
  const wA = "selftest-A-" + Date.now();
  const rA = await sendWebhook("orders/create", wA, order(OID_A, known.sku, 1, 30));
  ok("Webhook signé accepté (200)", rA.status === 200, `status ${rA.status}`);
  await new Promise((r) => setTimeout(r, 600));
  const { data: oA } = await s.from("orders").select("id, financial_status, subtotal_amount").eq("shopify_order_id", OID_A).maybeSingle();
  ok("Commande créée", !!oA);
  ok("Assiette = subtotal (hors port)", oA?.subtotal_amount === 30, `subtotal_amount=${oA?.subtotal_amount}`);
  const { data: iA } = await s.from("order_items").select("oeuvre_id, sku").eq("order_id", oA?.id ?? "").maybeSingle();
  ok("SKU connu résolu vers l'œuvre", iA?.oeuvre_id === known.id, `oeuvre_id=${iA?.oeuvre_id}`);

  // (A bis) Idempotence : même webhook-id rejoué → pas de doublon
  const rA2 = await sendWebhook("orders/create", wA, order(OID_A, known.sku, 1, 30));
  ok("Rejeu même webhook-id → 200 duplicate", rA2.status === 200 && rA2.json.duplicate === true, JSON.stringify(rA2.json));
  const { count: nA } = await s.from("orders").select("*", { count: "exact", head: true }).eq("shopify_order_id", OID_A);
  ok("Pas de commande dupliquée", nA === 1, `count=${nA}`);
  const { count: nE } = await s.from("webhook_events").select("*", { count: "exact", head: true }).eq("shopify_webhook_id", wA);
  ok("Un seul webhook_event enregistré", nE === 1, `count=${nE}`);

  // (B) SKU inconnu → non bloquant
  const rB = await sendWebhook("orders/create", "selftest-B-" + Date.now(), order(OID_B, "ALDO-ZZ-999-A4", 1, 20));
  ok("SKU inconnu : webhook non bloqué (200)", rB.status === 200, `status ${rB.status}`);
  await new Promise((r) => setTimeout(r, 600));
  const { data: oB } = await s.from("orders").select("id").eq("shopify_order_id", OID_B).maybeSingle();
  const { data: iB } = await s.from("order_items").select("oeuvre_id, sku").eq("order_id", oB?.id ?? "").maybeSingle();
  ok("Commande créée malgré SKU inconnu", !!oB);
  ok("Ligne écrite avec oeuvre_id null + SKU brut", iB && iB.oeuvre_id === null && iB.sku === "ALDO-ZZ-999-A4");

  // (C) Stats distinctes par campagne (synthétique, en base, nettoyé)
  const { data: oe } = await s.from("oeuvres").select("id").limit(1).maybeSingle();
  const d1 = (await s.from("drops").insert({ name: "SELFTEST D1", status: "terminé", start_date: "2020-01-01", end_date: "2020-01-31" }).select("id").single()).data;
  const d2 = (await s.from("drops").insert({ name: "SELFTEST D2", status: "terminé", start_date: "2020-02-01", end_date: "2020-02-28" }).select("id").single()).data;
  const mkOrder = async (dropId, qty) => {
    const o = (await s.from("orders").insert({ order_number: "SELFTEST-" + Math.random().toString(36).slice(2, 7), client_name: "Selftest", total_amount: qty * 10, status: "en attente", financial_status: "paid", drop_id: dropId }).select("id").single()).data;
    await s.from("order_items").insert({ order_id: o.id, oeuvre_id: oe.id, quantity: qty, unit_price: 10, total_price: qty * 10 });
    return o.id;
  };
  const oc1 = await mkOrder(d1.id, 1);
  const oc2 = await mkOrder(d2.id, 2);
  const { data: st } = await s.from("oeuvre_stats").select("drop_id, nb_ventes").eq("oeuvre_id", oe.id).in("drop_id", [d1.id, d2.id]);
  const byDrop = new Map((st ?? []).map((x) => [x.drop_id, x.nb_ventes]));
  ok("Stats distinctes par campagne", byDrop.get(d1.id) === 1 && byDrop.get(d2.id) === 2, `D1=${byDrop.get(d1.id)} D2=${byDrop.get(d2.id)}`);
  const { data: tot } = await s.from("oeuvre_stats_total").select("nb_ventes").eq("oeuvre_id", oe.id).maybeSingle();
  ok("Total historique = somme des campagnes (≥3)", (tot?.nb_ventes ?? 0) >= 3, `total=${tot?.nb_ventes}`);
  // cleanup C
  for (const id of [oc1, oc2]) await s.from("order_items").delete().eq("order_id", id);
  await s.from("orders").delete().in("id", [oc1, oc2]);
  await s.from("drops").delete().in("id", [d1.id, d2.id]);
} finally {
  await cleanup();
}

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== ${passed}/${results.length} tests OK ===`);
process.exit(passed === results.length ? 0 : 1);
