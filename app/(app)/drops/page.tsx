import { requireModule } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function DropsPage() {
  await requireModule("drops");
  return (
    <ModulePlaceholder
      eyebrow="Produit"
      title="Drops & Œuvres"
      description="Campagnes mensuelles et les œuvres associées, par format (A3 40 € · A4 25 €)."
      apercu={[
        "Liste des drops avec objectif de CA et statut",
        "Œuvres par drop : visuel, format, prix, état du fichier",
        "Coûts impression & packaging par œuvre",
      ]}
    />
  );
}
