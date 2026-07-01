import { requireModule } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function ArtistesPage() {
  await requireModule("artistes");
  return (
    <ModulePlaceholder
      eyebrow="Pipeline"
      title="Artistes"
      description="Artistes signés : historique de ventes, commissions, paiements, fichiers et contrats."
      apercu={[
        "Annuaire des artistes actifs avec statistiques",
        "Historique ventes & rémunération (30 %)",
        "Contrats, paiements et fichiers validés",
      ]}
    />
  );
}
