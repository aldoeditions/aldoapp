import { NextResponse, type NextRequest } from "next/server";
import { requireModule } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { renderRelevePdf, type ReleveLine } from "@/lib/releve/generate";

export const runtime = "nodejs";

type PayRow = {
  paid_at: string | null;
  created_at: string | null;
  gross_cents: number | null;
  precompte_cents: number | null;
  net_cents: number | null;
  amount: number | null;
  drops: { name: string | null } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await requireModule("artistes");
  const year = Number(new URL(req.url).searchParams.get("year")) || new Date().getFullYear();
  const supabase = createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("name, address, postal_code, city, siret, social_security_last4")
    .eq("id", params.id)
    .maybeSingle();
  if (!artist) return new NextResponse("Artiste introuvable", { status: 404 });

  const { data: pays } = await supabase
    .from("payments")
    .select("paid_at, created_at, gross_cents, precompte_cents, net_cents, amount, drops(name)")
    .eq("artist_id", params.id)
    .eq("period_year", year)
    .order("paid_at", { ascending: true })
    .returns<PayRow[]>();

  const lines: ReleveLine[] = (pays ?? []).map((p) => ({
    paid_at: p.paid_at ?? p.created_at,
    drop: p.drops?.name ?? null,
    gross_cents: p.gross_cents ?? Math.round((p.amount ?? 0) * 100),
    precompte_cents: p.precompte_cents ?? 0,
    net_cents: p.net_cents ?? Math.round((p.amount ?? 0) * 100),
  }));

  const totals = lines.reduce(
    (t, l) => ({
      gross_cents: t.gross_cents + l.gross_cents,
      precompte_cents: t.precompte_cents + l.precompte_cents,
      net_cents: t.net_cents + l.net_cents,
    }),
    { gross_cents: 0, precompte_cents: 0, net_cents: 0 },
  );

  const pdf = await renderRelevePdf({
    artist: {
      name: artist.name,
      address: artist.address,
      postal_code: artist.postal_code,
      city: artist.city,
      siret: artist.siret,
      ssn_last4: artist.social_security_last4,
    },
    year,
    generatedAt: new Date(),
    lines,
    totals,
  });

  const safeName = (artist.name ?? "artiste").replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="releve-${safeName}-${year}.pdf"`,
    },
  });
}
