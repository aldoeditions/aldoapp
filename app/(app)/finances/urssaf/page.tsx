import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { getUrssaf, type Granularity } from "@/lib/data/urssaf";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { eurosCents, nombre, dateCourte } from "@/lib/format";

export default async function UrssafPage({
  searchParams,
}: {
  searchParams: { year?: string; g?: string };
}) {
  await requireModule("finances");
  const year = Number(searchParams.year) || new Date().getFullYear();
  const granularity: Granularity = searchParams.g === "mois" ? "mois" : "trimestre";
  const data = await getUrssaf(year, granularity);
  const t = data.total;
  const aReverser = t.precompte_cents + t.diffuseur_cents;

  const qs = (y: number, g: Granularity) => `/finances/urssaf?year=${y}&g=${g}`;

  return (
    <div className="space-y-6">
      <Link href="/finances" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Finances
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Diffuseur"
          title="Déclaration Urssaf"
          description="Précompte + contribution diffuseur à reverser, calculés à partir des relevés de droits émis."
        />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
            {(["trimestre", "mois"] as Granularity[]).map((g) => (
              <Link
                key={g}
                href={qs(year, g)}
                className={"rounded px-3 py-1.5 text-2xs font-semibold capitalize " + (granularity === g ? "bg-text text-white" : "text-muted hover:text-text")}
              >
                {g}
              </Link>
            ))}
          </div>
          <a
            href={`/finances/urssaf/export?year=${year}&g=${granularity}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:bg-bg"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {data.availableYears.map((y) => (
          <Link
            key={y}
            href={qs(y, granularity)}
            className={"rounded-md px-3 py-1.5 text-sm font-medium " + (y === year ? "bg-accent text-white" : "border border-border bg-surface text-text hover:bg-bg")}
          >
            {y}
          </Link>
        ))}
      </div>

      {data.lines.length === 0 ? (
        <EmptyState
          title={`Aucun relevé émis en ${year}`}
          description="Émets des relevés de droits depuis une campagne pour alimenter cette déclaration."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Brut droits versés" value={eurosCents(t.brut_cents)} hint={`${nombre(t.nb)} relevé(s)`} />
            <StatCard label="Précompte (part artistes)" value={eurosCents(t.precompte_cents)} hint="retenu et reversé" />
            <StatCard label="Contribution diffuseur" value={eurosCents(t.diffuseur_cents)} hint="1,1 % — coût Aldo" />
            <StatCard label="Total à reverser Urssaf" value={eurosCents(aReverser)} accent hint="précompte + contribution" />
          </div>

          <Card>
            <CardHeader title={`Par ${granularity} — ${year}`} subtitle="Détail des cotisations à déclarer" />
            <CardBody className="p-0">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Période</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Brut</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Vieillesse</th>
                    <th className="px-3 py-2.5 text-right font-semibold">CSG</th>
                    <th className="px-3 py-2.5 text-right font-semibold">CRDS</th>
                    <th className="px-3 py-2.5 text-right font-semibold">CFP</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Précompte</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Diffuseur</th>
                    <th className="px-5 py-2.5 text-right font-semibold">À reverser</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buckets.map((b) => (
                    <tr key={b.key} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 font-medium text-text">{b.label}</td>
                      <td className="px-3 py-2.5 text-right text-text">{eurosCents(b.brut_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(b.vieillesse_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(b.csg_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(b.crds_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(b.cfp_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-text">{eurosCents(b.precompte_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(b.diffuseur_cents)}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-accent">{eurosCents(b.precompte_cents + b.diffuseur_cents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg text-sm font-semibold">
                    <td className="px-5 py-3 text-text">Total {year}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.brut_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.vieillesse_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.csg_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.crds_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.cfp_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.precompte_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(t.diffuseur_cents)}</td>
                    <td className="px-5 py-3 text-right text-accent">{eurosCents(aReverser)}</td>
                  </tr>
                </tfoot>
              </table></div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Détail par relevé" subtitle={`${data.lines.length} relevé(s)`} />
            <CardBody className="p-0">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Relevé</th>
                    <th className="px-3 py-2.5 font-semibold">Artiste</th>
                    <th className="px-3 py-2.5 font-semibold">Émis le</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Brut</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Précompte</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Diffuseur</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 font-mono text-2xs text-muted">{l.number ?? "—"}</td>
                      <td className="px-3 py-2.5 font-medium text-text">
                        {l.artist_id ? <Link href={`/artistes/${l.artist_id}`} className="hover:text-accent">{l.artist_name}</Link> : l.artist_name}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{dateCourte(l.date)}</td>
                      <td className="px-3 py-2.5 text-right text-text">{eurosCents(l.brut_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(l.precompte_cents)}</td>
                      <td className="px-5 py-2.5 text-right text-muted">{eurosCents(l.diffuseur_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </CardBody>
          </Card>

          <p className="text-2xs text-faint">
            Base indicative pour la déclaration diffuseur sur artistes-auteurs.urssaf.fr. Le précompte est reversé
            pour le compte des artistes ; la contribution diffuseur (1,1 %) est à la charge d&apos;Aldo.
          </p>
        </>
      )}
    </div>
  );
}
