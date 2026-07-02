import { createClient } from "@/lib/supabase/server";
import { COMMISSION_PCT } from "@/lib/constants";
import type { Artist, Drop, Oeuvre, ArtistFile, Contract } from "@/types/database";

const round = (n: number) => Math.round(n * 100) / 100;

/** Fiche de l'artiste connecté (RLS : ne renvoie que sa propre ligne). */
export async function getMyArtist(): Promise<Artist | null> {
  const supabase = createClient();
  const { data } = await supabase.from("artists").select("*").maybeSingle();
  return (data as Artist) ?? null;
}

export type MyStats = {
  nb_oeuvres: number;
  nb_ventes: number;
  ca_brut: number;
  commission_estimee: number; // CA × taux de commission
  commission_payee: number; // paiements au statut "payé"
  commission_due: number; // estimée − payée
};

/** KPIs de l'artiste connecté (œuvres + paiements, RLS scoping). */
export async function getMyStats(commissionPct: number | null): Promise<MyStats> {
  const supabase = createClient();
  const pct = (commissionPct ?? COMMISSION_PCT * 100) / 100;

  const [oeuvresRes, paymentsRes] = await Promise.all([
    supabase.from("oeuvres").select("nb_ventes, ca_brut"),
    supabase.from("payments").select("amount, status"),
  ]);

  const oeuvres = oeuvresRes.data ?? [];
  const nb_oeuvres = oeuvres.length;
  const nb_ventes = oeuvres.reduce((s, o) => s + (o.nb_ventes ?? 0), 0);
  const ca_brut = oeuvres.reduce((s, o) => s + (o.ca_brut ?? 0), 0);
  const commission_estimee = Math.round(ca_brut * pct * 100) / 100;

  const commission_payee = (paymentsRes.data ?? [])
    .filter((p) => p.status === "payé" || p.status === "paye")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return {
    nb_oeuvres,
    nb_ventes,
    ca_brut,
    commission_estimee,
    commission_payee,
    commission_due: Math.round((commission_estimee - commission_payee) * 100) / 100,
  };
}

export type CampaignOeuvre = {
  id: string;
  name: string;
  format: string;
  nb_ventes: number;
  ca_brut: number;
};
export type CurrentCampaign = { drop: Drop; oeuvres: CampaignOeuvre[] };

/** Campagne en cours (+ œuvres de l'artiste) et prochaine campagne à venir. */
export async function getMyCampaigns(): Promise<{
  current: CurrentCampaign | null;
  next: Drop | null;
}> {
  const supabase = createClient();
  const [dropsRes, oeuvresRes] = await Promise.all([
    supabase.from("drops").select("*").order("start_date", { ascending: true }),
    supabase.from("oeuvres").select("id, name, format, nb_ventes, ca_brut, drop_id"),
  ]);
  const drops = (dropsRes.data ?? []) as Drop[];
  const oeuvres = oeuvresRes.data ?? [];

  const current = drops.find((d) => d.status === "en cours") ?? null;
  const next = drops.find((d) => d.status === "à venir") ?? null;

  const oeuvresOf = (dropId: string): CampaignOeuvre[] =>
    oeuvres
      .filter((o) => o.drop_id === dropId)
      .map((o) => ({
        id: o.id,
        name: o.name,
        format: o.format,
        nb_ventes: o.nb_ventes ?? 0,
        ca_brut: o.ca_brut ?? 0,
      }));

  return {
    current: current ? { drop: current, oeuvres: oeuvresOf(current.id) } : null,
    next,
  };
}

export type TodoAction = { label: string; href: string };

/** Liste de choses à faire pour l'artiste (RIB, contrat, fichiers). */
export async function getMyActions(iban: string | null): Promise<TodoAction[]> {
  const supabase = createClient();
  const [contractsRes, oeuvresRes, filesRes] = await Promise.all([
    supabase.from("contracts").select("status"),
    supabase.from("oeuvres").select("file_status"),
    supabase.from("artist_files").select("id"),
  ]);

  const actions: TodoAction[] = [];
  if (!iban) actions.push({ label: "Renseigne ton RIB pour être payé", href: "/portail/profil" });

  const contracts = contractsRes.data ?? [];
  if (contracts.some((c) => c.status && c.status !== "signé"))
    actions.push({ label: "Un contrat attend ta signature", href: "/portail/contrats" });

  const oeuvres = oeuvresRes.data ?? [];
  const files = filesRes.data ?? [];
  if (oeuvres.some((o) => o.file_status !== "validé") || files.length === 0)
    actions.push({ label: "Dépose tes fichiers d'impression HD", href: "/portail/fichiers" });

  return actions;
}

/* --------------------- Œuvres --------------------- */

export type MyOeuvre = Oeuvre & { drop_name: string | null };

/** Œuvres de l'artiste (+ nom du drop), filtrables par drop. */
export async function getMyOeuvres(dropId?: string): Promise<MyOeuvre[]> {
  const supabase = createClient();
  let q = supabase
    .from("oeuvres")
    .select("*, drops(name)")
    .order("created_at", { ascending: false });
  if (dropId) q = q.eq("drop_id", dropId);

  const { data } = await q.returns<(Oeuvre & { drops: { name: string } | null })[]>();
  return (data ?? []).map((o) => {
    const { drops, ...rest } = o;
    return { ...rest, drop_name: drops?.name ?? null };
  });
}

/** Drops de l'artiste (pour le filtre). */
export async function getMyDrops(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("drops")
    .select("id, name")
    .order("start_date", { ascending: false });
  return (data ?? []).map((d) => ({ id: d.id, name: d.name }));
}

/* --------------------- Ventes --------------------- */

export type Sale = {
  id: string;
  sold_at: string | null;
  oeuvre_name: string | null;
  format: string | null;
  drop_id: string | null;
  quantity: number;
  total_price: number;
};

/** Historique des ventes (vue sécurisée : prix de vente uniquement). */
export async function getMySales(): Promise<Sale[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("artist_sales")
    .select("*")
    .order("sold_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((s) => ({
    id: s.id ?? "",
    sold_at: s.sold_at,
    oeuvre_name: s.oeuvre_name,
    format: s.format,
    drop_id: s.drop_id,
    quantity: s.quantity ?? 0,
    total_price: s.total_price ?? 0,
  }));
}

export type SalesKpis = {
  ventesMois: number;
  caMois: number;
  commissionMois: number;
  ventesTotal: number;
  caTotal: number;
  commissionTotal: number;
};

/** KPIs ventes : du mois en cours + total historique. */
export function computeSalesKpis(sales: Sale[], commissionPct: number | null): SalesKpis {
  const pct = (commissionPct ?? COMMISSION_PCT * 100) / 100;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let ventesMois = 0, caMois = 0, ventesTotal = 0, caTotal = 0;
  for (const s of sales) {
    ventesTotal += s.quantity;
    caTotal += s.total_price;
    if (s.sold_at) {
      const d = new Date(s.sold_at);
      if (d.getFullYear() === y && d.getMonth() === m) {
        ventesMois += s.quantity;
        caMois += s.total_price;
      }
    }
  }
  return {
    ventesMois,
    caMois: round(caMois),
    commissionMois: round(caMois * pct),
    ventesTotal,
    caTotal: round(caTotal),
    commissionTotal: round(caTotal * pct),
  };
}

/** Ventes agrégées par campagne (pour le graphe). */
export async function getVentesParCampagne(): Promise<
  { name: string; ca: number; ventes: number }[]
> {
  const supabase = createClient();
  const [oeuvresRes, dropsRes] = await Promise.all([
    supabase.from("oeuvres").select("drop_id, nb_ventes, ca_brut"),
    supabase.from("drops").select("id, name"),
  ]);
  const dropName = new Map((dropsRes.data ?? []).map((d) => [d.id, d.name]));
  const agg = new Map<string, { name: string; ca: number; ventes: number }>();
  for (const o of oeuvresRes.data ?? []) {
    const key = o.drop_id ?? "none";
    const name = o.drop_id ? dropName.get(o.drop_id) ?? "—" : "Hors campagne";
    const cur = agg.get(key) ?? { name, ca: 0, ventes: 0 };
    cur.ca += o.ca_brut ?? 0;
    cur.ventes += o.nb_ventes ?? 0;
    agg.set(key, cur);
  }
  return Array.from(agg.values());
}

/* --------------------- Paiements --------------------- */

export type MyPayment = {
  id: string;
  amount: number;
  status: string | null;
  paid_at: string | null;
  created_at: string | null;
  reference: string | null;
};

/** Paiements de l'artiste (RLS scoping). */
export async function getMyPayments(): Promise<MyPayment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, status, paid_at, created_at, reference")
    .order("created_at", { ascending: false });
  return (data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount ?? 0,
    status: p.status,
    paid_at: p.paid_at,
    created_at: p.created_at,
    reference: p.reference,
  }));
}

/* --------------------- Fichiers & contrat --------------------- */

/** Fichiers déposés par l'artiste. */
export async function getMyFiles(): Promise<ArtistFile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artist_files")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as ArtistFile[];
}

/** Œuvres de l'artiste (id + nom) pour un sélecteur. */
export async function getMyOeuvresLite(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("oeuvres")
    .select("id, name")
    .order("name", { ascending: true });
  return (data ?? []).map((o) => ({ id: o.id, name: o.name }));
}

/** Contrat le plus récent de l'artiste (lecture seule). */
export async function getMyContract(): Promise<Contract | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Contract) ?? null;
}
