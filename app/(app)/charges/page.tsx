import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getCharges, chargesTotals } from "@/lib/data/charges";
import { getDropsForSelect } from "@/lib/data/orders";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { CHARGE_TYPE, CHARGE_CATEGORY } from "@/lib/constants";
import { euros } from "@/lib/format";
import { ChargesFilters } from "@/components/charges/ChargesFilters";
import { ChargeFormButton } from "@/components/charges/ChargeFormButton";
import { DeleteChargeButton } from "@/components/charges/DeleteChargeButton";

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; categorie?: string; drop?: string };
}) {
  const user = await requireModule("charges");
  const editable = canEdit(user.role, "charges");

  const [charges, drops] = await Promise.all([
    getCharges({
      q: searchParams.q,
      type: searchParams.type,
      categorie: searchParams.categorie,
      drop: searchParams.drop,
    }),
    getDropsForSelect(),
  ]);
  const totals = chargesTotals(charges);

  const newBtn = editable ? <ChargeFormButton drops={drops} /> : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business"
        title="Charges"
        description="Frais fixes et variables, rattachés à un drop ou généraux. Impactent directement le P&L."
        action={newBtn}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total charges" value={euros(totals.total)} accent />
        <StatCard label="Fixes" value={euros(totals.fixe)} />
        <StatCard label="Variables" value={euros(totals.variable)} />
      </div>

      <ChargesFilters drops={drops} />

      {charges.length === 0 ? (
        <EmptyState
          title="Aucune charge"
          description="Ajoute tes frais (Shopify, Webflow, Ads…) pour affiner le résultat net des drops."
          action={newBtn}
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Libellé</th>
                    <th className="px-3 py-2.5 font-semibold">Type</th>
                    <th className="px-3 py-2.5 font-semibold">Catégorie</th>
                    <th className="px-3 py-2.5 font-semibold">Drop</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Montant</th>
                    {editable && <th className="px-5 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 font-medium text-text">{c.name}</td>
                      <td className="px-3 py-2.5"><StatusBadge value={c.type} dict={CHARGE_TYPE} /></td>
                      <td className="px-3 py-2.5"><StatusBadge value={c.categorie} dict={CHARGE_CATEGORY} /></td>
                      <td className="px-3 py-2.5 text-muted">{c.drop_name ?? "Général"}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-text">{euros(c.montant)}</td>
                      {editable && (
                        <td className="px-5 py-2.5">
                          <div className="flex items-center justify-end gap-3">
                            <ChargeFormButton drops={drops} charge={c} variant="row" />
                            <DeleteChargeButton id={c.id} name={c.name} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
