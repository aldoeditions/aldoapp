"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const selectCls =
  "rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function OeuvresFilters({
  artists,
  drops,
}: {
  artists: { id: string; name: string }[];
  drops: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const artist = params.get("artist") ?? "";
  const drop = params.get("drop") ?? "";
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          defaultValue={q}
          placeholder="Rechercher une œuvre…"
          onChange={(e) => setParam("q", e.target.value)}
          className="w-52 rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <select value={artist} onChange={(e) => setParam("artist", e.target.value)} className={selectCls}>
        <option value="">Tous les artistes</option>
        {artists.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      <select value={drop} onChange={(e) => setParam("drop", e.target.value)} className={selectCls}>
        <option value="">Tous les drops</option>
        <option value="none">Sans drop (à rattacher)</option>
        {drops.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}
