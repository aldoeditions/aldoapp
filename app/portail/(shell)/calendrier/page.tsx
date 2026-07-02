import { requireArtist } from "@/lib/auth/session";
import { PortalPlaceholder } from "@/components/portail/PortalPlaceholder";

export default async function CalendrierPage() {
  await requireArtist();
  return (
    <PortalPlaceholder
      title="Calendrier"
      description="Dates de début, de fin et d'impression de tes campagnes."
    />
  );
}
