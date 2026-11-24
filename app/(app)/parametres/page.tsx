import { requireModule } from "@/lib/auth/session";
import { getParamsForEdit, getGoogleDriveStatus } from "@/lib/data/params";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormatCostCard } from "@/components/params/FormatCostCard";
import { GoogleDriveCard } from "@/components/params/GoogleDriveCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: { drive_connected?: string; drive_error?: string };
}) {
  await requireModule("parametres");
  const [formats, driveStatus] = await Promise.all([getParamsForEdit(), getGoogleDriveStatus()]);

  const driveNotice = searchParams.drive_error
    ? { kind: "error" as const, message: searchParams.drive_error }
    : searchParams.drive_connected
      ? { kind: "ok" as const, message: "Google Drive connecté." }
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Coûts unitaires d'impression et de packaging par format. Modifiables à tout moment."
      />

      <Card>
        <CardHeader title="Google Drive" subtitle="Classement automatique des contrats signés dans ALDO/Artistes." />
        <CardBody>
          <GoogleDriveCard status={driveStatus} notice={driveNotice} />
        </CardBody>
      </Card>

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
