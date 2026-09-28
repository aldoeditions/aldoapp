import "server-only";
import { createClient } from "@/lib/supabase/server";

export type UrssafPayment = {
  id: string;
  artist_id: string | null;
  artist_name: string;
  paid_at: string | null;
  quarter: number;
  gross_cents: number;
  precompte_cents: number;
  contribution_diffuseur_cents: number;
  net_cents: number;
  status: string;
};

export type UrssafTotals = {
  gross_cents: number;
  precompte_cents: number;
  contribution_cents: number;
  nb: number;
};

export type UrssafQuarter = UrssafTotals & { quarter: number };

export type UrssafYear = {
  year: number;
  availableYears: number[];
  quarters: UrssafQuarter[];
  total: UrssafTotals;
  payments: UrssafPayment[];
};

type Row = {
  id: string;
  artist_id: string | null;
  paid_at: string | null;
  created_at: string | null;
  period_year: number | null;
  gross_cents: number | null;
  precompte_cents: number | null;
  contribution_diffuseur_cents: number | null;
  net_cents: number | null;
  status: string;
  artists: { name: string | null } | null;
};

function quarterOf(dateStr: string | null): number {
  if (!dateStr) return 1;
  const m = new Date(dateStr).getMonth(); // 0-11
  return Math.floor(m / 3) + 1;
}

function emptyTotals(): UrssafTotals {
  return { gross_cents: 0, precompte_cents: 0, contribution_cents: 0, nb: 0 };
}

/** Synthèse Urssaf (précompte + contribution diffuseur) pour une année civile. */
export async function getUrssafYear(year: number): Promise<UrssafYear> {
  const supabase = createClient();

  const [{ data: rows }, { data: yearsData }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, artist_id, paid_at, created_at, period_year, gross_cents, precompte_cents, contribution_diffuseur_cents, net_cents, status, artists(name)",
      )
      .eq("period_year", year)
      .order("paid_at", { ascending: true })
      .returns<Row[]>(),
    supabase.from("payments").select("period_year"),
  ]);

  const availableYears = Array.from(
    new Set([year, ...((yearsData ?? []).map((r) => r.period_year).filter(Boolean) as number[])]),
  ).sort((a, b) => b - a);

  const quarters: UrssafQuarter[] = [1, 2, 3, 4].map((q) => ({ quarter: q, ...emptyTotals() }));
  const total = emptyTotals();
  const payments: UrssafPayment[] = [];

  for (const r of rows ?? []) {
    const q = quarterOf(r.paid_at ?? r.created_at);
    const gross = r.gross_cents ?? 0;
    const prec = r.precompte_cents ?? 0;
    const contrib = r.contribution_diffuseur_cents ?? 0;

    const bucket = quarters[q - 1];
    bucket.gross_cents += gross;
    bucket.precompte_cents += prec;
    bucket.contribution_cents += contrib;
    bucket.nb += 1;

    total.gross_cents += gross;
    total.precompte_cents += prec;
    total.contribution_cents += contrib;
    total.nb += 1;

    payments.push({
      id: r.id,
      artist_id: r.artist_id,
      artist_name: r.artists?.name ?? "—",
      paid_at: r.paid_at,
      quarter: q,
      gross_cents: gross,
      precompte_cents: prec,
      contribution_diffuseur_cents: contrib,
      net_cents: r.net_cents ?? 0,
      status: r.status,
    });
  }

  return { year, availableYears, quarters, total, payments };
}
