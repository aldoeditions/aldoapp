"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SOCIAL_STATUSES } from "@/lib/constants";

const selectCls =
  "rounded-md border border-border bg-surface px-2.5 py-2 text-2xs text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function SocialFilters({ drops }: { drops: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const drop = params.get("drop") ?? "";
  const status = params.get("status") ?? "";

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
      <select value={status} onChange={(e) => setParam("status", e.target.value)} className={selectCls}>
        <option value="">Tous les statuts</option>
        {SOCIAL_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <select value={drop} onChange={(e) => setParam("drop", e.target.value)} className={selectCls}>
        <option value="">Toutes les campagnes</option>
        {drops.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}
