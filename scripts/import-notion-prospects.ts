/**
 * Import de la base Notion « Prospection artistes » vers la table Supabase `artists`.
 *
 * Usage :
 *   npx tsx scripts/import-notion-prospects.ts [chemin.csv] [--limit=N] [--dry-run] [--yes]
 *
 *   [chemin.csv]   Optionnel. Par défaut : premier .csv trouvé dans data/notion-import/.
 *   --limit=N      Ne traiter que les N premières lignes de données (test).
 *   --dry-run      Tout faire (rapport) SAUF l'insertion. Pas de confirmation demandée.
 *   --yes          Sauter la confirmation interactive (insertion directe).
 *
 * Nécessite dans .env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/* Config & args                                                       */
/* ------------------------------------------------------------------ */

const IMPORT_DIR = "data/notion-import";
const BATCH_SIZE = 50;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")).map((a) => a.split("=")[0]));
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null;
const DRY_RUN = flags.has("--dry-run");
const AUTO_YES = flags.has("--yes");
const csvPathArg = args.find((a) => !a.startsWith("--"));

/* Valeurs CHECK réelles de la table artists (cf. mémoire projet, probées). */
const ALLOWED_PIPE = new Set(["prospect", "contacté", "intéressé", "confirmé"]);
const ALLOWED_TYPE = new Set(["Artiste", "Collectif", "Studio"]);
const ALLOWED_PHASE = new Set(["prospect", "suivi", "actif", "inactif"]);
const ALLOWED_RENOMMEE = new Set(["Connu", "En devenir"]); // + null autorisé

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(".env.local", "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
  }
  return { url, key };
}

function resolveCsvPath(): string {
  if (csvPathArg) return csvPathArg;
  const files = readdirSync(IMPORT_DIR).filter((f) => f.toLowerCase().endsWith(".csv"));
  if (files.length === 0) throw new Error(`Aucun .csv dans ${IMPORT_DIR}/`);
  if (files.length > 1) {
    console.warn(`⚠ Plusieurs CSV trouvés, utilisation de « ${files[0]} ». Précise un chemin pour choisir.`);
  }
  return join(IMPORT_DIR, files[0]);
}

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const orNull = (v: unknown): string | null => {
  const s = clean(v);
  return s.length ? s : null;
};

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/** « January 28, 2026 » → « 2026-01-28 ». Robuste aux fuseaux (pas de new Date). */
function parseNotionDate(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  const m = s.match(/^([A-Za-zéûîà]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    if (mm) return `${m[3]}-${mm}-${m[2].padStart(2, "0")}`;
  }
  // Repli : déjà au format ISO ?
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function mapPipeStatus(v: unknown): { value: string; isDefault: boolean } {
  switch (clean(v)) {
    case "Prospect": return { value: "prospect", isDefault: false };
    case "Contacté en attente de retour": return { value: "contacté", isDefault: false };
    case "Intéressé(e) / Envoyer le kit": return { value: "intéressé", isDefault: false };
    case "Confirmé !": return { value: "confirmé", isDefault: false };
    default: return { value: "prospect", isDefault: true };
  }
}

function mapType(v: unknown): { value: string; isDefault: boolean } {
  switch (clean(v)) {
    case "Artiste": return { value: "Artiste", isDefault: false };
    case "Collectif": return { value: "Collectif", isDefault: false };
    case "Studio": return { value: "Studio", isDefault: false };
    case "Editeur": return { value: "Studio", isDefault: false }; // fusion assumée
    default: return { value: "Artiste", isDefault: true };
  }
}

function mapRenommee(v: unknown): string | null {
  switch (clean(v)) {
    case "Star":
    case "Très connu":
    case "Connu": return "Connu";
    case "En devenir": return "En devenir";
    default: return null;
  }
}

function mapContactedBy(v: unknown): string | null {
  const s = clean(v);
  return s === "Louison" || s === "Tom" ? s : null;
}

/* ------------------------------------------------------------------ */
/* Transformation                                                      */
/* ------------------------------------------------------------------ */

type ArtistRow = {
  name: string;
  pipe_status: string;
  phase: string;
  type: string;
  style: string | null;
  renommee: string | null;
  instagram: string | null;
  contacted_by: string | null;
  first_contact_date: string | null;
  first_contact_info: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  dans_le_pipe_notion: string | null;
};

function transform(rec: Record<string, string>): { row: ArtistRow; defaults: string[] } {
  const pipe = mapPipeStatus(rec["Status"]);
  const typ = mapType(rec["Type"]);
  const defaults: string[] = [];
  if (pipe.isDefault) defaults.push("pipe_status→prospect");
  if (typ.isDefault) defaults.push("type→Artiste");

  const row: ArtistRow = {
    name: clean(rec["Nom de l'artiste"]),
    pipe_status: pipe.value,
    phase: "prospect",
    type: typ.value,
    style: orNull(rec["Style"]),
    renommee: mapRenommee(rec["Renommé"]),
    instagram: orNull(rec["Lien"]),
    contacted_by: mapContactedBy(rec["Contact par qui"]),
    first_contact_date: parseNotionDate(rec["1er Contact Date"]),
    first_contact_info: orNull(rec["1er Contact Info"]),
    email: orNull(rec["Email"]),
    phone: orNull(rec["Phone"]),
    address: orNull(rec["Adresse postale"]),
    dans_le_pipe_notion: orNull(rec["Dans le pipe"]),
  };
  return { row, defaults };
}

function validate(row: ArtistRow): string | null {
  if (!row.name) return "name vide";
  if (!ALLOWED_PIPE.has(row.pipe_status)) return `pipe_status invalide (${row.pipe_status})`;
  if (!ALLOWED_TYPE.has(row.type)) return `type invalide (${row.type})`;
  if (!ALLOWED_PHASE.has(row.phase)) return `phase invalide (${row.phase})`;
  if (row.renommee !== null && !ALLOWED_RENOMMEE.has(row.renommee)) return `renommee invalide (${row.renommee})`;
  return null;
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a); }));
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const { url, key } = loadEnv();
  const csvPath = resolveCsvPath();
  console.log(`📄 Fichier : ${csvPath}`);
  if (LIMIT) console.log(`   (--limit=${LIMIT} : test sur les ${LIMIT} premières lignes)`);
  if (DRY_RUN) console.log("   (--dry-run : aucune insertion)");

  const content = readFileSync(csvPath, "utf8");
  const records = parse(content, {
    bom: true,
    columns: true,
    delimiter: ",",
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const rawRows = LIMIT ? records.slice(0, LIMIT) : records;

  const skippedEmpty: number[] = [];      // n° de ligne CSV (header = 1)
  const duplicates: { name: string; line: number }[] = [];
  const seen = new Map<string, number>(); // nom normalisé → 1re ligne
  const candidates: { row: ArtistRow; line: number }[] = [];
  const invalid: { line: number; reason: string }[] = [];
  let defaultsCount = 0;
  const defaultsDetail: Record<string, number> = {};

  rawRows.forEach((rec, i) => {
    const line = i + 2; // +1 header, +1 index→ligne
    const name = clean(rec["Nom de l'artiste"]);
    if (!name) {
      skippedEmpty.push(line);
      return;
    }
    const norm = name.toLowerCase();
    if (seen.has(norm)) {
      duplicates.push({ name, line });
      return;
    }
    seen.set(norm, line);

    const { row, defaults } = transform(rec);
    const err = validate(row);
    if (err) {
      invalid.push({ line, reason: err });
      return;
    }
    if (defaults.length) {
      defaultsCount++;
      for (const d of defaults) defaultsDetail[d] = (defaultsDetail[d] ?? 0) + 1;
    }
    candidates.push({ row, line });
  });

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Existants en base (par nom exact, normalisé casse).
  const { data: existingData, error: existErr } = await supabase
    .from("artists")
    .select("name");
  if (existErr) throw new Error(`Lecture des artistes existants : ${existErr.message}`);
  const existing = new Set((existingData ?? []).map((a) => (a.name ?? "").trim().toLowerCase()));

  const toInsert = candidates.filter((c) => !existing.has(c.row.name.toLowerCase()));
  const alreadyThere = candidates.filter((c) => existing.has(c.row.name.toLowerCase()));

  /* ----------------------------- Rapport ---------------------------- */
  console.log("\n──────────── RAPPORT (avant insertion) ────────────");
  console.log(`Lignes de données lues        : ${rawRows.length}`);
  console.log(`✅ Valides prêtes à importer   : ${toInsert.length}`);
  console.log(`↩️  Déjà en base (skip)         : ${alreadyThere.length}`);
  console.log(`⛔ Ignorées (nom vide)         : ${skippedEmpty.length}${skippedEmpty.length ? " → lignes " + skippedEmpty.join(", ") : ""}`);
  console.log(`♻️  Doublons CSV (skip)         : ${duplicates.length}`);
  if (duplicates.length) {
    for (const d of duplicates) console.log(`     · « ${d.name} » (ligne ${d.line})`);
  }
  console.log(`🔧 Valeurs par défaut appliquées: ${defaultsCount} ligne(s)`);
  for (const [k, v] of Object.entries(defaultsDetail)) console.log(`     · ${k} : ${v}`);
  if (invalid.length) {
    console.log(`❌ Invalides (exclues)         : ${invalid.length}`);
    for (const iv of invalid) console.log(`     · ligne ${iv.line} : ${iv.reason}`);
  }
  if (alreadyThere.length) {
    console.log("   Déjà en base :");
    for (const a of alreadyThere) console.log(`     · « ${a.row.name} » (ligne ${a.line})`);
  }
  console.log("────────────────────────────────────────────────────\n");

  if (DRY_RUN) {
    console.log("🅳 Dry-run : arrêt avant insertion.");
    console.log("Aperçu des 3 premières lignes transformées :");
    console.log(JSON.stringify(toInsert.slice(0, 3).map((c) => c.row), null, 2));
    return;
  }

  if (toInsert.length === 0) {
    console.log("Rien à insérer. Fin.");
    return;
  }

  if (!AUTO_YES) {
    const answer = (await ask(`Insérer ${toInsert.length} artiste(s) en base ? [y/N] `)).trim().toLowerCase();
    if (answer !== "y" && answer !== "yes" && answer !== "o" && answer !== "oui") {
      console.log("Annulé. Aucune insertion.");
      return;
    }
  }

  /* ----------------------------- Insertion -------------------------- */
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE).map((c) => c.row);
    const { error } = await supabase.from("artists").insert(batch);
    if (error) {
      errors += batch.length;
      console.error(`  ✗ Batch ${i / BATCH_SIZE + 1} (${batch.length}) : ${error.message}`);
    } else {
      inserted += batch.length;
      console.log(`  ✓ Batch ${i / BATCH_SIZE + 1} : ${batch.length} insérés`);
    }
  }

  console.log("\n──────────── RAPPORT FINAL ────────────");
  console.log(`✅ Importés          : ${inserted}`);
  console.log(`↩️  Ignorés (existants): ${alreadyThere.length}`);
  console.log(`⛔ Ignorés (nom vide) : ${skippedEmpty.length}`);
  console.log(`♻️  Doublons CSV      : ${duplicates.length}`);
  console.log(`❌ Erreurs           : ${errors}`);
  console.log("───────────────────────────────────────");
}

main().catch((e) => {
  console.error("\n💥 Erreur fatale :", e instanceof Error ? e.message : e);
  process.exit(1);
});
