import { requireArtist } from "@/lib/auth/session";
import { PortalPlaceholder } from "@/components/portail/PortalPlaceholder";

export default async function ContratsPage() {
  await requireArtist();
  return (
    <PortalPlaceholder
      title="Mes contrats"
      description="Consulte tes contrats et leur statut."
    />
  );
}
