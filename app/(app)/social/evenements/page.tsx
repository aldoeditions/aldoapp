import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { getAllArtistEvents, type AdminEvent } from "@/lib/data/events";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { EVENT_TYPE } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import { EventAdminControls } from "@/components/social/EventAdminControls";

const MONTH_FMT = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const DAY_FMT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" });
const WD_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const MO_FMT = new Intl.DateTimeFormat("fr-FR", { month: "short" });

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function refDate(e: AdminEvent): string | null {
  return e.event_date ?? null;
}
function isUpcoming(e: AdminEvent, today: string): boolean {
  const ref = e.end_date ?? e.event_date;
  return !ref || ref >= today;
}

/** Vignette date (jour + mois abrégé + jour de semaine) façon agenda. */
function DatePill({ date }: { date: string | null }) {
  if (!date) {
    return (
      <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-dashed border-border bg-bg py-1.5 text-center">
        <span className="text-sm font-semibold text-faint">?</span>
        <span className="text-2xs text-faint">à préciser</span>
      </div>
    );
  }
  const d = new Date(`${date}T00:00:00`);
  return (
    <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border bg-bg py-1.5 text-center">
      <span className="text-2xs uppercase text-faint">{WD_FMT.format(d).replace(".", "")}</span>
      <span className="font-serif text-xl leading-none text-text">{DAY_FMT.format(d)}</span>
      <span className="text-2xs uppercase text-muted">{MO_FMT.format(d).replace(".", "")}</span>
    </div>
  );
}

function EventRow({ e }: { e: AdminEvent }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <DatePill date={e.event_date} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-text">{e.title}</span>
          {e.type && EVENT_TYPE[e.type] && <StatusBadge value={e.type} dict={EVENT_TYPE} />}
          {e.status === "retenu" && (
            <span className="rounded-full bg-successBg px-2 py-0.5 text-2xs font-semibold text-success">✓ Retenu</span>
          )}
        </div>
        <p className="mt-0.5 text-2xs text-faint">
          <span className="font-medium text-muted">{e.artist_name ?? "—"}</span>
          {e.end_date ? ` · jusqu'au ${dateCourte(e.end_date)}` : ""}
          {e.location ? ` · ${e.location}` : ""}
        </p>
        {e.note && <p className="mt-1 text-2xs text-muted">{e.note}</p>}
        {e.url && (
          <a href={e.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-2xs text-accent hover:underline">
            {e.url}
          </a>
        )}
      </div>
      <EventAdminControls id={e.id} status={e.status} />
    </div>
  );
}

export default async function SocialEventsPage() {
  await requireModule("social");
  const events = await getAllArtistEvents();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = events
    .filter((e) => isUpcoming(e, today))
    .sort((a, b) => (refDate(a) ?? "9999").localeCompare(refDate(b) ?? "9999"));
  const past = events
    .filter((e) => !isUpcoming(e, today))
    .sort((a, b) => (refDate(b) ?? "").localeCompare(refDate(a) ?? ""));
  const proposed = events.filter((e) => e.status === "proposé").length;

  // Regroupe les à-venir par mois (clé YYYY-MM ; sans date → "none" en dernier).
  const order: string[] = [];
  const groups = new Map<string, AdminEvent[]>();
  for (const e of upcoming) {
    const key = e.event_date ? e.event_date.slice(0, 7) : "none";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(e);
  }
  // "none" (sans date) à la fin.
  order.sort((a, b) => (a === "none" ? 1 : b === "none" ? -1 : a.localeCompare(b)));

  function monthLabel(key: string): string {
    if (key === "none") return "Sans date";
    return cap(MONTH_FMT.format(new Date(`${key}-01T00:00:00`)));
  }

  return (
    <div className="space-y-6">
      <Link href="/social" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Réseaux
      </Link>

      <PageHeader
        eyebrow="Agenda"
        title="Agenda des artistes"
        description="Les événements partagés par les artistes, par mois. Marque « Retenu » ceux à mettre dans le post Agenda du 1er du mois."
      />

      {events.length === 0 ? (
        <EmptyState
          title="Aucun événement pour l'instant"
          description="Les artistes peuvent partager leurs événements depuis leur espace — ils apparaîtront ici dans l'agenda."
        />
      ) : (
        <>
          {proposed > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/25 bg-warningBg/50 px-4 py-2.5 text-sm text-warning">
              <span className="font-semibold">{proposed}</span>
              <span className="text-muted">événement(s) proposé(s) à trier pour l&apos;Agenda.</span>
            </div>
          )}

          {upcoming.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface px-5 py-8 text-center text-sm text-faint shadow-card">
              Aucun événement à venir.
            </div>
          ) : (
            <div className="space-y-5">
              {order.map((key) => (
                <div key={key}>
                  <h3 className="mb-2 px-1 font-serif text-lg text-text">{monthLabel(key)}</h3>
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                    {groups.get(key)!.map((e) => (
                      <EventRow key={e.id} e={e} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details className="group rounded-xl border border-border bg-surface shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium text-text">
                <span>Événements passés ({past.length})</span>
                <svg className="text-faint transition-transform group-open:rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </summary>
              <div className="divide-y divide-border border-t border-border">
                {past.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
