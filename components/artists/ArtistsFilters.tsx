"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/cn";
import { ARTIST_PHASES } from "@/lib/constants";

/** Onglets de phase + recherche, pilotés par l'URL (?phase=&q=). */
export function ArtistsFilters({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activePhase = params.get("phase") ?? "";
  const q = params.get("q") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const tabs = [
    { value: "", label: "Tous", count: total },
    ...ARTIST_PHASES.map((p) => ({
      value: p.value,
      label: p.label,
      count: counts[p.value] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => {
          const active = activePhase === t.value;
          return (
            <button
              key={t.value || "all"}
              onClick={() => setParam("phase", t.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-text text-white"
                  : "text-muted hover:bg-border/50 hover:text-text",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-2xs",
                  active ? "bg-white/20" : "bg-border/60 text-muted",
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative sm:w-64">
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
          placeholder="Rechercher un artiste…"
          onChange={(e) => setParam("q", e.target.value)}
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>
    </div>
  );
}
