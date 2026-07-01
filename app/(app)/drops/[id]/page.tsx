import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import {
  getDropDetail,
  getArtistsForSelect,
  getCostParams,
  type CostByFormat,
} from "@/lib/data/drops";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { DROP_STATUS, OEUVRE_STATUS, FILE_STATUS, COMMISSION_PCT } from "@/lib/constants";
import { euros, euros0, nombre, dateCourte } from "@/lib/format";
import { DropFormButton } from "@/components/drops/DropFormButton";
import { OeuvreFormButton } from "@/components/drops/OeuvreFormButton";
import { DeleteDropButton, DeleteOeuvreButton } from "@/components/drops/DeleteButtons";

export default async function DropDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireModule("drops");
  const editable = canEdit(user.role, "drops");

  const detail = await getDropDetail(params.id);
  if (!detail) notFound();
  const { drop, pnl, oeuvres } = detail;

  // Données nécessaires au formulaire d'œuvre (seulement si édition permise).
  let artists: { id: string; name: string }[] = [];
  let costs: CostByFormat = {
    A3: { prix: 40, impression: 0, packaging: 0 },
    A4: { prix: 25, impression: 0, packaging: 0 },
  };
  if (editable) {
    [artists, costs] = await Promise.all([getArtistsForSelect(), getCostParams()]);
  }

  const ca = pnl?.ca_brut ?? 0;
  const objectif = drop.objectif_ca ?? 0;

  return (
    <div className="space-y-6">
      <Link
        href="/drops"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Tous les drops
      </Link>

      {/* En-tête */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl tracking-tight text-text">{drop.name}</h1>
              <StatusBadge value={drop.status} dict={DROP_STATUS} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {dateCourte(drop.start_date)} → {dateCourte(drop.end_date)}
            </p>
            {drop.notes && <p className="mt-2 max-w-2xl text-sm text-muted">{drop.notes}</p>}
          </div>
          {editable && (
            <div className="flex items-center gap-2">
              <DropFormButton drop={drop} variant="secondary" label="Modifier" />
              <DeleteDropButton id={drop.id} name={drop.name} />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="CA réalisé"
          value={euros0(ca)}
          accent
          hint={objectif > 0 ? `Objectif ${euros0(objectif)}` : undefined}
        />
        <StatCard label="Ventes" value={nombre(pnl?.nb_ventes)} />
        <StatCard label="Œuvres" value={nombre(oeuvres.length)} />
        <StatCard label="Résultat net" value={euros0(pnl?.resultat_net)} />
      </div>

      {/* Œuvres */}
      <Card>
        <CardHeader
          title="Œuvres du drop"
          subtitle={`${oeuvres.length} œuvre(s)`}
          action={
            editable ? (
              <OeuvreFormButton dropId={drop.id} artists={artists} costs={costs} />
            ) : undefined
          }
        />
        <CardBody className="p-0">
          {oeuvres.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-faint">
              Aucune œuvre dans ce drop.
              {editable && " Clique sur « Ajouter une œuvre » pour commencer."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Œuvre</th>
                    <th className="px-5 py-2.5 font-semibold">Artiste</th>
                    <th className="px-5 py-2.5 font-semibold">Format</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Prix</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Marge</th>
                    <th className="px-5 py-2.5 font-semibold">Statut</th>
                    <th className="px-5 py-2.5 font-semibold">Fichier</th>
                    {editable && <th className="px-5 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {oeuvres.map((o) => {
                    const marge =
                      (o.price ?? 0) -
                      (o.cout_impression ?? 0) -
                      (o.cout_packaging ?? 0) -
                      (o.price ?? 0) * COMMISSION_PCT;
                    return (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={o.name} src={o.file_url} size="sm" className="rounded" />
                            <span className="font-medium text-text">{o.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-muted">{o.artist_name ?? "—"}</td>
                        <td className="px-5 py-2.5 text-muted">{o.format}</td>
                        <td className="px-5 py-2.5 text-right text-text">{euros(o.price)}</td>
                        <td className={"px-5 py-2.5 text-right font-medium " + (marge >= 0 ? "text-success" : "text-danger")}>
                          {euros(marge)}
                        </td>
                        <td className="px-5 py-2.5">
                          <StatusBadge value={o.status} dict={OEUVRE_STATUS} />
                        </td>
                        <td className="px-5 py-2.5">
                          <StatusBadge value={o.file_status} dict={FILE_STATUS} fallback="—" />
                        </td>
                        {editable && (
                          <td className="px-5 py-2.5">
                            <div className="flex items-center justify-end gap-3">
                              <OeuvreFormButton dropId={drop.id} artists={artists} costs={costs} oeuvre={o} variant="row" />
                              <DeleteOeuvreButton id={o.id} dropId={drop.id} name={o.name} />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
