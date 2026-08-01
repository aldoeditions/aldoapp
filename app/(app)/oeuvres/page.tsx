import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getOeuvresCatalog, getOeuvreCounts } from "@/lib/data/oeuvres";
import { getArtistsForSelect, getDropsForSelect, getCostParams } from "@/lib/data/drops";
import { PageHeader } from "@/components/ui/PageHeader";
import { OeuvresFilters } from "@/components/oeuvres/OeuvresFilters";
import { OeuvresTable } from "@/components/oeuvres/OeuvresTable";
import { OeuvreFormButton } from "@/components/drops/OeuvreFormButton";

export default async function OeuvresPage({
  searchParams,
}: {
  searchParams: { artist?: string; drop?: string; q?: string };
}) {
  const user = await requireModule("drops");
  const editable = canEdit(user.role, "drops");

  const [oeuvres, counts, artists, drops, costs] = await Promise.all([
    getOeuvresCatalog({ artist: searchParams.artist, drop: searchParams.drop, q: searchParams.q }),
    getOeuvreCounts(),
    getArtistsForSelect(),
    getDropsForSelect(),
    getCostParams(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Œuvres"
        description={`${counts.total} œuvre(s) · ${counts.unassigned} à rattacher à un drop.`}
        action={
          editable ? (
            <OeuvreFormButton
              drops={drops}
              defaultDropId={null}
              artists={artists}
              costs={costs}
              label="Nouvelle œuvre"
            />
          ) : undefined
        }
      />

      <OeuvresFilters artists={artists} drops={drops} />

      <OeuvresTable
        oeuvres={oeuvres}
        artists={artists}
        drops={drops}
        costs={costs}
        editable={editable}
      />
    </div>
  );
}
