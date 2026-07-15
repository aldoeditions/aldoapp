import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import {
  getOrderDetail,
  getDropsForSelect,
  getOeuvresForSelect,
  getWaveNames,
} from "@/lib/data/orders";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ORDER_STATUS } from "@/lib/constants";
import { euros, nombre, dateCourte } from "@/lib/format";
import { OrderFormButton } from "@/components/orders/OrderFormButton";
import {
  DeleteOrderButton,
  OrderStatusSelect,
} from "@/components/orders/OrderActions";

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-2xs font-semibold uppercase tracking-wide text-faint">{label}</span>
      <span className="truncate text-text">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireModule("commandes");
  const editable = canEdit(user.role, "commandes");

  const detail = await getOrderDetail(params.id);
  if (!detail) notFound();
  const { order, items } = detail;

  let drops: { id: string; name: string }[] = [];
  let oeuvres: Awaited<ReturnType<typeof getOeuvresForSelect>> = [];
  let waveNames: string[] = [];
  if (editable) {
    [drops, oeuvres, waveNames] = await Promise.all([
      getDropsForSelect(),
      getOeuvresForSelect(),
      getWaveNames(),
    ]);
  }

  const totalPieces = items.reduce((s, i) => s + (i.quantity ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/commandes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Toutes les commandes
      </Link>

      {/* En-tête */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl tracking-tight text-text">{order.order_number}</h1>
              <StatusBadge value={order.status} dict={ORDER_STATUS} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {order.client_name}
              {order.drop_name ? ` · ${order.drop_name}` : ""}
              {order.wave ? ` · Vague ${order.wave}` : ""}
            </p>
            {order.shipped_at && (
              <p className="mt-1 text-2xs text-faint">Expédié le {dateCourte(order.shipped_at)}</p>
            )}
          </div>
          {editable && (
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusSelect id={order.id} status={order.status} />
              <OrderFormButton
                oeuvres={oeuvres}
                drops={drops}
                waveNames={waveNames}
                order={order}
                items={items.map((i) => ({ oeuvre_id: i.oeuvre_id, quantity: i.quantity, unit_price: i.unit_price }))}
                variant="secondary"
                label="Modifier"
              />
              <DeleteOrderButton id={order.id} label={order.order_number} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Articles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Articles" subtitle={`${nombre(totalPieces)} pièce(s)`} />
            <CardBody className="p-0">
              {items.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-faint">Aucun article.</p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                      <th className="px-5 py-2.5 font-semibold">Œuvre</th>
                      <th className="px-3 py-2.5 font-semibold">Format</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Qté</th>
                      <th className="px-3 py-2.5 text-right font-semibold">PU</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 font-medium text-text">{it.oeuvre_name ?? "—"}</td>
                        <td className="px-3 py-2.5 text-muted">{it.oeuvre_format ?? "—"}</td>
                        <td className="px-3 py-2.5 text-right text-muted">{nombre(it.quantity)}</td>
                        <td className="px-3 py-2.5 text-right text-muted">{euros(it.unit_price)}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-text">{euros(it.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="px-5 py-3 text-right text-sm text-muted">Total commande</td>
                      <td className="px-5 py-3 text-right font-serif text-lg text-text">{euros(order.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table></div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Client */}
        <div>
          <Card>
            <CardHeader title="Client & livraison" />
            <CardBody className="py-2">
              <div className="divide-y divide-border">
                <Info label="Nom" value={order.client_name} />
                <Info label="Email" value={order.client_email} />
                <Info label="Adresse" value={order.client_address} />
                <Info label="Vague" value={order.wave} />
                <Info label="Tracking" value={order.tracking_number} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
