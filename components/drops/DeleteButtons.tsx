"use client";

import { useTransition } from "react";
import { deleteDrop, deleteOeuvre } from "@/app/(app)/drops/actions";

export function DeleteDropButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Supprimer le drop « ${name} » et détacher ses œuvres ? Action irréversible.`)) {
          start(() => deleteDrop(id));
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-dangerBg disabled:opacity-60"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      </svg>
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}

export function DeleteOeuvreButton({
  id,
  dropId,
  name,
}: {
  id: string;
  dropId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="Supprimer"
      aria-label={`Supprimer ${name}`}
      onClick={() => {
        if (confirm(`Supprimer l'œuvre « ${name} » ?`)) {
          start(() => deleteOeuvre(id, dropId));
        }
      }}
      className="text-faint transition-colors hover:text-danger disabled:opacity-60"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      </svg>
    </button>
  );
}
