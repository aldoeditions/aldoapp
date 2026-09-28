import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { getUrssafYear } from "@/lib/data/urssaf";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { PAYMENT_STATUS } from "@/lib/constants";
import { eurosCents, nombre, dateCourte } from "@/lib/format";

const TRIMESTRES = ["1er trimestre", "2e trimestre", "3e trimestre", "4e trimestre"];

export default async function UrssafPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  await requireModule("finances");
  const year = Number(searchParams.year) || new Date().getFullYear();
  const data = await getUrssafYear(year);
  const aReverser = data.total.precompte_cents + data.total.contribution_cents;

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
          description="Précompte retenu aux artistes + contribution diffuseur (1,1 %) à reverser à l'Urssaf, par trimestre."
        />
        <div className="flex items-center gap-1.5">
          {data.availableYears.map((y) => (
            <Link
              key={y}
              href={`/finances/urssaf?year=${y}`}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium " +
                (y === year ? "bg-accent text-white" : "border border-border bg-surface text-text hover:bg-bg")
              }
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      {data.total.nb === 0 ? (
        <EmptyState
          title={`Aucun versement en ${year}`}
          description="Les versements enregistrés aux artistes alimenteront automatiquement cette déclaration."
        />
      ) : (
        <>
          {/* KPIs annuels */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Rémunération brute versée" value={eurosCents(data.total.gross_cents)} hint={`${nombre(data.total.nb)} versement(s)`} />
            <StatCard label="Précompte artistes" value={eurosCents(data.total.precompte_cents)} hint="retenu et reversé" />
            <StatCard label="Contribution diffuseur" value={eurosCents(data.total.contribution_cents)} hint="1,1 % — coût Aldo" />
            <StatCard label="Total à reverser Urssaf" value={eurosCents(aReverser)} accent hint="précompte + contribution" />
          </div>

          {/* Par trimestre */}
          <Card>
            <CardHeader title={`Par trimestre — ${year}`} subtitle="Base de la déclaration diffuseur" />
            <CardBody className="p-0">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Trimestre</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Versements</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Rému brute</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Précompte</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Contribution diffuseur</th>
                    <th className="px-5 py-2.5 text-right font-semibold">À reverser</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quarters.map((q) => (
                    <tr key={q.quarter} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 font-medium text-text">{TRIMESTRES[q.quarter - 1]}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{q.nb || "—"}</td>
                      <td className="px-3 py-2.5 text-right text-text">{q.nb ? eurosCents(q.gross_cents) : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-text">{q.nb ? eurosCents(q.precompte_cents) : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-text">{q.nb ? eurosCents(q.contribution_cents) : "—"}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-accent">
                        {q.nb ? eurosCents(q.precompte_cents + q.contribution_cents) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg text-sm font-semibold">
                    <td className="px-5 py-3 text-text">Total {year}</td>
                    <td className="px-3 py-3 text-right text-text">{nombre(data.total.nb)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(data.total.gross_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(data.total.precompte_cents)}</td>
                    <td className="px-3 py-3 text-right text-text">{eurosCents(data.total.contribution_cents)}</td>
                    <td className="px-5 py-3 text-right text-accent">{eurosCents(aReverser)}</td>
                  </tr>
                </tfoot>
              </table></div>
            </CardBody>
          </Card>

          {/* Détail des versements */}
          <Card>
            <CardHeader title="Détail des versements" subtitle={`${data.payments.length} ligne(s)`} />
            <CardBody className="p-0">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Artiste</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Brut</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Précompte</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Net</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Contribution</th>
                    <th className="px-5 py-2.5 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 text-muted">{dateCourte(p.paid_at)}</td>
                      <td className="px-3 py-2.5 font-medium text-text">
                        {p.artist_id ? (
                          <Link href={`/artistes/${p.artist_id}`} className="hover:text-accent">{p.artist_name}</Link>
                        ) : (
                          p.artist_name
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-text">{eurosCents(p.gross_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{p.precompte_cents ? eurosCents(p.precompte_cents) : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-text">{eurosCents(p.net_cents)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(p.contribution_diffuseur_cents)}</td>
                      <td className="px-5 py-2.5"><StatusBadge value={p.status} dict={PAYMENT_STATUS} /></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </CardBody>
          </Card>

          <p className="text-2xs text-faint">
            Base indicative pour la déclaration diffuseur sur urssaf.fr. Le précompte est reversé pour le compte
            de l&apos;artiste ; la contribution diffuseur (1,1 %) est à la charge d&apos;Aldo.
          </p>
        </>
      )}
    </div>
  );
}
