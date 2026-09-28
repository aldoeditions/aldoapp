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

export type ReleveLine = {
  paid_at: string | null;
  drop: string | null;
  gross_cents: number;
  precompte_cents: number;
  net_cents: number;
};

export type ReleveData = {
  artist: {
    name: string;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    siret: string | null;
    ssn_last4: string | null;
  };
  year: number;
  generatedAt: Date;
  lines: ReleveLine[];
  totals: { gross_cents: number; precompte_cents: number; net_cents: number };
};

const ACCENT = "#0627B7";
const INK = "#1A1A1F";
const GREY = "#5D5F70";
const FAINT = "#A0A2B4";
const LINE = "#E4E6F2";

const s = StyleSheet.create({
  page: { paddingTop: 46, paddingBottom: 54, paddingHorizontal: 48, fontSize: 9.5, color: INK, lineHeight: 1.4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, color: FAINT, textTransform: "uppercase", marginBottom: 3 },
  h1: { fontSize: 18, color: INK },
  block: { marginBottom: 16 },
  label: { fontSize: 7.5, letterSpacing: 1, color: FAINT, textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 9.5, color: INK },
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  party: { width: "48%" },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 4, marginTop: 8 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 5 },
  tFoot: { flexDirection: "row", borderTopWidth: 1, borderTopColor: INK, paddingTop: 6, marginTop: 2 },
  cDate: { width: "18%" },
  cDrop: { width: "34%" },
  cNum: { width: "16%", textAlign: "right" },
  th: { fontSize: 7.5, letterSpacing: 0.5, color: GREY, textTransform: "uppercase" },
  strong: { fontSize: 10, color: INK },
  note: { marginTop: 20, fontSize: 8, color: GREY, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 26, left: 48, right: 48, fontSize: 7.5, color: FAINT, textAlign: "center" },
});

function euros(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function dateFr(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ReleveDocument({ data }: { data: ReleveData }) {
  const { artist, year, lines, totals } = data;
  const adresse = [artist.address, [artist.postal_code, artist.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.eyebrow}>Relevé de droits d&apos;auteur</Text>
            <Text style={s.h1}>Année {year}</Text>
          </View>
          <Svg viewBox={ALDO_LOGO.viewBox} width={64} height={26}>
            {ALDO_LOGO.paths.map((d, i) => (
              <Path key={i} d={d} fill={ALDO_LOGO.fill} />
            ))}
          </Svg>
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>Diffuseur</Text>
            <Text style={s.value}>Aldo Éditions</Text>
            <Text style={s.value}>contact@aldo-editions.com</Text>
          </View>
          <View style={s.party}>
            <Text style={s.label}>Artiste-auteur</Text>
            <Text style={s.value}>{artist.name}</Text>
            {adresse ? <Text style={s.value}>{adresse}</Text> : null}
            {artist.siret ? <Text style={s.value}>SIRET {artist.siret}</Text> : null}
            {artist.ssn_last4 ? <Text style={s.value}>N° sécu •••• {artist.ssn_last4}</Text> : null}
          </View>
        </View>

        {/* Tableau des versements */}
        <View style={s.tHead}>
          <Text style={[s.cDate, s.th]}>Date</Text>
          <Text style={[s.cDrop, s.th]}>Campagne</Text>
          <Text style={[s.cNum, s.th]}>Brut</Text>
          <Text style={[s.cNum, s.th]}>Précompte</Text>
          <Text style={[s.cNum, s.th]}>Net versé</Text>
        </View>
        {lines.length === 0 ? (
          <View style={s.tRow}>
            <Text style={{ color: GREY }}>Aucun versement sur l&apos;année.</Text>
          </View>
        ) : (
          lines.map((l, i) => (
            <View key={i} style={s.tRow}>
              <Text style={s.cDate}>{dateFr(l.paid_at)}</Text>
              <Text style={s.cDrop}>{l.drop ?? "—"}</Text>
              <Text style={s.cNum}>{euros(l.gross_cents)}</Text>
              <Text style={s.cNum}>{l.precompte_cents ? `− ${euros(l.precompte_cents)}` : "—"}</Text>
              <Text style={s.cNum}>{euros(l.net_cents)}</Text>
            </View>
          ))
        )}
        <View style={s.tFoot}>
          <Text style={[s.cDate, s.strong]}>Total</Text>
          <Text style={s.cDrop} />
          <Text style={[s.cNum, s.strong]}>{euros(totals.gross_cents)}</Text>
          <Text style={[s.cNum, s.strong]}>{euros(totals.precompte_cents)}</Text>
          <Text style={[s.cNum, s.strong, { color: ACCENT }]}>{euros(totals.net_cents)}</Text>
        </View>

        <Text style={s.note}>
          Le précompte correspond aux cotisations sociales retenues par le diffuseur (Aldo Éditions) et reversées
          pour votre compte à l&apos;Urssaf, au titre du régime des artistes-auteurs. Le montant net indiqué est
          celui effectivement versé. Ce relevé est fourni à titre récapitulatif.
        </Text>

        <Text style={s.footer}>
          Aldo Éditions · Relevé généré le {dateFr(data.generatedAt.toISOString())}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderRelevePdf(data: ReleveData): Promise<Buffer> {
  return renderToBuffer(<ReleveDocument data={data} />);
}
