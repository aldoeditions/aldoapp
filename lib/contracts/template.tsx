import fs from "node:fs";
import path from "node:path";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { buildContractBody, parseBlocks } from "./body";
import { ALDO_LOGO } from "./aldo-logo";
import type { ContractData } from "./types";

/* ------------------------------- Fonts -------------------------------- */

const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const LOGO_PATH = path.join(process.cwd(), "public", "logo-aldo.png");

let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  Font.register({
    family: "DM Sans",
    fonts: [
      { src: path.join(FONT_DIR, "DMSans-Regular.ttf") },
      { src: path.join(FONT_DIR, "DMSans-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONT_DIR, "DMSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Instrument Serif",
    src: path.join(FONT_DIR, "InstrumentSerif-Regular.ttf"),
  });
  // Pas de césure automatique (contrat juridique).
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

const ACCENT = "#0627b7";
const INK = "#1a1a1a";
const GREY = "#8A8780";

const s = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 64,
    paddingHorizontal: 62,
    fontFamily: "DM Sans",
    fontSize: 9.5,
    lineHeight: 1.4,
    color: INK,
  },
  header: {
    position: "absolute",
    top: 26,
    left: 62,
    fontSize: 7.5,
    letterSpacing: 1,
    color: GREY,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 62,
    right: 62,
    textAlign: "center",
    fontSize: 7.5,
    color: GREY,
  },
  article: {
    fontFamily: "DM Sans",
    fontWeight: 700,
    fontSize: 13,
    color: ACCENT,
    marginTop: 22,
    marginBottom: 10,
  },
  heading: { fontFamily: "DM Sans", fontWeight: 700, fontSize: 10, color: ACCENT, marginTop: 13, marginBottom: 6 },
  struct: { fontFamily: "DM Sans", fontWeight: 700, marginTop: 8, marginBottom: 4 },
  para: { marginBottom: 6.5, textAlign: "left" },
  letter: { marginBottom: 6.5, marginLeft: 4, textAlign: "left" },
  bulletRow: { flexDirection: "row", marginLeft: 12, marginBottom: 4, paddingRight: 6 },
  bulletDot: { width: 10, color: ACCENT },
  bulletText: { flex: 1, textAlign: "left" },

  /* Cover */
  coverLogoWrap: { alignItems: "center", marginTop: 30, marginBottom: 44 },
  coverLogo: { height: 46, objectFit: "contain" },
  coverLogoSvg: { width: 150, height: 60 },
  coverLogoText: { fontFamily: "DM Sans", fontWeight: 700, fontSize: 28, color: ACCENT, letterSpacing: 1 },
  coverTitle: {
    fontFamily: "DM Sans",
    fontWeight: 700,
    fontSize: 21,
    color: INK,
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 1.25,
  },
  coverRule: { height: 2, width: 60, backgroundColor: ACCENT, alignSelf: "center", marginVertical: 18 },
  coverParties: { textAlign: "center", fontSize: 12, marginBottom: 2 },
  coverPartiesSub: { textAlign: "center", fontSize: 9.5, color: GREY, marginBottom: 30 },

  recap: { marginTop: 24, borderTopWidth: 1, borderColor: "#e6e6ea" },
  recapRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e6e6ea" },
  recapKey: { width: 150, paddingVertical: 7, paddingRight: 10, color: GREY, fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.5 },
  recapVal: { flex: 1, paddingVertical: 7, fontWeight: 500 },

  /* Signature */
  faitLine: { marginTop: 22, marginBottom: 18, fontWeight: 700 },
  signRow: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  signBlock: { flex: 1, borderWidth: 1, borderColor: "#d9d9de", borderRadius: 4, padding: 12 },
  signLabel: { fontWeight: 700, marginBottom: 4 },
  signSpace: { height: 120 },
  signName: { fontWeight: 500 },
  signRole: { color: GREY, fontSize: 8.5 },

  /* Annexe */
  annexeTitle: { fontFamily: "DM Sans", fontWeight: 700, fontSize: 16, color: ACCENT, marginBottom: 8 },
  annexeIntro: { marginBottom: 16, color: GREY },
  tHead: { flexDirection: "row", backgroundColor: "#f4f5fb", borderBottomWidth: 1, borderColor: ACCENT },
  tHeadCell: { fontWeight: 700, fontSize: 8.5, paddingVertical: 6, paddingHorizontal: 6 },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e6e6ea" },
  tCell: { fontSize: 8.5, paddingVertical: 6, paddingHorizontal: 6 },
  cTitre: { width: "30%" },
  cFormat: { width: "16%" },
  cCarac: { width: "34%" },
  cDate: { width: "20%" },
});

/* --------------------------- Blocs de corps --------------------------- */

function Body({ blocks }: { blocks: ReturnType<typeof parseBlocks> }) {
  return (
    <>
      {blocks.map((b, i) => {
        // minPresenceAhead : évite un titre orphelin en bas de page (il bascule
        // à la page suivante s'il n'y a pas assez de contenu derrière lui).
        if (b.type === "article") return <Text key={i} style={s.article} minPresenceAhead={56}>{b.text}</Text>;
        if (b.type === "heading") return <Text key={i} style={s.heading} minPresenceAhead={40}>{b.text}</Text>;
        if (b.type === "struct") return <Text key={i} style={s.struct}>{b.text}</Text>;
        if (b.type === "letter") return <Text key={i} style={s.letter}>{b.text}</Text>;
        if (b.type === "bullet")
          return (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{b.text}</Text>
            </View>
          );
        return <Text key={i} style={s.para}>{b.text}</Text>;
      })}
    </>
  );
}

function RecapRow({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.recapRow}>
      <Text style={s.recapKey}>{k}</Text>
      <Text style={s.recapVal}>{v}</Text>
    </View>
  );
}

/* ------------------------------ Document ------------------------------ */

export function ContractDocument({ data }: { data: ContractData }) {
  ensureFonts();
  const blocks = parseBlocks(buildContractBody(data));
  const hasLogo = fs.existsSync(LOGO_PATH);
  const periode = `${data.campaignStart} → ${data.campaignEnd}`;

  const Header = () => <Text style={s.header} fixed>ALDO ÉDITIONS</Text>;
  // Le pied de page (« page X/Y ») est imprimé en post-traitement (pdf-lib) :
  // le `render`/`totalPages` de react-pdf plante (« unsupported number ») sur ce contenu.
  const Footer = () => null;

  return (
    <Document
      title={`Contrat Aldo × ${data.fullName}`}
      author="Aldo Éditions"
      subject="Contrat de licence de droits d'auteur et de partenariat commercial"
    >
      {/* Page de garde */}
      <Page size="A4" style={s.page}>
        <Footer />
        <View style={s.coverLogoWrap}>
          {hasLogo ? (
            <Image src={LOGO_PATH} style={s.coverLogo} />
          ) : (
            <Svg viewBox={ALDO_LOGO.viewBox} style={s.coverLogoSvg}>
              {ALDO_LOGO.paths.map((d, i) => (
                <Path key={i} d={d} fill={ALDO_LOGO.fill} />
              ))}
            </Svg>
          )}
        </View>

        <Text style={s.coverTitle}>Contrat de licence de droits d&apos;auteur</Text>
        <Text style={s.coverTitle}>et de partenariat commercial</Text>
        <View style={s.coverRule} />

        <Text style={s.coverParties}>La société ALDO</Text>
        <Text style={s.coverPartiesSub}>&amp; {data.fullName}</Text>

        <View style={s.recap}>
          <RecapRow k="Artiste" v={data.fullName} />
          <RecapRow k="Campagne" v={data.campaignName} />
          <RecapRow k="Période" v={periode} />
          <RecapRow k="Date de génération" v={data.generationDate} />
        </View>
      </Page>

      {/* Corps */}
      <Page size="A4" style={s.page}>
        <Header />
        <Footer />
        <Body blocks={blocks} />

        {/* FAIT À … + signatures */}
        <View wrap={false}>
          <Text style={s.faitLine}>
            FAIT À {data.generationPlace}, LE {data.generationDate}, EN DEUX EXEMPLAIRES ORIGINAUX
          </Text>
          <View style={s.signRow}>
            <View style={s.signBlock}>
              <Text style={s.signLabel}>Pour la société ALDO</Text>
              <View style={s.signSpace} />
              <Text style={s.signName}>Louison Dupont</Text>
              <Text style={s.signRole}>Président</Text>
            </View>
            <View style={s.signBlock}>
              <Text style={s.signLabel}>Pour l&apos;Artiste</Text>
              <View style={s.signSpace} />
              <Text style={s.signName}>{data.fullName}</Text>
              <Text style={s.signRole}>L&apos;Artiste</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Annexe 1 */}
      <Page size="A4" style={s.page}>
        <Header />
        <Footer />
        <Text style={s.annexeTitle}>Annexe 1</Text>
        <Text style={s.annexeIntro}>
          Liste des Œuvres concédées en licence — {data.campaignName}.
        </Text>

        <View style={s.tHead}>
          <Text style={[s.tHeadCell, s.cTitre]}>Titre</Text>
          <Text style={[s.tHeadCell, s.cFormat]}>Format</Text>
          <Text style={[s.tHeadCell, s.cCarac]}>Caractéristiques du fichier</Text>
          <Text style={[s.tHeadCell, s.cDate]}>Date de création</Text>
        </View>
        {data.oeuvres.length === 0 ? (
          <Text style={{ paddingVertical: 10, color: GREY }}>
            Aucune œuvre rattachée à cette campagne à la date de génération.
          </Text>
        ) : (
          data.oeuvres.map((o, i) => (
            <View key={i} style={s.tRow}>
              <Text style={[s.tCell, s.cTitre]}>{o.title}</Text>
              <Text style={[s.tCell, s.cFormat]}>{o.format}</Text>
              <Text style={[s.tCell, s.cCarac]}>{o.fileInfo}</Text>
              <Text style={[s.tCell, s.cDate]}>{o.createdAt}</Text>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
