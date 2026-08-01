"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { AssigneeAvatar } from "./bits";
import type { ProfileLite } from "@/lib/data/tasks";

export function TaskFilters({
  profiles,
  currentProfileId,
}: {
  profiles: ProfileLite[];
  currentProfileId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") === "kanban" ? "kanban" : "liste";
  const assignee = params.get("assignee") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const pill = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors",
      active ? "border-accent bg-accentBg text-accent" : "border-border bg-surface text-muted hover:text-text",
    );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setParam("assignee", "")} className={pill(assignee === "")}>Tous</button>
        {profiles.map((p) => (
          <button key={p.id} onClick={() => setParam("assignee", p.id)} className={pill(assignee === p.id)}>
            <AssigneeAvatar initials={p.avatar_initials} name={p.display_name} />
            <span>{p.display_name}{p.id === currentProfileId ? " (moi)" : ""}</span>
          </button>
        ))}
      </div>

      <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
        {(["liste", "kanban"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setParam("view", v === "liste" ? "" : v)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              view === v ? "bg-text text-white" : "text-muted hover:text-text",
            )}
          >
            {v === "liste" ? "Liste" : "Kanban"}
          </button>
        ))}
      </div>
    </div>
  );
}
