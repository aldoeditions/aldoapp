import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getDrops } from "@/lib/data/drops";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { DROP_STATUS } from "@/lib/constants";
import { euros0, nombre, dateCourte } from "@/lib/format";
import { DropFormButton } from "@/components/drops/DropFormButton";

export default async function DropsPage() {
  const user = await requireModule("drops");
  const editable = canEdit(user.role, "drops");
  const drops = await getDrops();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Produit"
        title="Drops & Œuvres"
        description="Campagnes mensuelles et les œuvres associées, par format (A3 40 € · A4 25 €)."
        action={editable ? <DropFormButton /> : undefined}
      />

      {drops.length === 0 ? (
        <EmptyState
          title="Aucun drop pour l'instant"
          description="Crée ta première campagne pour y rattacher des œuvres."
          action={editable ? <DropFormButton /> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drops.map((d) => {
            const ca = d.pnl?.ca_brut ?? 0;
            const objectif = d.objectif_ca ?? 0;
            const pct = objectif > 0 ? Math.min(100, Math.round((ca / objectif) * 100)) : null;
            return (
              <Link
                key={d.id}
                href={`/drops/${d.id}`}
                className="card group flex flex-col p-5 transition-shadow hover:shadow-float"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-text group-hover:text-accent">
                      {d.name}
                    </p>
                    <p className="mt-0.5 text-2xs text-faint">
                      {dateCourte(d.start_date)} → {dateCourte(d.end_date)}
                    </p>
                  </div>
                  <StatusBadge value={d.status} dict={DROP_STATUS} />
                </div>

                {/* Objectif */}
                {objectif > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-2xs text-muted">
                      <span>{euros0(ca)}</span>
                      <span className="text-faint">obj. {euros0(objectif)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <div>
                    <p className="font-serif text-lg text-text">{nombre(d.nb_oeuvres)}</p>
                    <p className="text-2xs text-faint">Œuvres</p>
                  </div>
                  <div>
                    <p className="font-serif text-lg text-text">{nombre(d.pnl?.nb_ventes)}</p>
                    <p className="text-2xs text-faint">Ventes</p>
                  </div>
                  <div>
                    <p className="font-serif text-lg text-text">{euros0(ca)}</p>
                    <p className="text-2xs text-faint">CA</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
