"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dateCourte } from "@/lib/format";
import { attachOrderItem } from "@/app/(app)/parametres/shopify/actions";
import type { UnresolvedItem, OeuvreForAttach } from "@/lib/data/shopify";

export function UnresolvedList({
  items,
  oeuvres,
}: {
  items: UnresolvedItem[];
  oeuvres: OeuvreForAttach[];
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">Aucun SKU non résolu. 🎉</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
            <th className="px-5 py-2.5 font-semibold">SKU</th>
            <th className="px-3 py-2.5 font-semibold">Produit</th>
            <th className="px-3 py-2.5 font-semibold">Commande</th>
            <th className="px-3 py-2.5 font-semibold">Rattacher à une œuvre</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <Row key={it.id} item={it} oeuvres={oeuvres} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ item, oeuvres }: { item: UnresolvedItem; oeuvres: OeuvreForAttach[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [oeuvreId, setOeuvreId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <tr className="border-b border-border last:border-0 align-top">
      <td className="px-5 py-3 font-mono text-2xs text-text">{item.sku}</td>
      <td className="px-3 py-3 text-muted">
        {item.title_snapshot ?? "—"} <span className="text-faint">×{item.quantity}</span>
      </td>
      <td className="px-3 py-3 text-muted">
        {item.order_number ?? "—"}
        {item.order_date ? <span className="block text-2xs text-faint">{dateCourte(item.order_date)}</span> : null}
      </td>
      <td className="px-3 py-3">
        <select
          value={oeuvreId}
          onChange={(e) => setOeuvreId(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none focus:border-accent"
        >
          <option value="">— Choisir une œuvre —</option>
          {oeuvres.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}{o.artist_name ? ` · ${o.artist_name}` : ""}{o.sku ? ` (${o.sku})` : ""}
            </option>
          ))}
        </select>
        {msg && <span className="mt-1 block text-2xs text-danger">{msg}</span>}
      </td>
      <td className="px-5 py-3 text-right">
        <button
          type="button"
          disabled={pending || !oeuvreId}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const res = await attachOrderItem(item.id, oeuvreId);
              if (res.error) setMsg(res.error);
              else router.refresh();
            })
          }
          className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-accentHover disabled:opacity-50"
        >
          {pending ? "…" : "Rattacher"}
        </button>
      </td>
    </tr>
  );
}
