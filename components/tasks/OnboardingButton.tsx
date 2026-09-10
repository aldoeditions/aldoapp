"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOnboardingTasks } from "@/app/(app)/projet/actions";

export function OnboardingButton({ artistId }: { artistId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-2xs text-muted">{msg}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await createOnboardingTasks(artistId);
            setMsg(
              res.error
                ? res.error
                : res.created === 0
                  ? "Déjà en place ✓"
                  : `${res.created} tâche(s) créée(s)`,
            );
            router.refresh();
          })
        }
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-2xs font-semibold text-text transition-colors hover:bg-bg disabled:opacity-60"
        title="Créer la checklist d'accueil (contrat, bio/photo, visuels, signature…)"
      >
        {pending ? "…" : "Checklist d'accueil"}
      </button>
    </div>
  );
}
