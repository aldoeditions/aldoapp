"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { CHARGE_TYPES, CHARGE_CATEGORIES } from "@/lib/constants";

export function ChargesFilters({ drops }: { drops: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const selectCls =
    "rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Libellé…"
          onChange={(e) => setParam("q", e.target.value)}
          className="w-44 rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>
      <select value={params.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value)} className={selectCls}>
        <option value="">Tous types</option>
        {CHARGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select value={params.get("categorie") ?? ""} onChange={(e) => setParam("categorie", e.target.value)} className={selectCls}>
        <option value="">Toutes catégories</option>
        {CHARGE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select value={params.get("drop") ?? ""} onChange={(e) => setParam("drop", e.target.value)} className={selectCls}>
        <option value="">Tous drops</option>
        {drops.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </div>
  );
}
