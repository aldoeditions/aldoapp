import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/session";
import { getUrssaf, type Granularity } from "@/lib/data/urssaf";

export const runtime = "nodejs";

function csv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}
function eur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export async function GET(req: Request) {
  await requireModule("finances");
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const g: Granularity = url.searchParams.get("g") === "mois" ? "mois" : "trimestre";
  const data = await getUrssaf(year, g);

  const header = ["Relevé", "Artiste", "Émis le", "Brut", "Vieillesse", "CSG", "CRDS", "CFP", "Précompte", "Contribution diffuseur"];
  const rows = data.lines.map((l) =>
    [
      l.number ?? "",
      l.artist_name,
      l.date ? new Date(l.date).toLocaleDateString("fr-FR") : "",
      eur(l.brut_cents),
      eur(l.vieillesse_cents),
      eur(l.csg_cents),
      eur(l.crds_cents),
      eur(l.cfp_cents),
      eur(l.precompte_cents),
      eur(l.diffuseur_cents),
    ].map(csv).join(","),
  );
  const t = data.total;
  const totalRow = ["TOTAL", "", "", eur(t.brut_cents), eur(t.vieillesse_cents), eur(t.csg_cents), eur(t.crds_cents), eur(t.cfp_cents), eur(t.precompte_cents), eur(t.diffuseur_cents)].map(csv).join(",");

  const body = "﻿" + [header.map(csv).join(","), ...rows, totalRow].join("\r\n") + "\r\n";
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="urssaf-${year}-${g}.csv"`,
    },
  });
}
