"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { dateCourte } from "@/lib/format";
import { PIPE_STATUSES } from "@/lib/constants";
import { updatePipeStatus, signArtist } from "@/app/(app)/prospection/actions";
import type { PipeCard } from "@/lib/data/prospection";

export function ProspectsTable({
  prospects,
  editable,
}: {
  prospects: PipeCard[];
  editable: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(prospects);
  const [pending, start] = useTransition();
  const [signing, setSigning] = useState<string | null>(null);

  function changeStage(id: string, status: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, pipe_status: status } : r)));
    start(() => updatePipeStatus(id, status));
  }

  function sign(id: string, name: string) {
    if (!confirm(`Signer « ${name} » ? Il rejoindra la vue Artistes.`)) return;
    setSigning(id);
    start(async () => {
      await signArtist(id);
      setRows((rs) => rs.filter((r) => r.id !== id));
      setSigning(null);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="px-5 py-12 text-center text-sm text-faint">
        Aucun prospect ne correspond.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
            <th className="px-5 py-2.5 font-semibold">Artiste</th>
            <th className="px-3 py-2.5 font-semibold">Style</th>
            <th className="px-3 py-2.5 font-semibold">Étape</th>
            <th className="px-3 py-2.5 font-semibold">Contacté par</th>
            <th className="px-3 py-2.5 font-semibold">1er contact</th>
            {editable && <th className="px-5 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="px-5 py-2.5">
                <Link href={`/artistes/${p.id}`} className="flex items-center gap-2.5 hover:text-accent">
                  <Avatar name={p.name} src={p.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{p.name}</p>
                    <p className="truncate text-2xs text-faint">{p.renommee ?? ""}</p>
                  </div>
                </Link>
              </td>
              <td className="px-3 py-2.5 text-muted">{p.style ?? "—"}</td>
              <td className="px-3 py-2.5">
                {editable ? (
                  <select
                    value={p.pipe_status ?? "prospect"}
                    disabled={pending}
                    onChange={(e) => changeStage(p.id, e.target.value)}
                    className="rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
                  >
                    {PIPE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-muted">{p.pipe_status ?? "—"}</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-muted">{p.contacted_by ?? "—"}</td>
              <td className="px-3 py-2.5 text-muted">{dateCourte(p.first_contact_date)}</td>
              {editable && (
                <td className="px-5 py-2.5 text-right">
                  <button
                    type="button"
                    disabled={pending && signing === p.id}
                    onClick={() => sign(p.id, p.name)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accentBg px-2.5 py-1.5 text-2xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {signing === p.id ? "…" : "Signer"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
