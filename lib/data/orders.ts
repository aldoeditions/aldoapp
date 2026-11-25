import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/database";

export type OrdersFilter = {
  status?: string;
  drop?: string;
  q?: string;
};

/** Un article de commande résumé pour la liste (visuel, nom, format, quantité). */
export type OrderItemSummary = {
  oeuvre_name: string | null;
  oeuvre_format: string | null;
  file_url: string | null;
  quantity: number;
};

export type OrderRow = Order & {
  drop_name: string | null;
  nb_pieces: number;
  items: OrderItemSummary[];
};

/** Liste des commandes (+ nom du drop, nb de pièces, articles avec visuel). */
export async function getOrders(filter: OrdersFilter = {}): Promise<OrderRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("orders")
    .select("*, drops(name)")
    .order("created_at", { ascending: false });

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.drop) query = query.eq("drop_id", filter.drop);
  if (filter.q) query = query.ilike("client_name", `%${filter.q}%`);

  const [ordersRes, itemsRes] = await Promise.all([
    query.returns<(Order & { drops: { name: string } | null })[]>(),
    supabase
      .from("order_items")
      .select("order_id, quantity, oeuvres(name, format, file_url)")
      .returns<
        {
          order_id: string;
          quantity: number | null;
          oeuvres: { name: string; format: string; file_url: string | null } | null;
        }[]
      >(),
  ]);

  const pieces = new Map<string, number>();
  const items = new Map<string, OrderItemSummary[]>();
  for (const it of itemsRes.data ?? []) {
    pieces.set(it.order_id, (pieces.get(it.order_id) ?? 0) + (it.quantity ?? 0));
    const list = items.get(it.order_id) ?? [];
    list.push({
      oeuvre_name: it.oeuvres?.name ?? null,
      oeuvre_format: it.oeuvres?.format ?? null,
      file_url: it.oeuvres?.file_url ?? null,
      quantity: it.quantity ?? 0,
    });
    items.set(it.order_id, list);
  }

  return (ordersRes.data ?? []).map((o) => {
    const { drops, ...rest } = o;
    return {
      ...rest,
      drop_name: drops?.name ?? null,
      nb_pieces: pieces.get(o.id) ?? 0,
      items: items.get(o.id) ?? [],
    };
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
