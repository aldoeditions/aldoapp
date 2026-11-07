"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { emitStatement, deleteDraft, setNonResidentTreatment } from "@/app/(app)/drops/[id]/releves/actions";

export function RoyaltyRowActions({
  dropId,
  statementId,
  status,
  nonResident,
  treatment,
}: {
  dropId: string;
  statementId: string | null;
  status: string | null;
  nonResident: boolean;
  treatment: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [treat, setTreat] = useState(treatment ?? "");

  if (!statementId) return <span className="text-2xs text-faint">Générer d&apos;abord</span>;

  if (status !== "brouillon") {
    return (
      <a
        href={`/drops/${dropId}/releves/${statementId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-2xs font-medium text-accent hover:underline"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
        PDF
      </a>
    );
  }

  const emit = () =>
    start(async () => {
      setErr(null);
      const r = await emitStatement(statementId, dropId);
      if (r.error) setErr(r.error);
      else router.refresh();
    });

  const del = () =>
    start(async () => {
      if (!window.confirm("Supprimer ce brouillon ?")) return;
      await deleteDraft(statementId, dropId);
      router.refresh();
    });

  const saveTreat = () =>
    start(async () => {
      await setNonResidentTreatment(statementId, dropId, treat);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1.5">
      {nonResident && (
        <div className="flex items-center gap-1">
          <input
            value={treat}
            onChange={(e) => setTreat(e.target.value)}
            placeholder="Traitement non-résident…"
            className="w-40 rounded border border-border px-2 py-1 text-2xs outline-none focus:border-accent"
          />
          <button onClick={saveTreat} disabled={pending} className="text-2xs text-accent hover:underline disabled:opacity-50">OK</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button onClick={emit} disabled={pending} className="rounded-md bg-accent px-2.5 py-1 text-2xs font-semibold text-white hover:bg-accentHover disabled:opacity-50">
          Émettre
        </button>
        <button onClick={del} disabled={pending} className="text-2xs text-faint hover:text-danger disabled:opacity-50">
          Suppr.
        </button>
      </div>
      {err && <span className="max-w-[12rem] text-right text-2xs text-danger">{err}</span>}
    </div>
  );
}
