import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/types/database";
import { resolveOeuvre } from "./sku";

type SB = SupabaseClient<Database>;

/* ------------------------------------------------------------------ */
/* Payload Shopify (sous-ensemble des champs utilisés)                */
/* ------------------------------------------------------------------ */

export type ShopifyLineItem = {
  id?: number | string;
  sku?: string | null;
  title?: string | null;
  name?: string | null;
  quantity?: number;
  price?: string | number | null;
};

export type ShopifyOrder = {
  id?: number | string;
  name?: string | null; // "#1042"
  email?: string | null;
  contact_email?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
  cancelled_at?: string | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  subtotal_price?: string | number | null;
  total_price?: string | number | null;
  total_shipping_price_set?: { shop_money?: { amount?: string | number } } | null;
  current_subtotal_price?: string | number | null;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
  shipping_address?: { name?: string | null } | null;
  billing_address?: { name?: string | null } | null;
  line_items?: ShopifyLineItem[];
};

const nz = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};

/* ------------------------------------------------------------------ */
/* Mapping                                                            */
/* ------------------------------------------------------------------ */

export type MappedLine = {
  shopify_line_item_id: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  title_snapshot: string | null;
};

export type MappedOrder = {
  shopify_order_id: string | null;
  order_number: string;
  client_name: string;
  client_email: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  subtotal_amount: number; // hors frais de port — assiette de commission
  shipping_amount: number;
  total_amount: number;
  order_date: string;
  lines: MappedLine[];
};

/**
 * Normalise une commande Shopify. Le montant retenu pour tous les calculs est le
 * SUBTOTAL (hors frais de port) : le contrat artiste exclut le port de l'assiette
 * de commission.
 */
export function mapShopifyOrder(payload: ShopifyOrder): MappedOrder {
  const lines: MappedLine[] = (payload.line_items ?? []).map((li) => {
    const qty = li.quantity ?? 1;
    const unit = nz(li.price);
    return {
      shopify_line_item_id: li.id != null ? String(li.id) : null,
      sku: (li.sku ?? "").trim() || null,
      quantity: qty,
      unit_price: unit,
      total_price: Math.round(unit * qty * 100) / 100,
      title_snapshot: li.title ?? li.name ?? null,
    };
  });

  const shipping = nz(payload.total_shipping_price_set?.shop_money?.amount);
  const subtotal =
    payload.subtotal_price != null
      ? nz(payload.subtotal_price)
      : lines.reduce((s, l) => s + l.total_price, 0);

  const clientName =
    payload.shipping_address?.name ||
    payload.billing_address?.name ||
    [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(" ") ||
    "Client Shopify";

  return {
    shopify_order_id: payload.id != null ? String(payload.id) : null,
    order_number: payload.name?.trim() || (payload.id != null ? `#${payload.id}` : "—"),
    client_name: clientName,
    client_email: payload.email || payload.contact_email || null,
    // Une commande annulée ne doit jamais compter dans les ventes (les stats ne
    // retiennent que 'paid'), même si Shopify garde financial_status = 'paid'.
    financial_status: payload.cancelled_at ? "cancelled" : (payload.financial_status ?? null),
    fulfillment_status: payload.fulfillment_status ?? null,
    subtotal_amount: subtotal,
    shipping_amount: shipping,
    total_amount: nz(payload.total_price),
    order_date: payload.processed_at || payload.created_at || new Date().toISOString(),
    lines,
  };
}

/** Rattache la commande à la campagne dont la période contient sa date. */
export async function assignOrderToDrop(supabase: SB, orderDateIso: string): Promise<string | null> {
  const day = orderDateIso.slice(0, 10);
  const { data } = await supabase
    .from("drops")
    .select("id, start_date, end_date")
    .lte("start_date", day)
    .gte("end_date", day)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Vague d'impression (impressions 2×/mois). Si la campagne porte ses dates
 * d'impression, on les utilise ; sinon repli sur le jour du mois (≤15 → "1").
 */
export async function assignOrderToWave(
  supabase: SB,
  orderDateIso: string,
  dropId: string | null,
): Promise<string | null> {
  const day = orderDateIso.slice(0, 10);
  if (dropId) {
    const { data: d } = await supabase
      .from("drops")
      .select("date_impression_1, date_impression_2")
      .eq("id", dropId)
      .maybeSingle();
    if (d?.date_impression_1 && day <= d.date_impression_1) return "1";
    if (d?.date_impression_2 && day <= d.date_impression_2) return "2";
    if (d?.date_impression_1 || d?.date_impression_2) return "2";
  }
  return Number(day.slice(8, 10)) <= 15 ? "1" : "2";
}

/* ------------------------------------------------------------------ */
/* Écriture (upsert idempotent par shopify_order_id)                  */
/* ------------------------------------------------------------------ */

export type UpsertResult = { orderId: string; unresolved: number };

/**
 * Crée ou met à jour une commande Shopify + ses lignes. Idempotent : la commande
 * est identifiée par shopify_order_id ; ses lignes sont remplacées à chaque appel.
 * Un SKU non résolu n'interrompt jamais : la ligne est écrite avec oeuvre_id null
 * et remonte ensuite dans « SKU non résolus ».
 * NE TOUCHE À AUCUN COMPTEUR : les stats viennent des vues (oeuvre_stats).
 */
export async function upsertOrderFromShopify(supabase: SB, payload: ShopifyOrder): Promise<UpsertResult> {
  const m = mapShopifyOrder(payload);
  const dropId = await assignOrderToDrop(supabase, m.order_date);
  const wave = await assignOrderToWave(supabase, m.order_date, dropId);

  // Commande existante ?
  let orderId: string | null = null;
  if (m.shopify_order_id) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("shopify_order_id", m.shopify_order_id)
      .maybeSingle();
    orderId = existing?.id ?? null;
  }

  // Commande annulée jamais importée → on ne la crée pas (évite le bruit).
  if (payload.cancelled_at && !orderId) return { orderId: "", unresolved: 0 };

  const orderRow: TablesInsert<"orders"> = {
    shopify_order_id: m.shopify_order_id,
    order_number: m.order_number,
    client_name: m.client_name,
    client_email: m.client_email,
    total_amount: m.total_amount,
    subtotal_amount: m.subtotal_amount,
    shipping_amount: m.shipping_amount,
    financial_status: m.financial_status,
    fulfillment_status: m.fulfillment_status,
    status: "en attente",
    wave,
    drop_id: dropId,
    raw_payload: payload as unknown as Database["public"]["Tables"]["orders"]["Insert"]["raw_payload"],
    synced_at: new Date().toISOString(),
  };

  if (orderId) {
    // On ne réécrit pas le statut interne déjà géré côté équipe.
    const { status: _s, ...rest } = orderRow;
    void _s;
    const { error } = await supabase.from("orders").update(rest).eq("id", orderId);
    if (error) throw error;
    await supabase.from("order_items").delete().eq("order_id", orderId);
  } else {
    const { data, error } = await supabase.from("orders").insert(orderRow).select("id").single();
    if (error) throw error;
    orderId = data.id;
  }

  // Lignes : résolution SKU → oeuvre_id (jamais bloquant).
  let unresolved = 0;
  const rows: TablesInsert<"order_items">[] = [];
  for (const l of m.lines) {
    const oeuvre = await resolveOeuvre(supabase, l.sku);
    if (!oeuvre) unresolved++;
    rows.push({
      order_id: orderId,
      oeuvre_id: oeuvre?.id ?? null,
      sku: l.sku,
      shopify_line_item_id: l.shopify_line_item_id,
      title_snapshot: l.title_snapshot,
      quantity: l.quantity,
      unit_price: l.unit_price,
      total_price: l.total_price,
    });
  }
  if (rows.length) {
    const { error } = await supabase.from("order_items").insert(rows);
    if (error) throw error;
  }

  return { orderId, unresolved };
}

/** Met à jour le statut financier d'une commande (orders/paid, refunds/create). */
export async function updateFinancialStatus(
  supabase: SB,
  shopifyOrderId: string,
  financialStatus: string,
): Promise<void> {
  await supabase
    .from("orders")
    .update({ financial_status: financialStatus, synced_at: new Date().toISOString() })
    .eq("shopify_order_id", shopifyOrderId);
}

/**
 * Marque une commande annulée (orders/cancelled). `orders.status` n'a pas de
 * valeur « annulé » (statut logistique : en attente/imprimé/expédié), donc on
 * porte l'annulation sur financial_status — les stats l'excluent déjà (elles ne
 * comptent que financial_status = 'paid').
 */
export async function markOrderCancelled(supabase: SB, shopifyOrderId: string): Promise<void> {
  await supabase
    .from("orders")
    .update({ financial_status: "cancelled", synced_at: new Date().toISOString() })
    .eq("shopify_order_id", shopifyOrderId);
}

/* ------------------------------------------------------------------ */
/* Dispatcher (utilisé par le webhook ET l'import de rattrapage)      */
/* ------------------------------------------------------------------ */

export async function processShopifyTopic(
  supabase: SB,
  topic: string,
  payload: Record<string, unknown>,
): Promise<{ unresolved?: number }> {
  switch (topic) {
    case "orders/create":
    case "orders/updated":
    case "orders/paid": {
      const res = await upsertOrderFromShopify(supabase, payload as ShopifyOrder);
      return { unresolved: res.unresolved };
    }
    case "orders/cancelled": {
      const id = payload.id != null ? String(payload.id) : null;
      if (id) await markOrderCancelled(supabase, id);
      return {};
    }
    case "refunds/create": {
      // payload.order_id référence la commande ; on la repasse au statut Shopify.
      const orderId = (payload.order_id ?? (payload.refund as { order_id?: unknown })?.order_id) as
        | string
        | number
        | undefined;
      if (orderId != null) await updateFinancialStatus(supabase, String(orderId), "refunded");
      return {};
    }
    default:
      return {};
  }
}
