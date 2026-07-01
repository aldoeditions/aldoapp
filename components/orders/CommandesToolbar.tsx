"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/cn";
import { ORDER_STATUSES } from "@/lib/constants";

export function CommandesToolbar({
  drops,
}: {
  drops: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") === "vagues" ? "vagues" : "commandes";
  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const drop = params.get("drop") ?? "";

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
    <div className="space-y-3">
      {/* Onglets */}
      <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
        {(["commandes", "vagues"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setParam("tab", t === "commandes" ? "" : t)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-text text-white" : "text-muted hover:text-text",
            )}
          >
            {t === "commandes" ? "Commandes" : "Vagues d'impression"}
          </button>
        ))}
      </div>

      {/* Filtres (onglet commandes) */}
      {tab === "commandes" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="search"
              defaultValue={q}
              placeholder="Client…"
              onChange={(e) => setParam("q", e.target.value)}
              className="w-44 rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <select value={status} onChange={(e) => setParam("status", e.target.value)} className={selectCls}>
            <option value="">Tous statuts</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={drop} onChange={(e) => setParam("drop", e.target.value)} className={selectCls}>
            <option value="">Tous drops</option>
            {drops.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
