/**
 * Seed Diane Cartron (données du contrat) + génération de contrat de bout en bout :
 * lecture DB → PDF → upload Storage "contracts" → entrée contracts.
 * Lancer : npx tsx scripts/seed-test-contract.tsx
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildContractData, renderContractPdf, groupOeuvresByTitle } from "../lib/contracts/generate";

const env: Record<string, string> = {};
for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

(async () => {
  // 1. Diane (upsert par nom)
  const existing = await s.from("artists").select("id").eq("name", "Diane Cartron").maybeSingle();
  const artistFields = {
    name: "Diane Cartron",
    civility: "Madame",
    first_name: "Diane",
    last_name: "Cartron",
    birth_date: "1995-10-25",
    birth_place: "Mont-de-Marsan",
    mda_number: "48845",
    address: "29 rue Hippolyte Maindron",
    city: "75014 Paris",
    email: "contact.dianecartron@gmail.com",
    type: "Artiste",
    phase: "actif",
    pipe_status: "confirmé",
    commission_pct: 30,
  };
  let artistId: string;
  if (existing.data) {
    artistId = existing.data.id;
    await s.from("artists").update(artistFields).eq("id", artistId);
  } else {
    const ins = await s.from("artists").insert(artistFields).select("id").single();
    if (ins.error) throw ins.error;
    artistId = ins.data.id;
  }
  console.log("Diane artistId:", artistId);

  // 2. IBAN
  const bk = await s.from("artist_banking").upsert(
    { artist_id: artistId, iban: "FR76 1027 8375 3600 0105 2050 567", bic: "BNPAFRPP" },
    { onConflict: "artist_id" },
  );
  if (bk.error) throw bk.error;

  // 3. Drop de Mars 2026
  const drop = (await s.from("drops").select("*").eq("name", "Drop de Mars 2026").maybeSingle()).data;
  if (!drop) throw new Error("Drop de Mars 2026 introuvable");

  // 4. « Herbier #1 » en A3 ET A4 (même visuel) → doit fusionner dans l'annexe.
  const already = (await s.from("oeuvres").select("id, format").eq("artist_id", artistId).eq("drop_id", drop.id)).data ?? [];
  for (const fmt of ["A3", "A4"]) {
    if (!already.some((o) => o.format === fmt)) {
      const oi = await s.from("oeuvres").insert({
        name: "Herbier #1", artist_id: artistId, drop_id: drop.id,
        format: fmt, price: fmt === "A3" ? 40 : 25, status: "actif",
      }).select("id").single();
      if (oi.error) throw oi.error;
    }
  }
  const oeuvres = (await s.from("oeuvres").select("name, format, created_at").eq("artist_id", artistId).eq("drop_id", drop.id)).data ?? [];

  // 5. Génération PDF (mêmes libs que l'action serveur, avec fusion des formats)
  const data = buildContractData({
    artist: artistFields,
    iban: "FR76 1027 8375 3600 0105 2050 567",
    drop,
    oeuvres: groupOeuvresByTitle(
      oeuvres.map((o) => ({ title: o.name, format: o.format ?? null, fileInfo: "Fichier HD fourni", createdAt: o.created_at })),
    ),
    commissionPct: 30,
  });
  const pdf = await renderContractPdf(data);
  console.log("PDF généré:", pdf.length, "octets");

  // 6. Upload Storage
  const dateStr = new Date().toISOString().slice(0, 10);
  const path = `${artistId}/${drop.id}-${dateStr}.pdf`;
  const up = await s.storage.from("contracts").upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (up.error) throw up.error;
  console.log("Uploadé:", path);

  // 7. Entrée contracts (idempotent : on nettoie un éventuel doublon même drop)
  await s.from("contracts").delete().eq("artist_id", artistId).eq("drop_id", drop.id);
  const c = await s.from("contracts").insert({
    artist_id: artistId, drop_id: drop.id, status: "brouillon",
    commission_pct: 30, generated_at: new Date().toISOString(), pdf_path: path,
  }).select("id").single();
  if (c.error) throw c.error;
  console.log("Contrat créé:", c.data.id);

  // 8. Re-download depuis Storage → contrôle
  const dl = await s.storage.from("contracts").download(path);
  const bytes = dl.data ? Buffer.from(await dl.data.arrayBuffer()) : null;
  console.log("Re-download Storage:", bytes?.length, "octets");
  console.log("\n✅ Bout-en-bout OK — fiche Diane + contrat brouillon générés et stockés.");
})().catch((e) => { console.error("💥", e.message ?? e); process.exit(1); });
