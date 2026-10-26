import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  name: string | null;
  format: string | null;
  price: number | null;
  description: string | null;
  sku: string | null;
  drop_id: string | null;
  artists: { name: string | null } | null;
};

/** Échappe un champ CSV (RFC 4180) : guillemets doublés, champ entre guillemets. */
function csv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Export CSV des œuvres d'un drop : nom, format, prix, description, artiste, SKU. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requireModule("drops");
  const supabase = createClient();

  const [{ data: drop }, { data: byDrop }, { data: prog }] = await Promise.all([
    supabase.from("drops").select("name").eq("id", params.id).maybeSingle(),
    supabase
      .from("oeuvres")
      .select("id, name, format, price, description, sku, drop_id, artists(name)")
      .eq("drop_id", params.id)
      .returns<Row[]>(),
    supabase.from("drop_oeuvres").select("oeuvre_id").eq("drop_id", params.id),
  ]);

  const map = new Map<string, Row>();
  for (const o of byDrop ?? []) map.set(o.id, o);

  // Œuvres programmées (drop_oeuvres) mais rattachées à un autre drop_id.
  const missing = (prog ?? []).map((p) => p.oeuvre_id).filter((id) => id && !map.has(id)) as string[];
  if (missing.length > 0) {
    const { data: extra } = await supabase
      .from("oeuvres")
      .select("id, name, format, price, description, sku, drop_id, artists(name)")
      .in("id", missing)
      .returns<Row[]>();
    for (const o of extra ?? []) map.set(o.id, o);
  }

  const rows = Array.from(map.values()).sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", "fr"),
  );

  const header = ["Nom", "Format", "Prix", "Description", "Artiste", "SKU"];
  const lines = [
    header.map(csv).join(","),
    ...rows.map((o) =>
      [o.name, o.format, o.price, o.description, o.artists?.name ?? "", o.sku].map(csv).join(","),
    ),
  ];
  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  const body = "﻿" + lines.join("\r\n") + "\r\n";

  const safe = (drop?.name ?? "drop").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="oeuvres-${safe}.csv"`,
    },
  });
}
