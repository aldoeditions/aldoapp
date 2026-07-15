import { requireArtist } from "@/lib/auth/session";
import { getMyArtist, getMyOeuvres, getMyDrops } from "@/lib/data/portal";
import { OeuvreCard } from "@/components/portail/OeuvreCard";
import { DropFilter } from "@/components/portail/DropFilter";
import { PortalHeader } from "@/components/portail/PortalHeader";
import { COMMISSION_PCT } from "@/lib/constants";

export default async function OeuvresPage({
  searchParams,
}: {
  searchParams: { drop?: string };
}) {
  await requireArtist();
  const [artist, oeuvres, drops] = await Promise.all([
    getMyArtist(),
    getMyOeuvres(searchParams.drop),
    getMyDrops(),
  ]);
  const pct = (artist?.commission_pct ?? COMMISSION_PCT * 100) / 100;

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Ta vitrine"
        title="Mes œuvres"
        description="Toutes tes affiches éditées avec Aldo, et leurs performances."
      />

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
            <OeuvreCard key={o.id} oeuvre={o} commissionPct={pct} />
          ))}
        </div>
      )}
    </div>
  );
}
