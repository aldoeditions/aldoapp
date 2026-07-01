import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getArtists, getArtistPhaseCounts } from "@/lib/data/artists";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { ARTIST_PHASE } from "@/lib/constants";
import { euros0, nombre } from "@/lib/format";
import { ArtistsFilters } from "@/components/artists/ArtistsFilters";
import { ArtistFormButton } from "@/components/artists/ArtistFormButton";

export default async function ArtistesPage({
  searchParams,
}: {
  searchParams: { phase?: string; q?: string };
}) {
  const user = await requireModule("artistes");
  const editable = canEdit(user.role, "artistes");

  const [artists, counts] = await Promise.all([
    getArtists({ phase: searchParams.phase, q: searchParams.q }),
    getArtistPhaseCounts(),
  ]);
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Artistes"
        description="Annuaire des artistes — prospection, suivi de lancement et artistes actifs."
        action={editable ? <ArtistFormButton /> : undefined}
      />

      <ArtistsFilters counts={counts} total={total} />

      {artists.length === 0 ? (
        <EmptyState
          title={
            searchParams.q || searchParams.phase
              ? "Aucun artiste ne correspond"
              : "Aucun artiste pour l'instant"
          }
          description={
            searchParams.q || searchParams.phase
              ? "Ajuste les filtres ou la recherche."
              : "Ajoute ton premier artiste pour démarrer le pipeline."
          }
          action={editable ? <ArtistFormButton /> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a) => (
            <Link
              key={a.id ?? ""}
              href={`/artistes/${a.id}`}
              className="card group p-4 transition-shadow hover:shadow-float"
            >
              <div className="flex items-start gap-3">
                <Avatar name={a.name} src={a.avatar_url} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text group-hover:text-accent">
                    {a.name}
                  </p>
                  <p className="truncate text-2xs text-muted">
                    {[a.type, a.style].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <StatusBadge value={a.phase} dict={ARTIST_PHASE} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <p className="font-serif text-lg text-text">
                    {nombre(a.nb_oeuvres)}
                  </p>
                  <p className="text-2xs text-faint">Œuvres</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-text">
                    {nombre(a.total_ventes)}
                  </p>
                  <p className="text-2xs text-faint">Ventes</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-text">
                    {euros0(a.total_ca)}
                  </p>
                  <p className="text-2xs text-faint">CA</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
