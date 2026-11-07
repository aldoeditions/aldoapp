import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Path,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { ALDO_LOGO } from "@/lib/contracts/aldo-logo";

export type StatementPdfLine = {
  name: string;
  format: string | null;
  quantity: number;
  unit_ht_cents: number;
  line_ht_cents: number;
};
export type StatementPdfBreakdown = {
  vieillesse_plaf: number;
  vieillesse_deplaf: number;
  csg: number;
  crds: number;
  cfp: number;
};

export type StatementPdfData = {
  number: string;
  issued_at: string | null;
  company: {
    name: string;
    legal_form: string | null;
    capital_cents: number | null;
    siren: string | null;
    siret: string | null;
    rcs_city: string | null;
    address_line: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
  };
  artist: {
    display_name: string;
    civil_name: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    siret: string | null;
    artiste_auteur: boolean;
  };
  campaign_name: string;
  period: string | null;
  contract_ref: string | null;
  lines: StatementPdfLine[];
  total_ht_cents: number;
  commission_pct: number;
  brut_cents: number;
  exempt: boolean;
  dispense_note: string | null;
  breakdown: StatementPdfBreakdown | null;
  precompte_cents: number;
  net_cents: number;
  iban_last4: string | null;
  paid_at: string | null;
};

const ACCENT = "#0627B7";
const INK = "#1A1A1F";
const GREY = "#5D5F70";
const FAINT = "#A0A2B4";
const LINE = "#E4E6F2";

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 46, fontSize: 9, color: INK, lineHeight: 1.4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, color: FAINT, textTransform: "uppercase", marginBottom: 3 },
  h1: { fontSize: 17, color: INK },
  num: { fontSize: 10, color: ACCENT, marginTop: 2 },
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  party: { width: "48%" },
  label: { fontSize: 7, letterSpacing: 1, color: FAINT, textTransform: "uppercase", marginBottom: 2 },
  val: { fontSize: 9, color: INK },
  meta: { marginBottom: 14, borderTopWidth: 0.5, borderTopColor: LINE, borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 6, flexDirection: "row", justifyContent: "space-between" },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 4, marginTop: 4 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 4 },
  cO: { width: "44%" },
  cF: { width: "12%" },
  cQ: { width: "10%", textAlign: "right" },
  cPU: { width: "17%", textAlign: "right" },
  cT: { width: "17%", textAlign: "right" },
  th: { fontSize: 7, letterSpacing: 0.5, color: GREY, textTransform: "uppercase" },
  totals: { marginTop: 8, alignSelf: "flex-end", width: "55%" },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totStrong: { fontSize: 11, color: INK },
  block: { marginTop: 14, borderWidth: 0.5, borderColor: LINE, borderRadius: 4, padding: 8 },
  blockTitle: { fontSize: 8, letterSpacing: 0.5, color: GREY, textTransform: "uppercase", marginBottom: 4 },
  net: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#EEF0FF", borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10 },
  netLabel: { fontSize: 11, color: INK },
  netVal: { fontSize: 13, color: ACCENT },
  mention: { marginTop: 16, fontSize: 7.5, color: GREY, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 22, left: 46, right: 46, fontSize: 6.5, color: FAINT, textAlign: "center", borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 5 },
});

function euros(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function dateFr(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Toty({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.totRow}>
      <Text style={strong ? s.totStrong : { color: GREY }}>{label}</Text>
      <Text style={strong ? s.totStrong : { color: INK }}>{value}</Text>
    </View>
  );
}

function StatementDoc({ data }: { data: StatementPdfData }) {
  const c = data.company;
  const a = data.artist;
  const companyAddr = [c.address_line, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const artistAddr = [a.address, [a.postal_code, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const legalLine = [
    c.name,
    c.legal_form && c.capital_cents != null ? `${c.legal_form} au capital de ${euros(c.capital_cents)}` : c.legal_form,
    c.rcs_city && c.siren ? `RCS ${c.rcs_city} ${c.siren}` : null,
    c.siret ? `SIRET ${c.siret}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.eyebrow}>Relevé de droits d&apos;auteur</Text>
            <Text style={s.h1}>{data.campaign_name}</Text>
            <Text style={s.num}>{data.number}</Text>
          </View>
          <Svg viewBox={ALDO_LOGO.viewBox} width={60} height={24}>
            {ALDO_LOGO.paths.map((d, i) => (<Path key={i} d={d} fill={ALDO_LOGO.fill} />))}
          </Svg>
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>Diffuseur</Text>
            <Text style={s.val}>{c.name}</Text>
            {companyAddr ? <Text style={s.val}>{companyAddr}</Text> : null}
            {c.siret ? <Text style={s.val}>SIRET {c.siret}</Text> : null}
            {c.email ? <Text style={s.val}>{c.email}</Text> : null}
          </View>
          <View style={s.party}>
            <Text style={s.label}>Artiste-auteur</Text>
            <Text style={s.val}>{a.display_name}</Text>
            {a.civil_name && a.civil_name !== a.display_name ? <Text style={s.val}>({a.civil_name})</Text> : null}
            {artistAddr ? <Text style={s.val}>{artistAddr}</Text> : null}
            {a.country && a.country.toLowerCase() !== "france" ? <Text style={s.val}>{a.country}</Text> : null}
            <Text style={s.val}>{a.siret ? `SIRET ${a.siret}` : "Artiste-auteur"}</Text>
          </View>
        </View>

        <View style={s.meta}>
          <Text style={{ color: GREY }}>Émis le {dateFr(data.issued_at)}</Text>
          {data.period ? <Text style={{ color: GREY }}>Période : {data.period}</Text> : <Text />}
          {data.contract_ref ? <Text style={{ color: GREY }}>{data.contract_ref}</Text> : <Text />}
        </View>

        {/* Ventes */}
        <View style={s.tHead}>
          <Text style={[s.cO, s.th]}>Œuvre</Text>
          <Text style={[s.cF, s.th]}>Format</Text>
          <Text style={[s.cQ, s.th]}>Qté</Text>
          <Text style={[s.cPU, s.th]}>PU HT</Text>
          <Text style={[s.cT, s.th]}>Total HT</Text>
        </View>
        {data.lines.length === 0 ? (
          <View style={s.tRow}><Text style={{ color: GREY }}>Aucune vente sur la période.</Text></View>
        ) : (
          data.lines.map((l, i) => (
            <View key={i} style={s.tRow}>
              <Text style={s.cO}>{l.name}</Text>
              <Text style={s.cF}>{l.format ?? "—"}</Text>
              <Text style={s.cQ}>{l.quantity}</Text>
              <Text style={s.cPU}>{euros(l.unit_ht_cents)}</Text>
              <Text style={s.cT}>{euros(l.line_ht_cents)}</Text>
            </View>
          ))
        )}

        <View style={s.totals}>
          <Toty label="Total HT des ventes" value={euros(data.total_ht_cents)} />
          <Toty label={`Taux de droits d'auteur`} value={`${data.commission_pct} %`} />
          <Toty label="Brut droits d'auteur" value={euros(data.brut_cents)} strong />
        </View>

        {/* Précompte ou dispense */}
        <View style={s.block}>
          {data.exempt ? (
            <>
              <Text style={s.blockTitle}>Précompte</Text>
              <Text style={{ color: INK }}>{data.dispense_note ?? "Dispense de précompte — aucune cotisation retenue."}</Text>
            </>
          ) : (
            <>
              <Text style={s.blockTitle}>Précompte des cotisations (part artiste)</Text>
              {data.breakdown && (
                <>
                  {data.breakdown.vieillesse_plaf > 0 && (
                    <View style={s.totRow}><Text style={{ color: GREY }}>Assurance vieillesse</Text><Text>− {euros(data.breakdown.vieillesse_plaf + data.breakdown.vieillesse_deplaf)}</Text></View>
                  )}
                  <View style={s.totRow}><Text style={{ color: GREY }}>CSG</Text><Text>− {euros(data.breakdown.csg)}</Text></View>
                  <View style={s.totRow}><Text style={{ color: GREY }}>CRDS</Text><Text>− {euros(data.breakdown.crds)}</Text></View>
                  <View style={s.totRow}><Text style={{ color: GREY }}>Contribution formation (CFP)</Text><Text>− {euros(data.breakdown.cfp)}</Text></View>
                </>
              )}
              <View style={[s.totRow, { borderTopWidth: 0.5, borderTopColor: LINE, marginTop: 2, paddingTop: 3 }]}>
                <Text style={{ color: INK }}>Total précompte</Text><Text style={{ color: INK }}>− {euros(data.precompte_cents)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Net */}
        <View style={s.net}>
          <View>
            <Text style={s.netLabel}>Net à verser</Text>
            <Text style={{ fontSize: 7.5, color: GREY, marginTop: 2 }}>
              Virement bancaire{data.iban_last4 ? ` · IBAN ••••${data.iban_last4}` : ""}
              {data.paid_at ? ` · versé le ${dateFr(data.paid_at)}` : ""}
            </Text>
          </View>
          <Text style={s.netVal}>{euros(data.net_cents)}</Text>
        </View>

        <Text style={s.mention}>
          Rémunération versée en droits d&apos;auteur, au titre des articles L.382-1 et suivants du Code de la
          sécurité sociale. {data.exempt ? "" : "Le précompte des cotisations a été opéré par le diffuseur et reversé à l'Urssaf pour le compte de l'artiste."} Ce relevé tient lieu de justificatif ; l&apos;artiste n&apos;émet pas de facture.
        </Text>

        <Text style={s.footer}>{legalLine}</Text>
      </Page>
    </Document>
  );
}

export async function renderStatementPdf(data: StatementPdfData): Promise<Buffer> {
  return renderToBuffer(<StatementDoc data={data} />);
}
