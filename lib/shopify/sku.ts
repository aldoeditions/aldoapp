import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Nomenclature SKU Aldo : ALDO-{CODE_ARTISTE}-{NUM}-{FORMAT}
 *   ex. ALDO-DC-001-A4
 * - CODE_ARTISTE : 2 à 4 caractères [A-Z0-9] (artists.sku_code)
 * - NUM          : 3 chiffres, séquentiel par artiste
 * - FORMAT        : A4 | A3
 *
 * Le SKU est la clé de liaison Shopify ↔ app (lisible, stable, parsable).
 */

export const SKU_FORMATS = ["A4", "A3"] as const;
export type SkuFormat = (typeof SKU_FORMATS)[number];

export type ParsedSku = {
  prefix: "ALDO";
  artistCode: string;
  numero: number;
  format: SkuFormat;
};

const SKU_RE = /^ALDO-([A-Z0-9]{2,4})-(\d{3})-(A4|A3)$/;

/**
 * Valide et décompose un SKU. Retourne `null` (sans lever d'erreur) si la
 * nomenclature ne correspond pas — un SKU inconnu ne doit jamais faire échouer
 * le traitement d'une commande.
 */
export function parseSku(sku: string | null | undefined): ParsedSku | null {
  if (!sku) return null;
  const m = SKU_RE.exec(sku.trim().toUpperCase());
  if (!m) return null;
  return {
    prefix: "ALDO",
    artistCode: m[1],
    numero: parseInt(m[2], 10),
    format: m[3] as SkuFormat,
  };
}

/** Génère un SKU depuis ses composants (numéro paddé à 3 chiffres). */
export function buildSku(artistCode: string, numero: number, format: SkuFormat): string {
  return `ALDO-${artistCode.toUpperCase()}-${String(numero).padStart(3, "0")}-${format}`;
}

export type ResolvedOeuvre = {
  id: string;
  name: string;
  artist_id: string;
  format: string;
  sku: string | null;
  numero: number | null;
};

const OEUVRE_COLS = "id, name, artist_id, format, sku, numero";

/**
 * Retrouve l'œuvre correspondant à un SKU, en trois passes :
 *   1. correspondance directe sur oeuvres.sku (cas normal) ;
 *   2. sinon, parse le SKU et retrouve par (artists.sku_code, numero, format)
 *      — utile si le SKU a été renseigné après coup côté app ;
 *   3. sinon `null` : le traitement continue avec oeuvre_id à null, l'anomalie
 *      est remontée en interface pour rattachement manuel.
 *
 * Ne lève jamais : toute erreur de requête est avalée et renvoie `null`.
 */
export async function resolveOeuvre(
  supabase: SupabaseClient<Database>,
  sku: string | null | undefined,
): Promise<ResolvedOeuvre | null> {
  if (!sku) return null;
  const raw = sku.trim();

  // 1. Correspondance directe par SKU.
  {
    const { data } = await supabase
      .from("oeuvres")
      .select(OEUVRE_COLS)
      .eq("sku", raw)
      .maybeSingle();
    if (data) return data as ResolvedOeuvre;
  }

  // 2. Reconstruction via (sku_code artiste, numero, format).
  const parsed = parseSku(raw);
  if (!parsed) return null;

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("sku_code", parsed.artistCode)
    .maybeSingle();
  if (!artist) return null;

  const { data } = await supabase
    .from("oeuvres")
    .select(OEUVRE_COLS)
    .eq("artist_id", artist.id)
    .eq("numero", parsed.numero)
    .eq("format", parsed.format)
    .maybeSingle();

  return (data as ResolvedOeuvre) ?? null;
}
