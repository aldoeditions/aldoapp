import { createClient } from "@/lib/supabase/server";

export type UnresolvedItem = {
  id: string;
  sku: string | null;
  title_snapshot: string | null;
  quantity: number;
  order_number: string | null;
  order_date: string | null;
};

/** Lignes de commande dont le SKU n'a pas trouvé d'œuvre (à rattacher à la main). */
export async function getUnresolvedOrderItems(): Promise<UnresolvedItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("order_items")
    .select("id, sku, title_snapshot, quantity, orders(order_number, created_at)")
    .is("oeuvre_id", null)
    .not("sku", "is", null);
  const rows = (data ?? []) as unknown as {
    id: string;
    sku: string | null;
    title_snapshot: string | null;
    quantity: number;
    orders: { order_number: string | null; created_at: string | null } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    title_snapshot: r.title_snapshot,
    quantity: r.quantity,
    order_number: r.orders?.order_number ?? null,
    order_date: r.orders?.created_at ?? null,
  }));
}

export type OeuvreForAttach = { id: string; name: string; sku: string | null; artist_name: string | null };

/** Œuvres proposées pour le rattachement manuel (avec SKU + artiste). */
export async function getOeuvresForAttach(): Promise<OeuvreForAttach[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("oeuvres")
    .select("id, name, sku, format, artists(name)")
    .order("name", { ascending: true });
  const rows = (data ?? []) as unknown as {
    id: string;
    name: string;
    sku: string | null;
    format: string;
    artists: { name: string } | null;
  }[];
  return rows.map((o) => ({
    id: o.id,
    name: `${o.name}`,
    sku: o.sku,
    artist_name: o.artists?.name ?? null,
  }));
}

export type SyncLogRow = {
  id: string;
  type: string | null;
  started_at: string | null;
  finished_at: string | null;
  orders_imported: number | null;
  errors: number | null;
  status: string | null;
};

export type ShopifyOverview = {
  lastWebhookAt: string | null;
  webhookCount: number;
  processedCount: number;
  errorCount: number;
  ordersCount: number;
  unresolvedCount: number;
  syncLog: SyncLogRow[];
};

/** Agrégats pour l'en-tête de la page Sync. */
export async function getShopifyOverview(): Promise<ShopifyOverview> {
  const supabase = createClient();
  const [last, wtotal, wproc, werr, ords, unres, logs] = await Promise.all([
    supabase.from("webhook_events").select("received_at").order("received_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("webhook_events").select("*", { count: "exact", head: true }),
    supabase.from("webhook_events").select("*", { count: "exact", head: true }).eq("processed", true),
    supabase.from("webhook_events").select("*", { count: "exact", head: true }).not("error", "is", null),
    supabase.from("orders").select("*", { count: "exact", head: true }).not("shopify_order_id", "is", null),
    supabase.from("order_items").select("*", { count: "exact", head: true }).is("oeuvre_id", null).not("sku", "is", null),
    supabase.from("sync_log").select("*").order("started_at", { ascending: false }).limit(8),
  ]);
  return {
    lastWebhookAt: last.data?.received_at ?? null,
    webhookCount: wtotal.count ?? 0,
    processedCount: wproc.count ?? 0,
    errorCount: werr.count ?? 0,
    ordersCount: ords.count ?? 0,
    unresolvedCount: unres.count ?? 0,
    syncLog: (logs.data ?? []) as SyncLogRow[],
  };
}
