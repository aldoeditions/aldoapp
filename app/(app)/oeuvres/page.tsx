import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getOeuvresCatalog, getOeuvreCounts } from "@/lib/data/oeuvres";
import { getArtistsForSelect, getDropsForSelect, getCostParams } from "@/lib/data/drops";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { OeuvresFilters } from "@/components/oeuvres/OeuvresFilters";
import { OeuvresTable } from "@/components/oeuvres/OeuvresTable";
import { OeuvreFormButton } from "@/components/drops/OeuvreFormButton";

export default async function OeuvresPage({
  searchParams,
}: {
  searchParams: { artist?: string; drop?: string; q?: string; sort?: string };
}) {
  const user = await requireModule("drops");
  const editable = canEdit(user.role, "drops");

  const [oeuvres, counts, artists, drops, costs] = await Promise.all([
    getOeuvresCatalog({ artist: searchParams.artist, drop: searchParams.drop, q: searchParams.q, sort: searchParams.sort }),
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

      <div className="flex items-center justify-between gap-3">
        <OeuvresFilters artists={artists} drops={drops} />
        <Link
          href={{ pathname: "/oeuvres", query: { ...searchParams, sort: searchParams.sort === "ventes" ? undefined : "ventes" } }}
          className={
            "shrink-0 rounded-md border px-3 py-1.5 text-2xs font-semibold transition-colors " +
            (searchParams.sort === "ventes"
              ? "border-accent bg-accentBg/60 text-accent"
              : "border-border bg-surface text-muted hover:bg-bg")
          }
        >
          Trier par ventes
        </Link>
      </div>

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
