"use client";

import { useTransition } from "react";
import { deleteOrder, updateOrderStatus, markWaveStatus } from "@/app/(app)/commandes/actions";
import { ORDER_STATUSES } from "@/lib/constants";

export function DeleteOrderButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Supprimer la commande ${label} ?`)) start(() => deleteOrder(id));
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-dangerBg disabled:opacity-60"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}

/** Menu de changement de statut d'une commande. */
export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => start(() => updateOrderStatus(id, e.target.value))}
      className="rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}

/** Boutons de bascule de statut pour toute une vague. */
export function WaveStatusButtons({ wave }: { wave: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => markWaveStatus(wave, "imprimé"))}
        className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-2xs font-medium text-text transition-colors hover:bg-bg disabled:opacity-60"
      >
        Tout imprimé
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => markWaveStatus(wave, "expédié"))}
        className="rounded-md bg-accent px-2.5 py-1.5 text-2xs font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
      >
        Tout expédié
      </button>
    </div>
  );
}
