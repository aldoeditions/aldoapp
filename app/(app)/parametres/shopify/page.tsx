import { requireModule } from "@/lib/auth/session";
import { getShopifyOverview, getUnresolvedOrderItems, getOeuvresForAttach } from "@/lib/data/shopify";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { SyncControls } from "@/components/shopify/SyncControls";
import { UnresolvedList } from "@/components/shopify/UnresolvedList";
import { nombre, dateCourte } from "@/lib/format";

export default async function ShopifySyncPage() {
  await requireModule("parametres");
  const [overview, unresolved, oeuvres] = await Promise.all([
    getShopifyOverview(),
    getUnresolvedOrderItems(),
    getOeuvresForAttach(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Synchronisation Shopify"
        description="Commandes importées en temps réel via webhooks. Rattache ici les SKU non reconnus."
      />

      <SyncControls />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Commandes Shopify" value={nombre(overview.ordersCount)} />
        <StatCard label="SKU non résolus" value={nombre(overview.unresolvedCount)} accent={overview.unresolvedCount > 0} />
        <StatCard label="Webhooks reçus" value={nombre(overview.webhookCount)} hint={`${overview.processedCount} traités`} />
        <StatCard
          label="Dernier webhook"
          value={overview.lastWebhookAt ? dateCourte(overview.lastWebhookAt) : "—"}
          hint={overview.errorCount > 0 ? `${overview.errorCount} en erreur` : undefined}
        />
      </div>

      <Card>
        <CardHeader
          title="SKU non résolus"
          subtitle="Lignes de commande dont le SKU n'a pas trouvé d'œuvre. Rattache-les pour figer le lien."
          action={
            unresolved.length > 0 ? (
              <span className="rounded-full bg-warningBg px-2.5 py-0.5 text-2xs font-semibold text-warning">
                {nombre(unresolved.length)} à traiter
              </span>
            ) : undefined
          }
        />
        <CardBody className={unresolved.length > 0 ? "p-0" : undefined}>
          <UnresolvedList items={unresolved} oeuvres={oeuvres} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historique des synchronisations" subtitle="Imports manuels lancés depuis cette page." />
        <CardBody className={overview.syncLog.length > 0 ? "p-0" : undefined}>
          {overview.syncLog.length === 0 ? (
            <p className="py-4 text-center text-sm text-faint">Aucun import manuel pour l’instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Type</th>
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Importées</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Erreurs</th>
                    <th className="px-5 py-2.5 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.syncLog.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 text-text">{l.type ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted">{l.started_at ? dateCourte(l.started_at) : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-text">{nombre(l.orders_imported ?? 0)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{nombre(l.errors ?? 0)}</td>
                      <td className="px-5 py-2.5 text-muted">{l.status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
