"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEventStatus, deleteArtistEvent } from "@/app/(app)/social/actions";
import { EVENT_STATUSES } from "@/lib/constants";

export function EventAdminControls({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setEventStatus(id, e.target.value);
            router.refresh();
          })
        }
        className="rounded-md border border-border bg-surface px-2 py-1 text-2xs text-text outline-none focus:border-accent"
        title="Statut de l'événement"
      >
        {EVENT_STATUSES.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={() =>
          start(async () => {
            await deleteArtistEvent(id);
            router.refresh();
          })
        }
        disabled={pending}
        className="text-2xs text-faint hover:text-danger disabled:opacity-50"
        title="Supprimer"
      >
        Suppr.
      </button>
    </div>
  );
}
