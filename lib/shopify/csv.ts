/**
 * Construction du CSV d'import produits Shopify à partir des œuvres d'un drop.
 * Regroupe les variantes A3/A4 d'un même visuel en un seul produit.
 */

export type ShopifyExportRow = {
  id: string;
  name: string | null;
  format: string | null;
  price: number | null;
  description: string | null;
  sku: string | null;
  file_url: string | null;
  artists: { name: string | null } | null;
};

function csv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Nom du visuel sans le suffixe de format (« … - A3 » / « … - A4 »). */
export function baseName(name: string | null): string {
  return (name ?? "").replace(/\s*[-–]\s*(A3|A4)\s*$/i, "").trim();
}
/** Préfixe SKU commun aux variantes d'un même visuel (ALDO-XX-001). */
function skuPrefix(sku: string | null): string {
  return (sku ?? "").replace(/-(A3|A4)$/i, "");
}
/** Handle Shopify : slug minuscule sans accents. */
function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const HEADERS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Tags", "Published",
  "Option1 Name", "Option1 Value",
  "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty",
  "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
  "Variant Requires Shipping", "Variant Taxable",
  "Image Src", "Image Position", "Status",
];

export function buildShopifyCsv(rows: ShopifyExportRow[]): string {
  const groups = new Map<string, ShopifyExportRow[]>();
  for (const o of rows) {
    const key = skuPrefix(o.sku) || baseName(o.name) || o.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  }

  const usedHandles = new Set<string>();
  const lines: string[] = [HEADERS.map(csv).join(",")];

  const sortedGroups = Array.from(groups.values()).sort((a, b) =>
    baseName(a[0].name).localeCompare(baseName(b[0].name), "fr"),
  );

  for (const variants of sortedGroups) {
    variants.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); // A4 (25€) avant A3 (40€)
    const title = baseName(variants[0].name) || variants[0].name || "Sans titre";
    const vendor = variants[0].artists?.name ?? "";
    const descSrc = variants.find((v) => (v.description ?? "").trim())?.description ?? "";
    const bodyHtml = descSrc
      ? `<p>${descSrc.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
      : "";
    const imageUrl = variants.find((v) => (v.file_url ?? "").trim())?.file_url ?? "";

    let handle = slug(title) || slug(skuPrefix(variants[0].sku)) || variants[0].id;
    if (usedHandles.has(handle)) handle = `${handle}-${slug(skuPrefix(variants[0].sku))}`;
    usedHandles.add(handle);

    variants.forEach((v, i) => {
      const first = i === 0;
      const rec: Record<string, string> = {
        Handle: handle,
        Title: first ? title : "",
        "Body (HTML)": first ? bodyHtml : "",
        Vendor: first ? vendor : "",
        Tags: "",
        Published: first ? "FALSE" : "",
        "Option1 Name": first ? "Format" : "",
        "Option1 Value": v.format ?? "",
        "Variant SKU": v.sku ?? "",
        "Variant Grams": "0",
        "Variant Inventory Tracker": "",
        "Variant Inventory Qty": "0",
        "Variant Inventory Policy": "continue",
        "Variant Fulfillment Service": "manual",
        "Variant Price": v.price != null ? String(v.price) : "",
        "Variant Requires Shipping": "TRUE",
        "Variant Taxable": "TRUE",
        "Image Src": first ? imageUrl : "",
        "Image Position": first && imageUrl ? "1" : "",
        Status: first ? "draft" : "",
      };
      lines.push(HEADERS.map((h) => csv(rec[h])).join(","));
    });
  }

  return "﻿" + lines.join("\r\n") + "\r\n";
}
