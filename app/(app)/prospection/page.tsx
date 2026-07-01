import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getPipeline, getSuiviArtists } from "@/lib/data/prospection";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { KanbanBoard } from "@/components/prospection/KanbanBoard";
import { SuiviTable } from "@/components/prospection/SuiviTable";
import { ArtistFormButton } from "@/components/artists/ArtistFormButton";

export default async function ProspectionPage() {
  const user = await requireModule("prospection");
  const editable = canEdit(user.role, "prospection");

  const [columns, suivi] = await Promise.all([
    getPipeline(),
    getSuiviArtists(),
  ]);

  const total = columns.reduce((s, c) => s + c.cards.length, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pipeline"
        title="Prospection"
        description="Pipeline d'acquisition des artistes et suivi de lancement."
        action={
          editable ? (
            <ArtistFormButton label="Nouveau prospect" />
          ) : undefined
        }
      />

      {/* Board pipeline */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-serif text-lg text-text">Pipeline</h2>
          <span className="rounded-full bg-border/70 px-2 py-0.5 text-2xs text-muted">
            {total}
          </span>
          {editable && (
            <span className="ml-auto text-2xs text-faint">
              Glisse une carte pour changer d&apos;étape
            </span>
          )}
        </div>
        <KanbanBoard columns={columns} editable={editable} />
      </section>

      {/* Suivi de lancement */}
      <section>
        <Card>
          <CardHeader
            title="Suivi de lancement"
            subtitle="Kit impression, visuels, infos et contrat des artistes confirmés."
          />
          <CardBody className="p-0">
            <SuiviTable artists={suivi} editable={editable} />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
