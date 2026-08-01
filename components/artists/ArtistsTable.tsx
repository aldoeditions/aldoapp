"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { ARTIST_PHASE } from "@/lib/constants";
import { euros0, nombre, pourcent } from "@/lib/format";
import type { ArtistWithStats } from "@/types/database";

export function ArtistsTable({ artists }: { artists: ArtistWithStats[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
              <th className="px-5 py-2.5 font-semibold">Artiste</th>
              <th className="px-3 py-2.5 font-semibold">Type · Style</th>
              <th className="px-3 py-2.5 font-semibold">Phase</th>
              <th className="px-3 py-2.5 text-right font-semibold">Œuvres</th>
              <th className="px-3 py-2.5 text-right font-semibold">Ventes</th>
              <th className="px-3 py-2.5 text-right font-semibold">CA</th>
              <th className="px-5 py-2.5 text-right font-semibold">Commission</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr
                key={a.id ?? ""}
                onClick={() => router.push(`/artistes/${a.id}`)}
                className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-bg"
              >
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.name} src={a.avatar_url} size="sm" />
                    <span className="font-medium text-text">{a.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted">
                  {[a.type, a.style].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge value={a.phase} dict={ARTIST_PHASE} />
                </td>
                <td className="px-3 py-2.5 text-right text-text">{nombre(a.nb_oeuvres)}</td>
                <td className="px-3 py-2.5 text-right text-text">{nombre(a.total_ventes)}</td>
                <td className="px-3 py-2.5 text-right text-text">{euros0(a.total_ca)}</td>
                <td className="px-5 py-2.5 text-right text-muted">
                  {a.commission_pct != null ? pourcent(a.commission_pct / 100) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
