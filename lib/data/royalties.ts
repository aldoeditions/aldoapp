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
import type {
  StatementPdfData,
  StatementPdfLine,
  StatementPdfBreakdown,
} from "@/lib/royalties/generateStatementPdf";
import type { CertificatePdfData } from "@/lib/royalties/generateCertificatePdf";
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

/** Assemble les données d'un relevé pour générer son PDF (snapshot figé). */
export async function getStatementForPdf(statementId: string): Promise<StatementPdfData | null> {
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: st } = await supabase
    .from("royalty_statements")
    .select("*")
    .eq("id", statementId)
    .maybeSingle<RoyaltyStatement>();
  if (!st) return null;

  const [{ data: artist }, { data: company }, { data: drop }, bankingRes, contractRes, exemptionRes] =
    await Promise.all([
      supabase.from("artists").select("name, first_name, last_name, address, postal_code, city, country, siret, is_artiste_auteur").eq("id", st.artist_id).maybeSingle(),
      supabase.from("company_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("drops").select("name, start_date, end_date").eq("id", st.drop_id).maybeSingle(),
      admin.from("artist_banking").select("iban").eq("artist_id", st.artist_id).maybeSingle(),
      supabase.from("contracts").select("generated_at, created_at, status").eq("artist_id", st.artist_id).eq("drop_id", st.drop_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("artist_precompte_exemptions").select("motif, valid_to").eq("artist_id", st.artist_id).order("valid_from", { ascending: false }).limit(1).maybeSingle(),
    ]);

  const iban = (bankingRes.data?.iban ?? "").replace(/\s/g, "");
  const iban_last4 = iban.length >= 4 ? iban.slice(-4) : null;

  const civil_name = [artist?.first_name, artist?.last_name].filter(Boolean).join(" ").trim() || null;
  const period =
    drop?.start_date && drop?.end_date
      ? `${new Date(drop.start_date).toLocaleDateString("fr-FR")} – ${new Date(drop.end_date).toLocaleDateString("fr-FR")}`
      : null;
  const contract_ref = contractRes.data
    ? `Contrat du ${new Date(contractRes.data.generated_at ?? contractRes.data.created_at ?? Date.now()).toLocaleDateString("fr-FR")}`
    : null;

  // Note de dispense (si exempté).
  let dispense_note: string | null = null;
  if (st.exempt) {
    if (st.non_resident) dispense_note = st.non_resident_treatment ?? "Artiste non-résident — traitement spécifique.";
    else if (exemptionRes.data) dispense_note = `Dispense de précompte — ${exemptionRes.data.motif}${exemptionRes.data.valid_to ? ` (valable jusqu'au ${new Date(exemptionRes.data.valid_to).toLocaleDateString("fr-FR")})` : ""}.`;
    else dispense_note = "Artiste déclarant lui-même ses cotisations (SIRET / BNC) — pas de précompte.";
  }

  return {
    number: st.number ?? "—",
    issued_at: st.issued_at,
    company: {
      name: company?.name ?? "Aldo Éditions",
      legal_form: company?.legal_form ?? null,
      capital_cents: company?.capital_cents ?? null,
      siren: company?.siren ?? null,
      siret: company?.siret ?? null,
      rcs_city: company?.rcs_city ?? null,
      address_line: company?.address_line ?? null,
      postal_code: company?.postal_code ?? null,
      city: company?.city ?? null,
      email: company?.email ?? null,
    },
    artist: {
      display_name: artist?.name ?? "—",
      civil_name,
      address: artist?.address ?? null,
      postal_code: artist?.postal_code ?? null,
      city: artist?.city ?? null,
      country: artist?.country ?? null,
      siret: artist?.siret ?? null,
      artiste_auteur: artist?.is_artiste_auteur !== false,
    },
    campaign_name: drop?.name ?? "Campagne",
    period,
    contract_ref,
    lines: (Array.isArray(st.lines) ? st.lines : []) as unknown as StatementPdfLine[],
    total_ht_cents: st.total_ht_cents ?? 0,
    commission_pct: Number(st.commission_pct ?? 30),
    brut_cents: st.brut_cents ?? 0,
    exempt: Boolean(st.exempt),
    dispense_note,
    breakdown: (st.breakdown ?? null) as unknown as StatementPdfBreakdown | null,
    precompte_cents: st.precompte_cents ?? 0,
    net_cents: st.net_cents ?? 0,
    iban_last4,
    paid_at: st.paid_at,
  };
}

type CertRow = {
  number: string | null;
  issued_at: string | null;
  brut_cents: number | null;
  precompte_cents: number | null;
  breakdown: { vieillesse_plaf?: number; vieillesse_deplaf?: number; csg?: number; crds?: number; cfp?: number } | null;
};

/** Années pour lesquelles l'artiste a subi un précompte (relevés émis/payés). */
export async function getCertificateYears(artistId: string): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("royalty_statements")
    .select("issued_at, precompte_cents")
    .eq("artist_id", artistId)
    .in("status", ["émis", "payé"]);
  const years = new Set<number>();
  for (const s of data ?? []) {
    if ((s.precompte_cents ?? 0) > 0 && s.issued_at) years.add(new Date(s.issued_at).getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

/** Certificat de précompte annuel : agrège les relevés précomptés de l'année. */
export async function getPrecompteCertificate(artistId: string, year: number): Promise<CertificatePdfData | null> {
  const admin = createAdminClient();
  const [{ data: artist }, { data: company }, { data: sts }] = await Promise.all([
    admin.from("artists").select("name, first_name, last_name, address, postal_code, city, siret").eq("id", artistId).maybeSingle(),
    admin.from("company_settings").select("*").eq("id", 1).maybeSingle(),
    admin.from("royalty_statements").select("number, issued_at, brut_cents, precompte_cents, breakdown, status").eq("artist_id", artistId).in("status", ["émis", "payé"]).returns<(CertRow & { status: string })[]>(),
  ]);

  const inYear = (sts ?? []).filter(
    (s) => s.issued_at && new Date(s.issued_at).getFullYear() === year && (s.precompte_cents ?? 0) > 0,
  );
  if (inYear.length === 0) return null;

  let brut = 0, vie = 0, csg = 0, crds = 0, cfp = 0, prec = 0;
  const statements = inYear
    .map((s) => {
      const bd = s.breakdown ?? {};
      brut += s.brut_cents ?? 0;
      prec += s.precompte_cents ?? 0;
      vie += (bd.vieillesse_plaf ?? 0) + (bd.vieillesse_deplaf ?? 0);
      csg += bd.csg ?? 0;
      crds += bd.crds ?? 0;
      cfp += bd.cfp ?? 0;
      return { number: s.number, date: s.issued_at, brut_cents: s.brut_cents ?? 0, precompte_cents: s.precompte_cents ?? 0 };
    })
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const civil_name = [artist?.first_name, artist?.last_name].filter(Boolean).join(" ").trim() || null;

  return {
    year,
    company: {
      name: company?.name ?? "Aldo Éditions",
      legal_form: company?.legal_form ?? null,
      capital_cents: company?.capital_cents ?? null,
      siren: company?.siren ?? null,
      siret: company?.siret ?? null,
      rcs_city: company?.rcs_city ?? null,
      address_line: company?.address_line ?? null,
      postal_code: company?.postal_code ?? null,
      city: company?.city ?? null,
    },
    artist: {
      display_name: artist?.name ?? "—",
      civil_name,
      address: artist?.address ?? null,
      postal_code: artist?.postal_code ?? null,
      city: artist?.city ?? null,
      siret: artist?.siret ?? null,
    },
    brut_cents: brut,
    vieillesse_cents: vie,
    csg_cents: csg,
    crds_cents: crds,
    cfp_cents: cfp,
    precompte_cents: prec,
    statements,
    generated_at: new Date(),
  };
}
