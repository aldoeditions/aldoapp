import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/session";
import { getDropFinance } from "@/lib/data/finances";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DROP_STATUS, CHARGE_TYPE } from "@/lib/constants";
import { euros, euros0, nombre, pourcent, dateCourte } from "@/lib/format";
import { CostBar } from "@/components/finances/CostBar";

function StatementRow({
  label,
  value,
  kind = "cost",
  strong,
}: {
  label: string;
  value: number;
  kind?: "revenue" | "cost" | "result";
  strong?: boolean;
}) {
  const sign = kind === "cost" ? "−" : kind === "revenue" ? "+" : "=";
  const color =
    kind === "result"
      ? value >= 0
        ? "text-success"
        : "text-danger"
      : kind === "revenue"
        ? "text-text"
        : "text-muted";
  return (
    <div className={"flex items-center justify-between px-5 py-3 text-sm " + (strong ? "bg-bg" : "")}>
      <span className={strong ? "font-semibold text-text" : "text-muted"}>{label}</span>
      <span className={(strong ? "font-serif text-lg " : "") + color}>
        {sign} {euros(Math.abs(value))}
      </span>
    </div>
  );
}

export default async function DropFinancePage({ params }: { params: { id: string } }) {
  await requireModule("finances");
  const fin = await getDropFinance(params.id);
  if (!fin) notFound();
  const { pnl, charges, oeuvres } = fin;

  const ca = pnl.ca_brut ?? 0;
  const net = pnl.resultat_net ?? 0;
  const marge = ca > 0 ? net / ca : 0;

  return (
    <div className="space-y-6">
      <Link href="/finances" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Vue d&apos;ensemble
      </Link>

      {/* En-tête */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl tracking-tight text-text">{pnl.name}</h1>
          <StatusBadge value={pnl.status} dict={DROP_STATUS} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {dateCourte(pnl.start_date)} → {dateCourte(pnl.end_date)}
          {pnl.objectif_ca ? ` · Objectif ${euros0(pnl.objectif_ca)}` : ""}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CA brut" value={euros0(ca)} accent />
        <StatCard label="Résultat net" value={euros0(net)} />
        <StatCard label="Marge nette" value={pourcent(marge)} />
        <StatCard label="Ventes" value={nombre(pnl.nb_ventes)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compte de résultat */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Compte de résultat" />
            <CardBody className="p-0">
              <div className="divide-y divide-border">
                <StatementRow label="Chiffre d'affaires brut" value={ca} kind="revenue" />
                <StatementRow label="Commissions artistes (30 %)" value={pnl.total_commissions ?? 0} />
                <StatementRow label="Coût d'impression" value={pnl.total_impression ?? 0} />
                <StatementRow label="Coût de packaging" value={pnl.total_packaging ?? 0} />
                <StatementRow label="Charges (fixes & variables)" value={pnl.total_charges ?? 0} />
                <StatementRow label="Résultat net" value={net} kind="result" strong />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Décomposition" subtitle={`Marge nette ${pourcent(marge)}`} />
            <CardBody>
              <CostBar
                data={{
                  ca,
                  commissions: pnl.total_commissions ?? 0,
                  impression: pnl.total_impression ?? 0,
                  packaging: pnl.total_packaging ?? 0,
                  charges: pnl.total_charges ?? 0,
                  net,
                }}
              />
            </CardBody>
          </Card>

          {/* Contribution des œuvres */}
          <Card>
            <CardHeader title="Contribution des œuvres" subtitle={`${oeuvres.length} œuvre(s)`} />
            <CardBody className="p-0">
              {oeuvres.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-faint">Aucune œuvre.</p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                      <th className="px-5 py-2.5 font-semibold">Œuvre</th>
                      <th className="px-3 py-2.5 font-semibold">Format</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Ventes</th>
                      <th className="px-3 py-2.5 text-right font-semibold">CA</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Marge*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oeuvres.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 font-medium text-text">{o.name}</td>
                        <td className="px-3 py-2.5 text-muted">{o.format}</td>
                        <td className="px-3 py-2.5 text-right text-muted">{nombre(o.nb_ventes)}</td>
                        <td className="px-3 py-2.5 text-right text-text">{euros(o.ca_brut)}</td>
                        <td className={"px-5 py-2.5 text-right font-medium " + (o.marge >= 0 ? "text-success" : "text-danger")}>
                          {euros(o.marge)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
              <p className="px-5 py-2 text-2xs text-faint">* Marge hors charges du drop (commission + production).</p>
            </CardBody>
          </Card>
        </div>

        {/* Charges du drop */}
        <div>
          <Card>
            <CardHeader title="Charges du drop" subtitle={euros(pnl.total_charges ?? 0)} />
            <CardBody className="p-0">
              {charges.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-faint">Aucune charge rattachée.</p>
              ) : (
                <ul>
                  {charges.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm last:border-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text">{c.name}</p>
                        <div className="mt-0.5">
                          <StatusBadge value={c.type} dict={CHARGE_TYPE} />
                        </div>
                      </div>
                      <span className="font-medium text-text">{euros(c.montant)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
