import { requireArtist } from "@/lib/auth/session";
import { getMyOeuvres, getMyDrops } from "@/lib/data/portal";
import { OeuvreCard } from "@/components/portail/OeuvreCard";
import { DropFilter } from "@/components/portail/DropFilter";

export default async function OeuvresPage({
  searchParams,
}: {
  searchParams: { drop?: string };
}) {
  await requireArtist();
  const [oeuvres, drops] = await Promise.all([
    getMyOeuvres(searchParams.drop),
    getMyDrops(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1.5">Ta vitrine</p>
        <h1 className="font-serif text-2xl tracking-tight text-text sm:text-3xl">
          Mes œuvres
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Toutes tes affiches éditées avec Aldo, et leurs performances.
        </p>
      </div>

      <DropFilter drops={drops} />

      {oeuvres.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
          <p className="font-serif text-lg text-text">Aucune œuvre pour l&apos;instant</p>
          <p className="mt-1.5 text-sm text-muted">
            Tes œuvres apparaîtront ici dès qu&apos;Aldo les aura ajoutées à une campagne.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {oeuvres.map((o) => (
            <OeuvreCard key={o.id} oeuvre={o} />
          ))}
        </div>
      )}
    </div>
  );
}
