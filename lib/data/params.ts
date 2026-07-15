import { createClient } from "@/lib/supabase/server";

export type PackagingItem = { name: string; valeur: number };

export type FormatCosts = {
  format: string;
  prix: number;
  impression: number;
  packaging: PackagingItem[];
  packagingTotal: number;
};

/** Coûts par format (impression + détail packaging) pour l'édition des paramètres. */
export async function getParamsForEdit(): Promise<FormatCosts[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("params")
    .select("type, format, prix_vente, valeur, details");
  const rows = data ?? [];

  return ["A3", "A4"].map((f) => {
    const imp = rows.find((r) => r.type === "Impression" && r.format === f);
    const pack = rows.find((r) => r.type === "Packaging" && r.format === f);
    const packaging = Array.isArray(pack?.details)
      ? (pack!.details as PackagingItem[])
      : [];
    return {
      format: f,
      prix: imp?.prix_vente ?? 0,
      impression: imp?.valeur ?? 0,
      packaging,
      packagingTotal:
        pack?.valeur ?? packaging.reduce((s, i) => s + (i.valeur || 0), 0),
    };
  });
}
