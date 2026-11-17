import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import {
  getOrders,
  getDropsForSelect,
  getOeuvresForSelect,
} from "@/lib/data/orders";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { ORDER_STATUS } from "@/lib/constants";
import { euros, nombre } from "@/lib/format";
import { CommandesToolbar } from "@/components/orders/CommandesToolbar";
import { OrderFormButton } from "@/components/orders/OrderFormButton";

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; drop?: string };
}) {
  const user = await requireModule("commandes");
  const editable = canEdit(user.role, "commandes");

  const [drops, oeuvres] = await Promise.all([
    getDropsForSelect(),
    getOeuvresForSelect(),
  ]);

  const newOrderBtn = editable ? (
    <OrderFormButton oeuvres={oeuvres} drops={drops} />
  ) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Produit"
        title="Commandes"
        description="Commandes clients, synchronisées depuis Shopify."
        action={newOrderBtn}
      />

      <CommandesToolbar drops={drops} />

      <OrdersList
        filter={{ q: searchParams.q, status: searchParams.status, drop: searchParams.drop }}
        empty={newOrderBtn}
      />
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
