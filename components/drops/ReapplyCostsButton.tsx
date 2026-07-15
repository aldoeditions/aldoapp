"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reapplyDropCosts } from "@/app/(app)/drops/actions";

export function ReapplyCostsButton({ dropId }: { dropId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Mettre à jour les coûts des œuvres avec les paramètres actuels"
      onClick={() => {
        if (
          confirm(
            "Réappliquer les coûts unitaires actuels (paramètres) aux œuvres de ce drop ? Le P&L sera recalculé.",
          )
        ) {
          start(async () => {
            await reapplyDropCosts(dropId);
            router.refresh();
          });
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-bg disabled:opacity-60"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
      </svg>
      {pending ? "Recalcul…" : "Réappliquer les coûts"}
    </button>
  );
}
