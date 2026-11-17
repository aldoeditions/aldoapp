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
  renderToBuffer,
} from "@react-pdf/renderer";
import { ALDO_LOGO } from "@/lib/contracts/aldo-logo";
import type { CampaignPrintList, PrintItem } from "@/lib/data/impressions";

const ACCENT = "#0627B7";
const INK = "#1A1A1F";
const GREY = "#5D5F70";
const FAINT = "#A0A2B4";
const LINE = "#E4E6F2";

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 46, fontSize: 9, color: INK, lineHeight: 1.4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, color: FAINT, textTransform: "uppercase", marginBottom: 3 },
  h1: { fontSize: 17, color: INK },
  sub: { fontSize: 9, color: GREY, marginTop: 2 },
  summary: { marginBottom: 14, borderTopWidth: 0.5, borderTopColor: LINE, borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 7, flexDirection: "row", justifyContent: "space-between" },
  sumStrong: { fontSize: 11, color: INK },
  sumFaint: { fontSize: 9, color: GREY },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 4, marginBottom: 2 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 6, alignItems: "center" },
  cImg: { width: "14%" },
  cO: { width: "40%" },
  cA: { width: "24%" },
  cF: { width: "10%" },
  cQ: { width: "12%", textAlign: "right" },
  th: { fontSize: 7, letterSpacing: 0.5, color: GREY, textTransform: "uppercase" },
  thumb: { width: 40, height: 40, borderRadius: 3, objectFit: "cover", borderWidth: 0.5, borderColor: LINE },
  thumbEmpty: { width: 40, height: 40, borderRadius: 3, borderWidth: 0.5, borderColor: LINE, backgroundColor: "#F2F3FA" },
  name: { fontSize: 9.5, color: INK },
  qty: { fontSize: 12, color: ACCENT },
  footer: { position: "absolute", bottom: 22, left: 46, right: 46, fontSize: 6.5, color: FAINT, textAlign: "center", borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 5 },
});

function dateFr(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type ItemWithImg = PrintItem & { data_url: string | null };

function PrintDoc({
  drop,
  items,
  total_pieces,
  by_format,
}: {
  drop: CampaignPrintList["drop"];
  items: ItemWithImg[];
  total_pieces: number;
  by_format: CampaignPrintList["by_format"];
}) {
  const period =
    drop?.start_date || drop?.end_date
      ? `${dateFr(drop?.start_date ?? null)} → ${dateFr(drop?.end_date ?? null)}`
      : null;
  const formatLine = by_format.map((f) => `${f.quantity} × ${f.format}`).join("  ·  ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.eyebrow}>Liste d&apos;impression</Text>
            <Text style={s.h1}>{drop?.name ?? "Campagne"}</Text>
            {period ? <Text style={s.sub}>{period}</Text> : null}
          </View>
          <Svg viewBox={ALDO_LOGO.viewBox} width={60} height={24}>
            {ALDO_LOGO.paths.map((d, i) => (<Path key={i} d={d} fill={ALDO_LOGO.fill} />))}
          </Svg>
        </View>

        <View style={s.summary}>
          <Text style={s.sumStrong}>{total_pieces} pièce(s) à imprimer</Text>
          {formatLine ? <Text style={s.sumFaint}>{formatLine}</Text> : null}
        </View>

        <View style={s.tHead}>
          <Text style={[s.cImg, s.th]}>Visuel</Text>
          <Text style={[s.cO, s.th]}>Œuvre</Text>
          <Text style={[s.cA, s.th]}>Artiste</Text>
          <Text style={[s.cF, s.th]}>Format</Text>
          <Text style={[s.cQ, s.th]}>Qté</Text>
        </View>

        {items.map((it, i) => (
          <View key={it.oeuvre_id ?? `${it.name}-${it.format}-${i}`} style={s.tRow} wrap={false}>
            <View style={s.cImg}>
              {it.data_url ? (
                <Image src={it.data_url} style={s.thumb} />
              ) : (
                <View style={s.thumbEmpty} />
              )}
            </View>
            <View style={s.cO}><Text style={s.name}>{it.name}</Text></View>
            <Text style={[s.cA, { color: GREY }]}>{it.artist ?? "—"}</Text>
            <Text style={[s.cF, { color: GREY }]}>{it.format ?? "—"}</Text>
            <Text style={[s.cQ, s.qty]}>{it.quantity}</Text>
          </View>
        ))}

        {items.length === 0 && (
          <Text style={{ marginTop: 20, textAlign: "center", color: FAINT }}>
            Aucune vente payée sur cette campagne.
          </Text>
        )}

        <Text style={s.footer} fixed>
          Aldo Éditions — liste d&apos;impression générée le {dateFr(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
}

/** Télécharge un visuel public et le convertit en data-URL (null si échec). */
async function fetchDataUrl(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Garde-fou taille (évite un PDF monstrueux) : 6 Mo par image max.
    if (buf.byteLength > 6 * 1024 * 1024) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderPrintListPdf(data: CampaignPrintList): Promise<Buffer> {
  // Pré-télécharge les visuels (dédupliqués par URL) en parallèle.
  const urls = Array.from(new Set(data.items.map((i) => i.file_url).filter(Boolean))) as string[];
  const entries = await Promise.all(urls.map(async (u) => [u, await fetchDataUrl(u)] as const));
  const byUrl = new Map(entries);

  const items: ItemWithImg[] = data.items.map((i) => ({
    ...i,
    data_url: i.file_url ? byUrl.get(i.file_url) ?? null : null,
  }));

  return renderToBuffer(
    <PrintDoc drop={data.drop} items={items} total_pieces={data.total_pieces} by_format={data.by_format} />,
  );
}
