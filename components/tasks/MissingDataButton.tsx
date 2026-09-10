"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMissingDataTasks } from "@/app/(app)/projet/actions";

/** Génère les tâches « Compléter la fiche de X » pour les artistes actifs incomplets. */
export function MissingDataButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      {msg && <span className="text-2xs text-muted">{msg}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await createMissingDataTasks();
            setMsg(
              res.error
                ? res.error
                : res.created === 0
                  ? "Fiches à jour ✓"
                  : `${res.created} tâche(s) créée(s)`,
            );
            router.refresh();
          })
        }
        className="text-2xs font-medium text-accent hover:underline disabled:opacity-60"
        title="Créer une tâche « Compléter la fiche » pour chaque artiste actif sans bio ou photo"
      >
        {pending ? "…" : "Fiches à compléter"}
      </button>
    </span>
  );
}
