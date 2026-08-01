"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { TASK_STATUSES } from "@/lib/constants";
import { updateTaskStatus } from "@/app/(app)/projet/actions";

/** Petit avatar à initiales pour un assigné (ou « non assigné »). */
export function AssigneeAvatar({
  initials,
  name,
  muted,
}: {
  initials?: string | null;
  name?: string | null;
  muted?: boolean;
}) {
  if (!initials && !name) {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-2xs text-faint"
        title="Non assigné"
      >
        —
      </span>
    );
  }
  const ini = (initials || name || "?").slice(0, 2).toUpperCase();
  return (
    <span
      title={name ?? undefined}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-2xs font-semibold",
        muted ? "bg-bg text-muted" : "bg-accentBg text-accent",
      )}
    >
      {ini}
    </span>
  );
}

/** Sélecteur de statut inline (change directement le statut de la tâche). */
export function StatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        start(async () => {
          await updateTaskStatus(id, v);
          router.refresh();
        });
      }}
      onClick={(e) => e.stopPropagation()}
      className="rounded-md border border-border bg-white px-2 py-1 text-2xs outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
