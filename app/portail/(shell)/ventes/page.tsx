import { requireArtist } from "@/lib/auth/session";
import {
  getMyArtist,
  getMySales,
  computeSalesKpis,
  getVentesParCampagne,
  getMyPayments,
} from "@/lib/data/portal";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { PAYMENT_STATUS } from "@/lib/constants";
import { euros, euros0, eurosCents, nombre, dateCourte } from "@/lib/format";
import { SalesChart } from "@/components/portail/SalesChart";
import { PortalHeader } from "@/components/portail/PortalHeader";
import { COMMISSION_PCT } from "@/lib/constants";

export default async function VentesPage() {
  await requireArtist();
  const artist = await getMyArtist();
  const pct = (artist?.commission_pct ?? COMMISSION_PCT * 100) / 100;

  const [sales, parCampagne, payments] = await Promise.all([
    getMySales(),
    getVentesParCampagne(),
    getMyPayments(),
  ]);
  const kpis = computeSalesKpis(sales, artist?.commission_pct ?? null);
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Ton activité"
        title="Mes ventes"
        description={`Tes ventes, ta commission (${Math.round(pct * 100)} %) et tes paiements.`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ventes du mois" value={nombre(kpis.ventesMois)} />
        <StatCard label="Commission du mois" value={euros0(kpis.commissionMois)} accent />
        <StatCard label="Ventes totales" value={nombre(kpis.ventesTotal)} hint="cumulées" />
        <StatCard label="Commission totale" value={euros0(kpis.commissionTotal)} hint="depuis le début" />
      </div>

      {/* Graphe par campagne */}
      <Card>
        <CardHeader title="Commission par campagne" subtitle="Ta commission estimée par drop." />
        <CardBody>
          <SalesChart
            data={parCampagne.map((c) => ({
              name: c.name,
              commission: Math.round(c.ca * pct * 100) / 100,
              ventes: c.ventes,
            }))}
          />
        </CardBody>
      </Card>

      {/* Historique des ventes */}
      <Card>
        <CardHeader title="Historique des ventes" subtitle={`${nombre(sales.length)} vente(s)`} />
        <CardBody className="p-0">
          {sales.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-faint">
              Aucune vente enregistrée pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Œuvre</th>
                    <th className="px-3 py-2.5 font-semibold">Format</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Qté</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Ma commission</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 text-muted">{dateCourte(s.sold_at)}</td>
                      <td className="px-3 py-2.5 font-medium text-text">{s.oeuvre_name ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted">{s.format ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{nombre(s.quantity)}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-accent">
                        {euros(s.total_price * pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Versements */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
          <div>
            <h3 className="font-serif text-base text-text">Mes versements</h3>
            <p className="text-2xs text-faint">Brut, précompte retenu et net versé.</p>
          </div>
          {payments.length > 0 && (
            <a
              href={`/portail/releve?year=${currentYear}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-bg"
            >
              Télécharger mon relevé {currentYear}
            </a>
          )}
        </div>
        <CardBody className="p-0">
          {payments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-faint">
              Aucun versement pour le moment. Tes commissions te seront versées par l&apos;équipe Aldo.
            </p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Brut</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Précompte</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Net versé</th>
                  <th className="px-5 py-2.5 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5 text-muted">{dateCourte(p.paid_at ?? p.created_at)}</td>
                    <td className="px-3 py-2.5 text-right text-text">{eurosCents(p.gross_cents)}</td>
                    <td className="px-3 py-2.5 text-right text-muted">
                      {p.precompte_cents ? `− ${eurosCents(p.precompte_cents)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-accent">{eurosCents(p.net_cents)}</td>
                    <td className="px-5 py-2.5"><StatusBadge value={p.status} dict={PAYMENT_STATUS} fallback="—" /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </CardBody>
      </Card>

      <p className="text-2xs text-faint">
        Le <span className="font-medium text-text">précompte</span> correspond à tes cotisations sociales
        d&apos;artiste-auteur, retenues par Aldo et reversées pour ton compte à l&apos;Urssaf. Le
        <span className="font-medium text-text"> net versé</span> est ce que tu reçois.
      </p>
    </div>
  );
}
