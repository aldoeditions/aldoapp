"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { dateCourte } from "@/lib/format";
import { PIPE_STATUSES } from "@/lib/constants";
import { updatePipeStatus, signArtist, setDansLePipe } from "@/app/(app)/prospection/actions";
import { igHandle, igUrl } from "@/lib/instagram";
import { ArtistEditDrawer } from "@/components/artists/ArtistEditDrawer";
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
  const [editing, setEditing] = useState<PipeCard | null>(null);

  function changeStage(id: string, status: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, pipe_status: status } : r)));
    start(() => updatePipeStatus(id, status));
  }

  function toggleDrop(id: string, value: boolean) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, dans_le_pipe: value } : r)));
    start(() => setDansLePipe(id, value));
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
    <>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
            <th className="w-8 px-3 py-2.5 font-semibold" title="Pour les prochains drop">★</th>
            <th className="px-5 py-2.5 font-semibold">Artiste</th>
            <th className="px-3 py-2.5 font-semibold">Style</th>
            <th className="px-3 py-2.5 font-semibold">Instagram</th>
            <th className="px-3 py-2.5 font-semibold">Étape</th>
            <th className="px-3 py-2.5 font-semibold">1er contact</th>
            {editable && <th className="px-5 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  disabled={pending || !editable}
                  onClick={() => toggleDrop(p.id, !p.dans_le_pipe)}
                  title={p.dans_le_pipe ? "Retirer des prochains drop" : "Ajouter aux prochains drop"}
                  className="flex items-center justify-center rounded p-1 transition-colors hover:bg-accentBg disabled:opacity-60"
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill={p.dans_le_pipe ? "currentColor" : "none"}
                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                    className={p.dans_le_pipe ? "text-accent" : "text-faint hover:text-accent"}
                    aria-label="Pour les prochains drop"
                  >
                    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z" />
                  </svg>
                </button>
              </td>
              <td className="px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="flex items-center gap-2.5 text-left hover:text-accent"
                >
                  <Avatar name={p.name} src={p.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{p.name}</p>
                    <p className="truncate text-2xs text-faint">{p.renommee ?? ""}</p>
                  </div>
                </button>
              </td>
              <td className="px-3 py-2.5 text-muted">{p.style ?? "—"}</td>
              <td className="px-3 py-2.5">
                {p.instagram ? (
                  <a
                    href={igUrl(p.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                    title="Ouvrir Instagram dans un nouvel onglet"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                    </svg>
                    <span className="max-w-[160px] truncate">{igHandle(p.instagram)}</span>
                  </a>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </td>
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

    <ArtistEditDrawer
      artist={editing}
      open={editing !== null}
      onClose={() => setEditing(null)}
      mode="prospect"
    />
    </>
  );
}
