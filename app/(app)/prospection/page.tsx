import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getProspects, getPipeline, getProspectCount } from "@/lib/data/prospection";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KanbanBoard } from "@/components/prospection/KanbanBoard";
import { ProspectsTable } from "@/components/prospection/ProspectsTable";
import { ProspectionFilters } from "@/components/prospection/ProspectionFilters";
import { ArtistFormButton } from "@/components/artists/ArtistFormButton";

export default async function ProspectionPage({
  searchParams,
}: {
  searchParams: { view?: string; q?: string; pipe?: string; by?: string };
}) {
  const user = await requireModule("prospection");
  const editable = canEdit(user.role, "prospection");
  const isKanban = searchParams.view === "kanban";

  const filter = { q: searchParams.q, pipe: searchParams.pipe, by: searchParams.by };

  const [total, prospects, columns] = await Promise.all([
    getProspectCount(),
    isKanban ? Promise.resolve([]) : getProspects(filter),
    isKanban ? getPipeline(filter) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Prospection"
        description={`Base de prospection — ${total} artiste(s) à contacter ou en cours.`}
        action={editable ? <ArtistFormButton label="Nouveau prospect" /> : undefined}
      />

      <ProspectionFilters />

      {isKanban ? (
        <>
          {editable && (
            <p className="text-2xs text-faint">
              Glisse une carte pour changer d&apos;étape. Pour signer un artiste,
              utilise la vue Tableau.
            </p>
          )}
          <KanbanBoard columns={columns} editable={editable} />
        </>
      ) : (
        <Card>
          <CardBody className="p-0">
            <ProspectsTable prospects={prospects} editable={editable} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
