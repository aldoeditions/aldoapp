import { requireModule } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function ProspectionPage() {
  await requireModule("prospection");
  return (
    <ModulePlaceholder
      eyebrow="Pipeline"
      title="Prospection"
      description="Suivi des artistes prospectés, de la prise de contact à la confirmation."
      apercu={[
        "Pipeline Kanban : prospect → contacté → intéressé → confirmé",
        "Fiche prospect (Instagram, portfolio, renommée, style)",
        "Suivi de lancement : kit impression, visuels, contrat",
      ]}
    />
  );
}
