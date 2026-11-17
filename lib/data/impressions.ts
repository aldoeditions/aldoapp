import { createClient } from "@/lib/supabase/server";

export type PrintItem = {
  oeuvre_id: string | null;
  name: string;
  artist: string | null;
  format: string | null;
  file_url: string | null;
  quantity: number;
};

export type CampaignPrintList = {
  drop: { id: string; name: string; start_date: string | null; end_date: string | null } | null;
  items: PrintItem[];
  total_pieces: number;
  by_format: { format: string; quantity: number }[];
};

/**
 * Liste d'impression d'une campagne : agrégat des ventes PAYÉES rattachées au
 * drop (orders.drop_id, attribution par date). Une ligne par visuel + format,
 * avec la quantité à imprimer. Sert à produire le PDF de fin de campagne.
 */
export async function getCampaignPrintList(dropId: string): Promise<CampaignPrintList> {
  const supabase = createClient();

  const [dropRes, ordersRes] = await Promise.all([
    supabase.from("drops").select("id, name, start_date, end_date").eq("id", dropId).maybeSingle(),
    supabase.from("orders").select("id").eq("financial_status", "paid").eq("drop_id", dropId),
  ]);

  const orderIds = (ordersRes.data ?? []).map((o) => o.id);
  if (orderIds.length === 0) {
    return { drop: dropRes.data ?? null, items: [], total_pieces: 0, by_format: [] };
  }

  const { data: rows } = await supabase
    .from("order_items")
    .select("oeuvre_id, quantity, title_snapshot, oeuvres(name, format, file_url, artists(name))")
    .in("order_id", orderIds)
    .returns<
      {
        oeuvre_id: string | null;
        quantity: number;
        title_snapshot: string | null;
        oeuvres: { name: string; format: string | null; file_url: string | null; artists: { name: string } | null } | null;
      }[]
    >();

  const agg = new Map<string, PrintItem>();
  for (const r of rows ?? []) {
    const name = r.oeuvres?.name ?? r.title_snapshot ?? "—";
    const format = r.oeuvres?.format ?? null;
    // Agrège par visuel (oeuvre_id) si connu, sinon par nom+format.
    const key = r.oeuvre_id ?? `${name}|${format}`;
    const cur = agg.get(key) ?? {
      oeuvre_id: r.oeuvre_id,
      name,
      artist: r.oeuvres?.artists?.name ?? null,
      format,
      file_url: r.oeuvres?.file_url ?? null,
      quantity: 0,
    };
    cur.quantity += r.quantity ?? 0;
    agg.set(key, cur);
  }

  const items = Array.from(agg.values()).sort(
    (a, b) =>
      (a.format ?? "").localeCompare(b.format ?? "") || a.name.localeCompare(b.name, "fr"),
  );

  const total_pieces = items.reduce((s, i) => s + i.quantity, 0);
  const fmtMap = new Map<string, number>();
  for (const i of items) {
    const f = i.format ?? "—";
    fmtMap.set(f, (fmtMap.get(f) ?? 0) + i.quantity);
  }
  const by_format = Array.from(fmtMap.entries())
    .map(([format, quantity]) => ({ format, quantity }))
    .sort((a, b) => a.format.localeCompare(b.format));

  return { drop: dropRes.data ?? null, items, total_pieces, by_format };
}
