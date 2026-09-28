import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SocialRate } from "@/lib/fiscal";
import type { SocialRateRow } from "@/types/database";

/** Postgres renvoie les `numeric` en string via PostgREST → on force en number. */
function toRate(r: SocialRateRow): SocialRate {
  return {
    id: r.id,
    effective_from: r.effective_from,
    vieillesse_plaf_taux: Number(r.vieillesse_plaf_taux),
    vieillesse_plaf_assiette: Number(r.vieillesse_plaf_assiette),
    plafond_ss_annuel_cents: Number(r.plafond_ss_annuel_cents),
    vieillesse_deplaf_taux: Number(r.vieillesse_deplaf_taux),
    vieillesse_deplaf_assiette: Number(r.vieillesse_deplaf_assiette),
    csg_taux: Number(r.csg_taux),
    csg_assiette: Number(r.csg_assiette),
    crds_taux: Number(r.crds_taux),
    crds_assiette: Number(r.crds_assiette),
    cfp_taux: Number(r.cfp_taux),
    cfp_assiette: Number(r.cfp_assiette),
    contribution_diffuseur_taux: Number(r.contribution_diffuseur_taux),
  };
}

/** Barème en vigueur à une date (la ligne la plus récente dont effective_from <= date). */
export async function getRateForDate(dateISO: string): Promise<SocialRate | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("social_rates")
    .select("*")
    .lte("effective_from", dateISO)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle<SocialRateRow>();
  return data ? toRate(data) : null;
}

/** Barème en vigueur aujourd'hui. */
export async function getCurrentRate(): Promise<SocialRate | null> {
  return getRateForDate(new Date().toISOString().slice(0, 10));
}

/**
 * Cumul brut déjà versé à un artiste sur une année civile (pour le plafond
 * annuel de la vieillesse plafonnée). Exclut éventuellement un versement.
 */
export async function getPriorYearGrossCents(
  artistId: string,
  year: number,
  excludePaymentId?: string,
): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, gross_cents")
    .eq("artist_id", artistId)
    .eq("period_year", year);
  return (data ?? [])
    .filter((p) => p.id !== excludePaymentId)
    .reduce((s, p) => s + (p.gross_cents ?? 0), 0);
}

/** Une dispense de précompte est-elle active à une date pour l'artiste ? */
export async function hasActiveExemption(artistId: string, dateISO: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artist_precompte_exemptions")
    .select("id, valid_from, valid_to")
    .eq("artist_id", artistId)
    .lte("valid_from", dateISO);
  return (data ?? []).some((e) => !e.valid_to || e.valid_to >= dateISO);
}
