import { requireModule } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function FinancesPage() {
  await requireModule("finances");
  return (
    <ModulePlaceholder
      eyebrow="Business"
      title="Finances"
      description="P&L par drop : CA, commissions, coûts impression/packaging, charges et résultat net."
      apercu={[
        "P&L détaillé par drop (vue drop_pnl)",
        "Répartition des coûts et marges",
        "Commissions artistes cumulées",
      ]}
    />
  );
}
