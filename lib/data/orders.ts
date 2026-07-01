import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/database";

export type OrdersFilter = {
  status?: string;
  wave?: string;
  drop?: string;
  q?: string;
};

export type OrderRow = Order & { drop_name: string | null; nb_pieces: number };

/** Liste des commandes (+ nom du drop, nb de pièces). */
export async function getOrders(filter: OrdersFilter = {}): Promise<OrderRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("orders")
    .select("*, drops(name)")
    .order("created_at", { ascending: false });

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.wave) query = query.eq("wave", filter.wave);
  if (filter.drop) query = query.eq("drop_id", filter.drop);
  if (filter.q) query = query.ilike("client_name", `%${filter.q}%`);

  const [ordersRes, itemsRes] = await Promise.all([
    query.returns<(Order & { drops: { name: string } | null })[]>(),
    supabase.from("order_items").select("order_id, quantity"),
  ]);

  const pieces = new Map<string, number>();
  for (const it of itemsRes.data ?? []) {
    pieces.set(it.order_id, (pieces.get(it.order_id) ?? 0) + (it.quantity ?? 0));
  }

  return (ordersRes.data ?? []).map((o) => {
    const { drops, ...rest } = o;
    return { ...rest, drop_name: drops?.name ?? null, nb_pieces: pieces.get(o.id) ?? 0 };
  });
}

export type OrderItemDetail = OrderItem & {
  oeuvre_name: string | null;
  oeuvre_format: string | null;
};

export type OrderDetail = {
  order: Order & { drop_name: string | null };
  items: OrderItemDetail[];
};

/** Détail d'une commande : infos + articles (œuvre, format). */
export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, drops(name)")
    .eq("id", id)
    .maybeSingle<Order & { drops: { name: string } | null }>();
  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*, oeuvres(name, format)")
    .eq("order_id", id)
    .returns<(OrderItem & { oeuvres: { name: string; format: string } | null })[]>();

  const { drops, ...orderRest } = order;

  return {
    order: { ...orderRest, drop_name: drops?.name ?? null },
    items: (items ?? []).map((it) => {
      const { oeuvres, ...rest } = it;
      return {
        ...rest,
        oeuvre_name: oeuvres?.name ?? null,
        oeuvre_format: oeuvres?.format ?? null,
      };
    }),
  };
}

export type WaveSummary = {
  wave: string;
  nb_orders: number;
  total: number;
  statuses: string[];
};

/** Récap par vague : nb commandes, CA, statuts présents. */
export async function getWaves(): Promise<WaveSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("wave, total_amount, status")
    .not("wave", "is", null);

  const map = new Map<string, WaveSummary>();
  for (const o of data ?? []) {
    const w = o.wave as string;
    const cur =
      map.get(w) ?? { wave: w, nb_orders: 0, total: 0, statuses: [] };
    cur.nb_orders++;
    cur.total += o.total_amount ?? 0;
    if (o.status && !cur.statuses.includes(o.status)) cur.statuses.push(o.status);
    map.set(w, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.wave.localeCompare(a.wave));
}

export type WaveRecap = {
  wave: string;
  orders: Pick<Order, "id" | "order_number" | "client_name" | "status" | "total_amount">[];
  items: { name: string; format: string; quantity: number }[];
  total: number;
};

/** Détail d'une vague : commandes + articles agrégés à imprimer. */
export async function getWaveRecap(wave: string): Promise<WaveRecap> {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, client_name, status, total_amount")
    .eq("wave", wave)
    .order("order_number", { ascending: true });

  const ids = (orders ?? []).map((o) => o.id);
  let items: WaveRecap["items"] = [];
  if (ids.length) {
    const { data: rows } = await supabase
      .from("order_items")
      .select("quantity, oeuvres(name, format)")
      .in("order_id", ids)
      .returns<{ quantity: number; oeuvres: { name: string; format: string } | null }[]>();

    const agg = new Map<string, { name: string; format: string; quantity: number }>();
    for (const r of rows ?? []) {
      const name = r.oeuvres?.name ?? "—";
      const format = r.oeuvres?.format ?? "—";
      const key = `${name}|${format}`;
      const cur = agg.get(key) ?? { name, format, quantity: 0 };
      cur.quantity += r.quantity ?? 0;
      agg.set(key, cur);
    }
    items = Array.from(agg.values()).sort(
      (a, b) => a.format.localeCompare(b.format) || a.name.localeCompare(b.name),
    );
  }

  const total = (orders ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  return { wave, orders: orders ?? [], items, total };
}

/** Œuvres pour le sélecteur d'articles (id, nom, format, prix, drop). */
export async function getOeuvresForSelect(): Promise<
  { id: string; name: string; format: string; price: number; drop_id: string | null }[]
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("oeuvres")
    .select("id, name, format, price, drop_id")
    .order("name", { ascending: true });
  return (data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    format: o.format,
    price: o.price ?? 0,
    drop_id: o.drop_id,
  }));
}

/** Drops pour un sélecteur (id, nom). */
export async function getDropsForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("drops")
    .select("id, name")
    .order("start_date", { ascending: false });
  return (data ?? []).map((d) => ({ id: d.id, name: d.name }));
}

/** Liste des vagues existantes (pour datalist/suggestions). */
export async function getWaveNames(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.from("orders").select("wave").not("wave", "is", null);
  return Array.from(new Set((data ?? []).map((o) => o.wave as string)))
    .sort()
    .reverse();
}
