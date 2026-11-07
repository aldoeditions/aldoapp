import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Granularity = "mois" | "trimestre";

export type UrssafLine = {
  id: string;
  number: string | null;
  artist_id: string | null;
  artist_name: string;
  date: string | null;
  status: string;
  brut_cents: number;
  vieillesse_cents: number;
  csg_cents: number;
  crds_cents: number;
  cfp_cents: number;
  precompte_cents: number;
  diffuseur_cents: number;
};

export type UrssafBucket = {
  key: string;
  label: string;
  brut_cents: number;
  vieillesse_cents: number;
  csg_cents: number;
  crds_cents: number;
  cfp_cents: number;
  precompte_cents: number;
  diffuseur_cents: number;
  nb: number;
};

export type UrssafData = {
  year: number;
  granularity: Granularity;
  availableYears: number[];
  buckets: UrssafBucket[];
  total: UrssafBucket;
  lines: UrssafLine[];
};

type Row = {
  id: string;
  number: string | null;
  artist_id: string | null;
  issued_at: string | null;
  status: string;
  brut_cents: number | null;
  precompte_cents: number | null;
  contribution_diffuseur_cents: number | null;
  breakdown: { vieillesse_plaf?: number; vieillesse_deplaf?: number; csg?: number; crds?: number; cfp?: number } | null;
  artists: { name: string | null } | null;
};

const MONTH_FMT = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function emptyBucket(key: string, label: string): UrssafBucket {
  return { key, label, brut_cents: 0, vieillesse_cents: 0, csg_cents: 0, crds_cents: 0, cfp_cents: 0, precompte_cents: 0, diffuseur_cents: 0, nb: 0 };
}
function add(b: UrssafBucket, l: UrssafLine) {
  b.brut_cents += l.brut_cents;
  b.vieillesse_cents += l.vieillesse_cents;
  b.csg_cents += l.csg_cents;
  b.crds_cents += l.crds_cents;
  b.cfp_cents += l.cfp_cents;
  b.precompte_cents += l.precompte_cents;
  b.diffuseur_cents += l.diffuseur_cents;
  b.nb += 1;
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Récap Urssaf (diffuseur) à partir des relevés ÉMIS/PAYÉS, groupés par mois ou
 * trimestre (date d'émission). Base de la déclaration artistes-auteurs.urssaf.fr.
 */
export async function getUrssaf(year: number, granularity: Granularity): Promise<UrssafData> {
  const supabase = createClient();
  const { data } = await supabase
    .from("royalty_statements")
    .select("id, number, artist_id, issued_at, status, brut_cents, precompte_cents, contribution_diffuseur_cents, breakdown, artists(name)")
    .in("status", ["émis", "payé"])
    .order("issued_at", { ascending: true })
    .returns<Row[]>();

  const rows = data ?? [];
  const availableYears = Array.from(
    new Set([year, ...rows.map((r) => (r.issued_at ? new Date(r.issued_at).getFullYear() : null)).filter(Boolean) as number[]]),
  ).sort((a, b) => b - a);

  const lines: UrssafLine[] = rows
    .filter((r) => r.issued_at && new Date(r.issued_at).getFullYear() === year)
    .map((r) => {
      const bd = r.breakdown ?? {};
      return {
        id: r.id,
        number: r.number,
        artist_id: r.artist_id,
        artist_name: r.artists?.name ?? "—",
        date: r.issued_at,
        status: r.status,
        brut_cents: r.brut_cents ?? 0,
        vieillesse_cents: (bd.vieillesse_plaf ?? 0) + (bd.vieillesse_deplaf ?? 0),
        csg_cents: bd.csg ?? 0,
        crds_cents: bd.crds ?? 0,
        cfp_cents: bd.cfp ?? 0,
        precompte_cents: r.precompte_cents ?? 0,
        diffuseur_cents: r.contribution_diffuseur_cents ?? 0,
      };
    });

  const map = new Map<string, UrssafBucket>();
  const order: string[] = [];
  for (const l of lines) {
    const d = new Date(l.date!);
    let key: string;
    let label: string;
    if (granularity === "mois") {
      key = l.date!.slice(0, 7);
      label = cap(MONTH_FMT.format(d));
    } else {
      const q = Math.floor(d.getMonth() / 3) + 1;
      key = `${year}-T${q}`;
      label = `${q}${q === 1 ? "er" : "e"} trimestre ${year}`;
    }
    if (!map.has(key)) {
      map.set(key, emptyBucket(key, label));
      order.push(key);
    }
    add(map.get(key)!, l);
  }

  const total = emptyBucket("total", `Total ${year}`);
  for (const l of lines) add(total, l);

  return {
    year,
    granularity,
    availableYears,
    buckets: order.map((k) => map.get(k)!),
    total,
    lines,
  };
}
