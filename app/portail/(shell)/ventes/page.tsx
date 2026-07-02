import { requireArtist } from "@/lib/auth/session";
import { PortalPlaceholder } from "@/components/portail/PortalPlaceholder";

export default async function VentesPage() {
  await requireArtist();
  return (
    <PortalPlaceholder
      title="Mes ventes"
      description="Suivi de tes ventes par campagne et par format (A3 / A4), et de tes commissions."
    />
  );
}
