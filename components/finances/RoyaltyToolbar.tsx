"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDrafts, emitAll } from "@/app/(app)/drops/[id]/releves/actions";

export function RoyaltyToolbar({ dropId }: { dropId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const gen = () =>
    start(async () => {
      setMsg(null);
      const r = await generateDrafts(dropId);
      setMsg(r.error ? `Erreur : ${r.error}` : `${r.created} créé(s), ${r.updated} mis à jour.`);
      router.refresh();
    });

  const emit = () =>
    start(async () => {
      if (!window.confirm("Émettre tous les brouillons ? Les montants seront figés et numérotés (irréversible).")) return;
      setMsg(null);
      const r = await emitAll(dropId);
      setMsg(r.error ? `Erreur : ${r.error}` : `${r.emitted} émis${r.skipped ? `, ${r.skipped} ignoré(s)` : ""}.`);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={gen}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-bg disabled:opacity-60"
      >
        {pending ? "…" : "Générer les brouillons"}
      </button>
      <button
        onClick={emit}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover disabled:opacity-60"
      >
        Émettre tout
      </button>
      {msg && <span className="text-2xs text-muted">{msg}</span>}
    </div>
  );
}
