"use client";

import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { OEUVRE_STATUS } from "@/lib/constants";
import { euros } from "@/lib/format";
import { OeuvreFormButton } from "@/components/drops/OeuvreFormButton";
import type { CostByFormat } from "@/lib/data/drops";
import type { OeuvreCatalogRow } from "@/lib/data/oeuvres";

export function OeuvresTable({
  oeuvres,
  artists,
  drops,
  costs,
  editable,
}: {
  oeuvres: OeuvreCatalogRow[];
  artists: { id: string; name: string }[];
  drops: { id: string; name: string }[];
  costs: CostByFormat;
  editable: boolean;
}) {
  if (oeuvres.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface py-12 text-center text-sm text-faint">
        Aucune œuvre. Clique sur « Nouvelle œuvre » pour en ajouter une.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
              <th className="px-5 py-2.5 font-semibold">Œuvre</th>
              <th className="px-3 py-2.5 font-semibold">Artiste</th>
              <th className="px-3 py-2.5 font-semibold">Drop</th>
              <th className="px-3 py-2.5 font-semibold">Format</th>
              <th className="px-3 py-2.5 text-right font-semibold">Prix</th>
              <th className="px-3 py-2.5 font-semibold">Statut</th>
              {editable && <th className="px-5 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {oeuvres.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={o.name} src={o.file_url} size="sm" className="rounded" />
                    <span className="font-medium text-text">{o.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted">{o.artist_name ?? "—"}</td>
                <td className="px-3 py-2.5">
                  {o.drop_name ? (
                    <span className="text-text">{o.drop_name}</span>
                  ) : (
                    <span className="rounded-full bg-warningBg px-2 py-0.5 text-2xs font-medium text-warning">À rattacher</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted">{o.format}</td>
                <td className="px-3 py-2.5 text-right text-text">{euros(o.price)}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge value={o.status} dict={OEUVRE_STATUS} />
                </td>
                {editable && (
                  <td className="px-5 py-2.5 text-right">
                    <OeuvreFormButton
                      drops={drops}
                      artists={artists}
                      costs={costs}
                      oeuvre={o}
                      variant="row"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
