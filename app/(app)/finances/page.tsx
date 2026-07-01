import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { getAllPnl, computeGlobal } from "@/lib/data/finances";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { DROP_STATUS } from "@/lib/constants";
import { euros0, nombre, pourcent, dateCourte } from "@/lib/format";
import { CostBar } from "@/components/finances/CostBar";

export default async function FinancesPage() {
  await requireModule("finances");
  const rows = await getAllPnl();
  const g = computeGlobal(rows);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business"
        title="Finances"
        description="Compte de résultat par drop : CA, commissions, coûts de production, charges et marge nette."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Aucune donnée financière"
          description="Crée un drop et enregistre des ventes pour voir apparaître le P&L."
        />
      ) : (
        <>
          {/* KPIs globaux */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="CA brut cumulé" value={euros0(g.ca_brut)} accent />
            <StatCard
              label="Résultat net"
              value={euros0(g.resultat_net)}
              hint={g.resultat_net < 0 ? "Déficitaire" : undefined}
            />
            <StatCard label="Marge nette" value={pourcent(g.marge)} />
            <StatCard
              label="Ventes"
              value={nombre(g.nb_ventes)}
              hint={`${nombre(rows.length)} drop(s)`}
            />
          </div>

          {/* Décomposition globale */}
          <Card>
            <CardHeader
              title="Décomposition globale"
              subtitle={`Du CA (${euros0(g.ca_brut)}) au résultat net (${euros0(g.resultat_net)})`}
            />
            <CardBody>
              <CostBar
                data={{
                  ca: g.ca_brut,
                  commissions: g.total_commissions,
                  impression: g.total_impression,
                  packaging: g.total_packaging,
                  charges: g.total_charges,
                  net: g.resultat_net,
                }}
              />
            </CardBody>
          </Card>

          {/* P&L par drop */}
          <div>
            <h2 className="mb-3 font-serif text-lg text-text">P&amp;L par drop</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {rows.map((r) => {
                const ca = r.ca_brut ?? 0;
                const net = r.resultat_net ?? 0;
                const marge = ca > 0 ? net / ca : 0;
                return (
                  <Link
                    key={r.id ?? ""}
                    href={`/finances/${r.id}`}
                    className="card group p-5 transition-shadow hover:shadow-float"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-lg text-text group-hover:text-accent">{r.name}</p>
                        <p className="text-2xs text-faint">
                          {dateCourte(r.start_date)} → {dateCourte(r.end_date)}
                        </p>
                      </div>
                      <StatusBadge value={r.status} dict={DROP_STATUS} />
                    </div>

                    <div className="mb-4 mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="font-serif text-lg text-text">{euros0(ca)}</p>
                        <p className="text-2xs text-faint">CA brut</p>
                      </div>
                      <div>
                        <p className={"font-serif text-lg " + (net >= 0 ? "text-success" : "text-danger")}>
                          {euros0(net)}
                        </p>
                        <p className="text-2xs text-faint">Résultat net</p>
                      </div>
                      <div>
                        <p className="font-serif text-lg text-text">{pourcent(marge)}</p>
                        <p className="text-2xs text-faint">Marge</p>
                      </div>
                    </div>

                    <CostBar
                      showLegend={false}
                      data={{
                        ca,
                        commissions: r.total_commissions ?? 0,
                        impression: r.total_impression ?? 0,
                        packaging: r.total_packaging ?? 0,
                        charges: r.total_charges ?? 0,
                        net,
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
