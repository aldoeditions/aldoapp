import { createClient } from "@/lib/supabase/server";
import { COMMISSION_PCT } from "@/lib/constants";
import type { Artist, Drop } from "@/types/database";

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
