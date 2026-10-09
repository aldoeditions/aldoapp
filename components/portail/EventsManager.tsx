"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { saveEvent, deleteEvent, type ProfileState } from "@/app/portail/(shell)/actions";
import { EVENT_TYPES, EVENT_TYPE } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import type { ArtistEvent } from "@/types/database";

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";
const labelCls = "mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted";
const initial: ProfileState = { error: null };

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter l'événement"}
    </button>
  );
}

function EventForm({ event, onDone }: { event: ArtistEvent | null; onDone: () => void }) {
  const router = useRouter();
  const [state, action] = useFormState(saveEvent.bind(null, event?.id ?? null), initial);
  useEffect(() => {
    if (state.ok) {
      onDone();
      router.refresh();
    }
  }, [state.ok, onDone, router]);

  return (
    <form action={action} className="space-y-4 px-5 py-5">
      <div>
        <label className={labelCls} htmlFor="title">Titre *</label>
        <input id="title" name="title" defaultValue={event?.title ?? ""} className={inputCls} placeholder="ex. Exposition « Encres » à la galerie X" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={event?.type ?? ""} className={inputCls}>
            <option value="">—</option>
            {EVENT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="location">Lieu</label>
          <input id="location" name="location" defaultValue={event?.location ?? ""} className={inputCls} placeholder="Ville, galerie…" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="event_date">Date</label>
          <input id="event_date" name="event_date" type="date" defaultValue={event?.event_date ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="end_date">Date de fin (optionnel)</label>
          <input id="end_date" name="end_date" type="date" defaultValue={event?.end_date ?? ""} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="url">Lien (optionnel)</label>
        <input id="url" name="url" defaultValue={event?.url ?? ""} className={inputCls} placeholder="https://" />
      </div>
      <div>
        <label className={labelCls} htmlFor="note">Note (optionnel)</label>
        <textarea id="note" name="note" rows={2} defaultValue={event?.note ?? ""} className={inputCls} placeholder="Ce qu'il faut savoir…" />
      </div>
      {state.error && <p className="rounded-md bg-dangerBg px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Submit editing={Boolean(event)} />
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        start(async () => {
          await deleteEvent(id);
          router.refresh();
        })
      }
      disabled={pending}
      className="text-2xs text-faint hover:text-danger disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}

export function EventsManager({ events }: { events: ArtistEvent[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ArtistEvent | null>(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (e: ArtistEvent) => {
    setEditing(e);
    setOpen(true);
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h3 className="font-serif text-lg text-text">Mes événements</h3>
          <p className="text-2xs text-faint">{events.length} événement(s)</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accentHover"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Ajouter
        </button>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-faint">
          Aucun événement pour le moment. Partage tes expos, sorties ou salons : Aldo pourra les relayer dans son Agenda.
        </p>
      ) : (
        <ul>
          {events.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5 last:border-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-text">{e.title}</span>
                  {e.type && EVENT_TYPE[e.type] && (
                    <span className="rounded-full bg-accentBg px-2 py-0.5 text-2xs font-medium text-accent">
                      {EVENT_TYPE[e.type].label}
                    </span>
                  )}
                  {e.status === "retenu" && (
                    <span className="rounded-full bg-successBg px-2 py-0.5 text-2xs font-semibold text-success">
                      ✓ Relayé par Aldo
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-2xs text-faint">
                  {e.event_date ? dateCourte(e.event_date) : "Date à préciser"}
                  {e.end_date ? ` → ${dateCourte(e.end_date)}` : ""}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noreferrer" className="text-2xs text-accent hover:underline">
                      Voir le lien
                    </a>
                  )}
                  <button onClick={() => openEdit(e)} className="text-2xs text-muted hover:text-text">
                    Modifier
                  </button>
                  <DeleteButton id={e.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier l'événement" : "Nouvel événement"}
      >
        <EventForm key={editing?.id ?? "new"} event={editing} onDone={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
