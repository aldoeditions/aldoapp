"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateLaunchTasks } from "@/app/(app)/projet/actions";

export function GenerateTasksButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await generateLaunchTasks();
            setMsg(res.error ? res.error : res.created === 0 ? "À jour ✓" : `${res.created} tâche(s) créée(s)`);
            router.refresh();
          })
        }
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-bg disabled:opacity-60"
        title="Créer les tâches de lancement des campagnes en cours / à venir (non assignées)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18" /></svg>
        {pending ? "Génération…" : "Générer les tâches"}
      </button>
      {msg && <span className="text-2xs text-muted">{msg}</span>}
    </div>
  );
}
