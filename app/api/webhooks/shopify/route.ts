import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processShopifyTopic } from "@/lib/shopify/sync";
import type { Json } from "@/types/database";

// Node runtime obligatoire (crypto + service_role) ; jamais mis en cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vérifie la signature HMAC-SHA256 du body brut (base64) en temps constant. */
function verifyHmac(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[shopify webhook] SHOPIFY_WEBHOOK_SECRET manquant");
    return new NextResponse("Config manquante", { status: 500 });
  }

  // 1. Body BRUT avant tout parsing (indispensable pour la signature).
  const raw = await req.text();

  // 2. Vérification HMAC.
  if (!verifyHmac(raw, req.headers.get("x-shopify-hmac-sha256"), secret)) {
    return new NextResponse("Signature invalide", { status: 401 });
  }

  const webhookId = req.headers.get("x-shopify-webhook-id");
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const admin = createAdminClient();

  // 3. Idempotence : déjà reçu → 200 immédiat, sans retraiter.
  if (webhookId) {
    const { data: seen } = await admin
      .from("webhook_events")
      .select("id")
      .eq("shopify_webhook_id", webhookId)
      .maybeSingle();
    if (seen) return NextResponse.json({ ok: true, duplicate: true });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Corps illisible : on l'archive quand même pour trace, sans traiter.
  }

  // 4. Enregistrer l'événement AVANT traitement.
  const { data: event, error: insErr } = await admin
    .from("webhook_events")
    .insert({ shopify_webhook_id: webhookId, topic, payload: payload as Json, processed: false })
    .select("id")
    .single();

  // Course : un doublon inséré entre-temps (contrainte unique) → déjà pris en charge.
  if (insErr) {
    if (insErr.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    console.error("[shopify webhook] insert event:", insErr.message);
    return new NextResponse("Erreur interne", { status: 500 });
  }

  // 5. Traitement (rapide — Shopify coupe à 5 s), puis marquage.
  try {
    await processShopifyTopic(admin, topic, payload);
    await admin.from("webhook_events").update({ processed: true }).eq("id", event.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur de traitement";
    await admin.from("webhook_events").update({ processed: false, error: msg }).eq("id", event.id);
    console.error(`[shopify webhook] ${topic}:`, msg);
    // On répond quand même 200 : l'événement est archivé, rejouable depuis l'UI.
  }

  return NextResponse.json({ ok: true });
}
