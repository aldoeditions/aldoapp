import { StatusBadge } from "@/components/ui/Badge";
import { OEUVRE_STATUS } from "@/lib/constants";
import { euros, nombre } from "@/lib/format";
import type { MyOeuvre } from "@/lib/data/portal";

export function OeuvreCard({ oeuvre }: { oeuvre: MyOeuvre }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-float">
      {/* Visuel */}
      <div className="relative aspect-[4/5] bg-bg">
        {oeuvre.file_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={oeuvre.file_url} alt={oeuvre.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-2xl text-faint">{oeuvre.format}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-2xs font-semibold text-text shadow-card">
          {oeuvre.format}
        </span>
        <span className="absolute right-3 top-3">
          <StatusBadge value={oeuvre.status} dict={OEUVRE_STATUS} />
        </span>
      </div>

      {/* Infos */}
      <div className="p-4">
        <p className="truncate font-medium text-text">{oeuvre.name}</p>
        <p className="mt-0.5 truncate text-2xs text-muted">
          {oeuvre.drop_name ?? "Hors campagne"}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-2xs text-faint">Prix de vente</p>
            <p className="font-medium text-text">{euros(oeuvre.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xs text-faint">Ventes · CA</p>
            <p className="font-medium text-text">
              {nombre(oeuvre.nb_ventes)} · {euros(oeuvre.ca_brut)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
