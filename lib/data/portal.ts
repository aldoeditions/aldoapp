import { createClient } from "@/lib/supabase/server";
import { COMMISSION_PCT } from "@/lib/constants";
import type { Artist } from "@/types/database";

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
