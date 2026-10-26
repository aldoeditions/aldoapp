import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildShopifyCsv, type ShopifyExportRow } from "@/lib/shopify/csv";

export const runtime = "nodejs";

/** Export CSV prêt pour l'import produits Shopify (variantes A3/A4 regroupées). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requireModule("drops");
  const supabase = createClient();

  const sel = "id, name, format, price, description, sku, file_url, artists(name)";
  const [{ data: drop }, { data: byDrop }, { data: prog }] = await Promise.all([
    supabase.from("drops").select("name").eq("id", params.id).maybeSingle(),
    supabase.from("oeuvres").select(sel).eq("drop_id", params.id).returns<ShopifyExportRow[]>(),
    supabase.from("drop_oeuvres").select("oeuvre_id").eq("drop_id", params.id),
  ]);

  const map = new Map<string, ShopifyExportRow>();
  for (const o of byDrop ?? []) map.set(o.id, o);
  const missing = (prog ?? []).map((p) => p.oeuvre_id).filter((id) => id && !map.has(id)) as string[];
  if (missing.length > 0) {
    const { data: extra } = await supabase.from("oeuvres").select(sel).in("id", missing).returns<ShopifyExportRow[]>();
    for (const o of extra ?? []) map.set(o.id, o);
  }

  const body = buildShopifyCsv(Array.from(map.values()));
  const safe = (drop?.name ?? "drop").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shopify-${safe}.csv"`,
    },
  });
}
