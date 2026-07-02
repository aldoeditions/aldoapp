import { requireArtist } from "@/lib/auth/session";
import { PortalPlaceholder } from "@/components/portail/PortalPlaceholder";

export default async function ProfilPage() {
  await requireArtist();
  return (
    <PortalPlaceholder
      title="Mon profil"
      description="Bio, photo, liens et coordonnées bancaires (RIB)."
    />
  );
}
