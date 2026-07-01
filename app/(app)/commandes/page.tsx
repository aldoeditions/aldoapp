import { requireModule } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function CommandesPage() {
  await requireModule("commandes");
  return (
    <ModulePlaceholder
      eyebrow="Produit"
      title="Commandes & Impressions"
      description="Commandes Shopify regroupées en vagues d'impression (2× par mois)."
      apercu={[
        "Liste des commandes (client, montant, statut, vague)",
        "Regroupement par vague d'impression",
        "Suivi expédition & tracking",
      ]}
    />
  );
}
