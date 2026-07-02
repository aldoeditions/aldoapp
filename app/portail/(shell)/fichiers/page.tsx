import { requireArtist } from "@/lib/auth/session";
import { PortalPlaceholder } from "@/components/portail/PortalPlaceholder";

export default async function FichiersPage() {
  await requireArtist();
  return (
    <PortalPlaceholder
      title="Mes fichiers"
      description="Dépose tes visuels HD pour impression et suis leur validation."
    />
  );
}
