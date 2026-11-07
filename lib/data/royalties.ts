import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TVA_PCT, COMMISSION_PCT, PRECOMPTE_REGIMES } from "@/lib/constants";
import { getRateForDate } from "@/lib/data/social-rates";
import {
  computeStatement,
  type StatementSaleInput,
  type StatementResult,
} from "@/lib/royalties/computeStatement";
import type { SocialRate } from "@/lib/fiscal";
import type { RoyaltyStatement } from "@/types/database";

export type CampaignRoyaltyRow = {
  artist_id: string;
  artist_name: string;
  commission_pct: number;
  exempt: boolean;
  non_resident: boolean;
  has_rib: boolean;
  alerts: string[];
  sales: StatementSaleInput[];
  computed: StatementResult | null;
  statement: RoyaltyStatement | null;
};

export type CampaignRoyalties = {
  drop: { id: string; name: string } | null;
  rate: SocialRate | null;
  rows: CampaignRoyaltyRow[];
};

function isFrance(country: string | null): boolean {
  const c = (country ?? "").trim().toLowerCase();
  return c === "" || c === "france" || c === "fr";
}

/**
 * Calcule, pour une campagne, le relevé (brouillon live) de chaque artiste
 * programmé : ventes payées → brut/précompte/net, + alertes (RIB manquant,
 * non-résident, dispense expirée) + le relevé existant éventuel.
 */
export async function getCampaignRoyalties(dropId: string): Promise<CampaignRoyalties> {
  const supabase = createClient();
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [dropRes, oeuvresRes, progRes, rate, statementsRes] = await Promise.all([
    supabase.from("drops").select("id, name").eq("id", dropId).maybeSingle(),
    supabase.from("oeuvres").select("id, name, format, artist_id").eq("drop_id", dropId),
    supabase.from("drop_oeuvres").select("oeuvre_id, commission_pct").eq("drop_id", dropId),
    getRateForDate(today),
    supabase.from("royalty_statements").select("*").eq("drop_id", dropId).returns<RoyaltyStatement[]>(),
  ]);

  const oeuvres = (oeuvresRes.data ?? []) as { id: string; name: string; format: string | null; artist_id: string | null }[];
  const oeuvreById = new Map(oeuvres.map((o) => [o.id, o]));
  const oeuvreIds = oeuvres.map((o) => o.id);
  const commByOeuvre = new Map((progRes.data ?? []).map((p) => [p.oeuvre_id, Number(p.commission_pct)]));

  const artistIds = Array.from(new Set(oeuvres.map((o) => o.artist_id).filter(Boolean))) as string[];
  if (artistIds.length === 0) {
    return { drop: dropRes.data ?? null, rate, rows: [] };
  }

  // Ventes payées rattachées aux œuvres de la campagne.
  const [{ data: paidOrders }, itemsRes, { data: artistsData }, bankingRes, exemptionsRes] = await Promise.all([
    supabase.from("orders").select("id").eq("financial_status", "paid"),
    oeuvreIds.length
      ? supabase.from("order_items").select("oeuvre_id, quantity, unit_price, order_id").in("oeuvre_id", oeuvreIds)
      : Promise.resolve({ data: [] as { oeuvre_id: string | null; quantity: number; unit_price: number; order_id: string }[] }),
    supabase.from("artists").select("id, name, country, social_regime, commission_pct").in("id", artistIds),
    admin.from("artist_banking").select("artist_id").in("artist_id", artistIds),
    supabase.from("artist_precompte_exemptions").select("artist_id, valid_from, valid_to").in("artist_id", artistIds),
  ]);

  const paidSet = new Set((paidOrders ?? []).map((o) => o.id));
  const hasRib = new Set((bankingRes.data ?? []).map((b) => b.artist_id));
  const artistById = new Map((artistsData ?? []).map((a) => [a.id, a]));

  // Dispenses : active / expirée (existe mais aucune active aujourd'hui).
  const hasActive = new Set<string>();
  const hasAny = new Set<string>();
  for (const e of exemptionsRes.data ?? []) {
    hasAny.add(e.artist_id);
    if (e.valid_from <= today && (!e.valid_to || e.valid_to >= today)) hasActive.add(e.artist_id);
  }

  // Lignes de vente par artiste (agrégées par œuvre + prix unitaire payé).
  const salesByArtist = new Map<string, Map<string, StatementSaleInput>>();
  for (const it of itemsRes.data ?? []) {
    if (!it.oeuvre_id || !paidSet.has(it.order_id)) continue;
    const o = oeuvreById.get(it.oeuvre_id);
    if (!o || !o.artist_id) continue;
    const unitCents = Math.round((it.unit_price ?? 0) * 100);
    const key = `${it.oeuvre_id}:${unitCents}`;
    if (!salesByArtist.has(o.artist_id)) salesByArtist.set(o.artist_id, new Map());
    const m = salesByArtist.get(o.artist_id)!;
    const prev = m.get(key);
    if (prev) prev.quantity += it.quantity ?? 0;
    else
      m.set(key, {
        oeuvre_id: o.id,
        name: o.name,
        format: o.format,
        quantity: it.quantity ?? 0,
        unit_price_ttc_cents: unitCents,
        tva_pct: TVA_PCT * 100,
      });
  }

  const stmtByArtist = new Map<string, RoyaltyStatement>();
  for (const st of statementsRes.data ?? []) {
    if (st.rectifies_id) continue; // on affiche le relevé primaire
    stmtByArtist.set(st.artist_id, st);
  }

  const rows: CampaignRoyaltyRow[] = artistIds.map((aid) => {
    const a = artistById.get(aid);
    const name = a?.name ?? "—";
    const regime = a?.social_regime ?? "artiste_auteur_precompte";
    const non_resident = !isFrance(a?.country ?? null);
    const sales = Array.from(salesByArtist.get(aid)?.values() ?? []);
    // Commission figée : celle de la programmation (uniforme en pratique).
    const commFromProg = sales.map((s) => commByOeuvre.get(s.oeuvre_id ?? "")).find((c) => c != null);
    const commission_pct = commFromProg ?? a?.commission_pct ?? COMMISSION_PCT * 100;
    const activeExemption = hasActive.has(aid);
    const exempt = !PRECOMPTE_REGIMES.has(regime) || activeExemption || non_resident;

    const alerts: string[] = [];
    if (!hasRib.has(aid)) alerts.push("RIB manquant");
    if (non_resident) alerts.push("Non-résident — traitement à valider");
    if (hasAny.has(aid) && !activeExemption) alerts.push("Dispense expirée");

    const computed = rate ? computeStatement(sales, { commissionPct: commission_pct, rate, exempt }) : null;

    return {
      artist_id: aid,
      artist_name: name,
      commission_pct,
      exempt,
      non_resident,
      has_rib: hasRib.has(aid),
      alerts,
      sales,
      computed,
      statement: stmtByArtist.get(aid) ?? null,
    };
  });

  rows.sort((x, y) => x.artist_name.localeCompare(y.artist_name, "fr"));
  return { drop: dropRes.data ?? null, rate, rows };
}

/** Relevés d'un artiste (fiche artiste), tri par date décroissante. */
export async function getArtistStatements(artistId: string): Promise<
  (RoyaltyStatement & { drop_name: string | null })[]
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("royalty_statements")
    .select("*, drops(name)")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false })
    .returns<(RoyaltyStatement & { drops: { name: string } | null })[]>();
  return (data ?? []).map((s) => {
    const { drops, ...rest } = s;
    return { ...rest, drop_name: drops?.name ?? null };
  });
}
