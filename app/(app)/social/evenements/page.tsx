import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { getAllArtistEvents, type AdminEvent } from "@/lib/data/events";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EVENT_TYPE } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import { EventAdminControls } from "@/components/social/EventAdminControls";

function isUpcoming(e: AdminEvent, today: string): boolean {
  const ref = e.end_date ?? e.event_date;
  return !ref || ref >= today;
}

function EventList({ events }: { events: AdminEvent[] }) {
  return (
    <div className="divide-y divide-border">
      {events.map((e) => (
        <div key={e.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-text">{e.title}</span>
              {e.type && EVENT_TYPE[e.type] && (
                <StatusBadge value={e.type} dict={EVENT_TYPE} />
              )}
            </div>
            <p className="mt-0.5 text-2xs text-faint">
              <Link href={`/artistes`} className="font-medium text-muted hover:text-text">{e.artist_name ?? "—"}</Link>
              {" · "}
              {e.event_date ? dateCourte(e.event_date) : "date à préciser"}
              {e.end_date ? ` → ${dateCourte(e.end_date)}` : ""}
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
      ))}
    </div>
  );
}

export default async function SocialEventsPage() {
  await requireModule("social");
  const events = await getAllArtistEvents();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = events.filter((e) => isUpcoming(e, today));
  const past = events.filter((e) => !isUpcoming(e, today));
  const proposed = events.filter((e) => e.status === "proposé").length;

  return (
    <div className="space-y-6">
      <Link href="/social" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Réseaux
      </Link>

      <PageHeader
        eyebrow="Agenda"
        title="Événements des artistes"
        description="Les événements partagés par les artistes (expos, sorties, salons…). Marque « Retenu » ceux à mettre dans le post Agenda du 1er du mois."
      />

      {events.length === 0 ? (
        <EmptyState
          title="Aucun événement pour l'instant"
          description="Les artistes peuvent partager leurs événements depuis leur espace — ils apparaîtront ici."
        />
      ) : (
        <>
          <Card>
            <CardHeader
              title="À venir"
              subtitle={`${upcoming.length} événement(s)`}
              action={
                proposed > 0 ? (
                  <span className="rounded-full bg-warningBg px-2.5 py-0.5 text-2xs font-semibold text-warning">
                    {proposed} à trier
                  </span>
                ) : undefined
              }
            />
            <CardBody className="p-0">
              {upcoming.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-faint">Aucun événement à venir.</p>
              ) : (
                <EventList events={upcoming} />
              )}
            </CardBody>
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader title="Passés" subtitle={`${past.length} événement(s)`} />
              <CardBody className="p-0">
                <EventList events={past} />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
