"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { shopifyEnv, shopifyGet } from "@/lib/shopify/client";
import { upsertOrderFromShopify, type ShopifyOrder } from "@/lib/shopify/sync";

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "parametres")) throw new Error("Accès refusé : droits insuffisants.");
}

/**
 * Rattache manuellement une ligne de commande à une œuvre. Fige le SKU sur
 * l'œuvre si elle n'en a pas encore (le SKU Shopify fait foi).
 */
export async function attachOrderItem(itemId: string, oeuvreId: string): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const { data: item } = await supabase.from("order_items").select("sku").eq("id", itemId).maybeSingle();
    const { error } = await supabase.from("order_items").update({ oeuvre_id: oeuvreId }).eq("id", itemId);
    if (error) return { error: error.message };

    // Fige le SKU sur l'œuvre si elle n'en a pas.
    if (item?.sku) {
      const { data: o } = await supabase.from("oeuvres").select("sku").eq("id", oeuvreId).maybeSingle();
      if (o && !o.sku) await supabase.from("oeuvres").update({ sku: item.sku }).eq("id", oeuvreId);
    }

    revalidatePath("/parametres/shopify");
    revalidatePath("/commandes");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}

/** Test de connexion à l'API Admin Shopify. */
export async function pingShopify(): Promise<{ ok: boolean; shop?: string; error?: string }> {
  try {
    await assertCanEdit();
    if (!shopifyEnv()) return { ok: false, error: "Variables SHOPIFY_* absentes de l'environnement." };
    const data = await shopifyGet<{ shop: { name: string; domain: string } }>("/shop.json");
    return { ok: true, shop: data.shop?.name };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec." };
  }
}

/**
 * Import de rattrapage : récupère les commandes Shopify des N derniers jours et
 * les (ré)importe (idempotent par shopify_order_id). Trace le résultat dans sync_log.
 */
export async function syncRecentOrders(days: number): Promise<{ imported: number; unresolved: number; error?: string }> {
  try {
    await assertCanEdit();
    if (!shopifyEnv()) return { imported: 0, unresolved: 0, error: "Configuration Shopify manquante." };
    const admin = createAdminClient();

    const started = new Date().toISOString();
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const data = await shopifyGet<{ orders: ShopifyOrder[] }>(
      `/orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(since)}`,
    );
    const orders = data.orders ?? [];

    let imported = 0;
    let unresolved = 0;
    let errors = 0;
    for (const o of orders) {
      try {
        const res = await upsertOrderFromShopify(admin, o);
        imported++;
        unresolved += res.unresolved;
      } catch {
        errors++;
      }
    }

    await admin.from("sync_log").insert({
      type: `manuel ${days}j`,
      started_at: started,
      finished_at: new Date().toISOString(),
      orders_imported: imported,
      errors,
      status: errors ? "avec erreurs" : "ok",
    });

    revalidatePath("/parametres/shopify");
    revalidatePath("/commandes");
    return { imported, unresolved };
  } catch (e) {
    return { imported: 0, unresolved: 0, error: e instanceof Error ? e.message : "Erreur." };
  }
}
