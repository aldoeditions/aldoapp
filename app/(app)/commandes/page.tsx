import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import {
  getOrders,
  getWaves,
  getWaveRecap,
  getDropsForSelect,
  getOeuvresForSelect,
  getWaveNames,
} from "@/lib/data/orders";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { ORDER_STATUS } from "@/lib/constants";
import { euros, nombre } from "@/lib/format";
import { CommandesToolbar } from "@/components/orders/CommandesToolbar";
import { OrderFormButton } from "@/components/orders/OrderFormButton";
import { WaveStatusButtons } from "@/components/orders/OrderActions";

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; status?: string; drop?: string };
}) {
  const user = await requireModule("commandes");
  const editable = canEdit(user.role, "commandes");
  const tab = searchParams.tab === "vagues" ? "vagues" : "commandes";

  const [drops, oeuvres, waveNames] = await Promise.all([
    getDropsForSelect(),
    getOeuvresForSelect(),
    getWaveNames(),
  ]);

  const newOrderBtn = editable ? (
    <OrderFormButton oeuvres={oeuvres} drops={drops} waveNames={waveNames} />
  ) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Produit"
        title="Commandes & Impressions"
        description="Commandes clients regroupées en vagues d'impression (2×/mois)."
        action={newOrderBtn}
      />

      <CommandesToolbar drops={drops} />

      {tab === "commandes" ? (
        <OrdersList
          filter={{ q: searchParams.q, status: searchParams.status, drop: searchParams.drop }}
          empty={newOrderBtn}
        />
      ) : (
        <WavesList editable={editable} />
      )}
    </div>
  );
}

async function OrdersList({
  filter,
  empty,
}: {
  filter: { q?: string; status?: string; drop?: string };
  empty: React.ReactNode;
}) {
  const orders = await getOrders(filter);

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Aucune commande"
        description="Crée ta première commande ou ajuste les filtres."
        action={empty}
      />
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                <th className="px-5 py-2.5 font-semibold">N°</th>
                <th className="px-3 py-2.5 font-semibold">Client</th>
                <th className="px-3 py-2.5 font-semibold">Drop</th>
                <th className="px-3 py-2.5 font-semibold">Vague</th>
                <th className="px-3 py-2.5 text-right font-semibold">Pièces</th>
                <th className="px-3 py-2.5 text-right font-semibold">Montant</th>
                <th className="px-5 py-2.5 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                  <td className="px-5 py-2.5">
                    <Link href={`/commandes/${o.id}`} className="font-medium text-text hover:text-accent">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{o.client_name}</td>
                  <td className="px-3 py-2.5 text-muted">{o.drop_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted">{o.wave ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right text-muted">{nombre(o.nb_pieces)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-text">{euros(o.total_amount)}</td>
                  <td className="px-5 py-2.5"><StatusBadge value={o.status} dict={ORDER_STATUS} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

async function WavesList({ editable }: { editable: boolean }) {
  const waves = await getWaves();
  if (waves.length === 0) {
    return (
      <EmptyState
        title="Aucune vague"
        description="Assigne une vague d'impression à tes commandes pour les regrouper ici."
      />
    );
  }

  const recaps = await Promise.all(waves.map((w) => getWaveRecap(w.wave)));

  return (
    <div className="space-y-4">
      {recaps.map((r) => {
        const totalPieces = r.items.reduce((s, i) => s + i.quantity, 0);
        return (
          <Card key={r.wave}>
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-serif text-lg text-text">Vague {r.wave}</h3>
                <p className="text-2xs text-faint">
                  {nombre(r.orders.length)} commande(s) · {nombre(totalPieces)} pièce(s) · {euros(r.total)}
                </p>
              </div>
              {editable && <WaveStatusButtons wave={r.wave} />}
            </div>
            <CardBody className="p-0">
              {r.items.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-faint">Aucun article.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                      <th className="px-5 py-2.5 font-semibold">Œuvre à imprimer</th>
                      <th className="px-3 py-2.5 font-semibold">Format</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((it) => (
                      <tr key={`${it.name}-${it.format}`} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 font-medium text-text">{it.name}</td>
                        <td className="px-3 py-2.5 text-muted">{it.format}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-text">{nombre(it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
