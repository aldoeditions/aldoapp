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

export type CertificateStatement = {
  number: string | null;
  date: string | null;
  brut_cents: number;
  precompte_cents: number;
};

export type CertificatePdfData = {
  year: number;
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
  };
  artist: {
    display_name: string;
    civil_name: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    siret: string | null;
  };
  brut_cents: number;
  vieillesse_cents: number;
  csg_cents: number;
  crds_cents: number;
  cfp_cents: number;
  precompte_cents: number;
  statements: CertificateStatement[];
  generated_at: Date;
};

const ACCENT = "#0627B7";
const INK = "#1A1A1F";
const GREY = "#5D5F70";
const FAINT = "#A0A2B4";
const LINE = "#E4E6F2";

const s = StyleSheet.create({
  page: { paddingTop: 46, paddingBottom: 56, paddingHorizontal: 48, fontSize: 9, color: INK, lineHeight: 1.5 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, color: FAINT, textTransform: "uppercase", marginBottom: 3 },
  h1: { fontSize: 17, color: INK },
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  party: { width: "48%" },
  label: { fontSize: 7, letterSpacing: 1, color: FAINT, textTransform: "uppercase", marginBottom: 2 },
  val: { fontSize: 9, color: INK },
  intro: { marginBottom: 14, fontSize: 9.5, color: INK },
  box: { borderWidth: 0.5, borderColor: LINE, borderRadius: 4, padding: 10, marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  strong: { fontSize: 11, color: INK },
  accent: { fontSize: 12, color: ACCENT },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 3, marginTop: 6 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 3 },
  cN: { width: "34%" }, cD: { width: "22%" }, cB: { width: "22%", textAlign: "right" }, cP: { width: "22%", textAlign: "right" },
  th: { fontSize: 7, letterSpacing: 0.5, color: GREY, textTransform: "uppercase" },
  mention: { marginTop: 16, fontSize: 8, color: GREY, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 6.5, color: FAINT, textAlign: "center", borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 5 },
});

function euros(c: number): string {
  return `${(c / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function dateFr(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function CertDoc({ data }: { data: CertificatePdfData }) {
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
            <Text style={s.eyebrow}>Certificat de précompte</Text>
            <Text style={s.h1}>Année {data.year}</Text>
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
          </View>
          <View style={s.party}>
            <Text style={s.label}>Artiste-auteur</Text>
            <Text style={s.val}>{a.display_name}</Text>
            {a.civil_name && a.civil_name !== a.display_name ? <Text style={s.val}>({a.civil_name})</Text> : null}
            {artistAddr ? <Text style={s.val}>{artistAddr}</Text> : null}
            <Text style={s.val}>{a.siret ? `SIRET ${a.siret}` : "Artiste-auteur"}</Text>
          </View>
        </View>

        <Text style={s.intro}>
          Nous, {c.name}, en qualité de diffuseur, certifions avoir précompté sur les droits d&apos;auteur versés
          à {a.display_name} au titre de l&apos;année {data.year}, et reversé à l&apos;Urssaf pour son compte, les
          cotisations et contributions sociales suivantes :
        </Text>

        <View style={s.box}>
          <View style={s.row}><Text style={{ color: GREY }}>Montant brut des droits d&apos;auteur</Text><Text>{euros(data.brut_cents)}</Text></View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: LINE, marginTop: 4, paddingTop: 5 }]}><Text style={{ color: GREY }}>Assurance vieillesse</Text><Text>{euros(data.vieillesse_cents)}</Text></View>
          <View style={s.row}><Text style={{ color: GREY }}>CSG</Text><Text>{euros(data.csg_cents)}</Text></View>
          <View style={s.row}><Text style={{ color: GREY }}>CRDS</Text><Text>{euros(data.crds_cents)}</Text></View>
          <View style={s.row}><Text style={{ color: GREY }}>Contribution à la formation professionnelle (CFP)</Text><Text>{euros(data.cfp_cents)}</Text></View>
          <View style={[s.row, { borderTopWidth: 1, borderTopColor: INK, marginTop: 5, paddingTop: 5 }]}>
            <Text style={s.strong}>Total précompté {data.year}</Text><Text style={s.accent}>{euros(data.precompte_cents)}</Text>
          </View>
        </View>

        {data.statements.length > 0 && (
          <>
            <Text style={[s.label, { marginBottom: 2 }]}>Relevés concernés</Text>
            <View style={s.tHead}>
              <Text style={[s.cN, s.th]}>Relevé</Text>
              <Text style={[s.cD, s.th]}>Émis le</Text>
              <Text style={[s.cB, s.th]}>Brut</Text>
              <Text style={[s.cP, s.th]}>Précompte</Text>
            </View>
            {data.statements.map((st, i) => (
              <View key={i} style={s.tRow}>
                <Text style={s.cN}>{st.number ?? "—"}</Text>
                <Text style={s.cD}>{dateFr(st.date)}</Text>
                <Text style={s.cB}>{euros(st.brut_cents)}</Text>
                <Text style={s.cP}>{euros(st.precompte_cents)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.mention}>
          Attestation établie au titre des articles L.382-1 et suivants du Code de la sécurité sociale, pour servir
          et valoir ce que de droit. Document généré le {dateFr(data.generated_at.toISOString())}.
        </Text>

        <Text style={s.footer}>{legalLine}</Text>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(data: CertificatePdfData): Promise<Buffer> {
  return renderToBuffer(<CertDoc data={data} />);
}
