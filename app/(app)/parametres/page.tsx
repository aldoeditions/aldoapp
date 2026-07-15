import { requireModule } from "@/lib/auth/session";
import { getParamsForEdit } from "@/lib/data/params";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormatCostCard } from "@/components/params/FormatCostCard";

export default async function ParametresPage() {
  await requireModule("parametres");
  const formats = await getParamsForEdit();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Coûts unitaires d'impression et de packaging par format. Modifiables à tout moment."
      />

      <div className="rounded-lg border border-accent/20 bg-accentBg/60 px-4 py-3 text-2xs text-muted">
        Ces coûts s&apos;appliquent automatiquement aux <span className="font-semibold text-text">nouvelles œuvres</span>.
        Les œuvres déjà créées gardent leur coût enregistré (P&amp;L historique préservé).
        Pour répercuter sur un drop en cours, utilise <span className="font-semibold text-text">« Réappliquer les coûts »</span> sur sa fiche.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {formats.map((f) => (
          <FormatCostCard key={f.format} init={f} />
        ))}
      </div>
    </div>
  );
}
