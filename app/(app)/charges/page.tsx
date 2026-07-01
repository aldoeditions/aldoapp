import { requireModule } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function ChargesPage() {
  await requireModule("charges");
  return (
    <ModulePlaceholder
      eyebrow="Business"
      title="Charges"
      description="Frais fixes et variables par drop (Shopify, Webflow, Ads, etc.)."
      apercu={[
        "Charges par drop, classées par catégorie",
        "Distinction fixe / variable",
        "Impact direct sur le P&L du drop",
      ]}
    />
  );
}
