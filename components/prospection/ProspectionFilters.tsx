"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/cn";
import { PIPE_STATUSES, TEAM } from "@/lib/constants";

export function ProspectionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") === "kanban" ? "kanban" : "table";
  const q = params.get("q") ?? "";
  const pipe = params.get("pipe") ?? "";
  const by = params.get("by") ?? "";

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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* Recherche */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            defaultValue={q}
            placeholder="Rechercher…"
            onChange={(e) => setParam("q", e.target.value)}
            className="w-48 rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>

        {/* Filtre étape (uniquement utile en tableau) */}
        <select value={pipe} onChange={(e) => setParam("pipe", e.target.value)} className={selectCls}>
          <option value="">Toutes étapes</option>
          {PIPE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Filtre contacté par */}
        <select value={by} onChange={(e) => setParam("by", e.target.value)} className={selectCls}>
          <option value="">Tous contacts</option>
          {TEAM.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Bascule vue */}
      <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
        {(["table", "kanban"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setParam("view", v === "table" ? "" : v)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              view === v ? "bg-text text-white" : "text-muted hover:text-text",
            )}
          >
            {v === "table" ? "Tableau" : "Kanban"}
          </button>
        ))}
      </div>
    </div>
  );
}
