import { requireArtist } from "@/lib/auth/session";
import { getMyEvents } from "@/lib/data/events";
import { PortalHeader } from "@/components/portail/PortalHeader";
import { EventsManager } from "@/components/portail/EventsManager";

export default async function EvenementsPage() {
  await requireArtist();
  const events = await getMyEvents();

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Ta visibilité"
        title="Mes événements"
        description="Expos, sorties, salons, ateliers… Partage ce à quoi tu participes : Aldo relaie les événements de ses artistes dans son Agenda (le 1er de chaque mois)."
      />
      <EventsManager events={events} />
    </div>
  );
}
