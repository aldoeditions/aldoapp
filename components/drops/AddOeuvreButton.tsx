"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import { OeuvreForm } from "./OeuvreForm";
import { attachOeuvreToDrop } from "@/app/(app)/drops/actions";
import type { CostByFormat } from "@/lib/data/drops";
import type { AttachableOeuvre } from "@/lib/data/oeuvres";

export function AddOeuvreButton({
  dropId,
  artists,
  drops,
  costs,
  attachable,
}: {
  dropId: string;
  artists: { id: string; name: string }[];
  drops: { id: string; name: string }[];
  costs: CostByFormat;
  attachable: AttachableOeuvre[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [selected, setSelected] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setSelected("");
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTab(attachable.length > 0 ? "existing" : "new"); }}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentHover"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        Ajouter une œuvre
      </button>

      <Drawer open={open} onClose={close} title="Ajouter une œuvre au drop">
        {open && (
          <div>
            <div className="mx-5 mt-5 inline-flex rounded-md border border-border bg-surface p-0.5">
              {([
                { key: "existing", label: "Œuvre existante" },
                { key: "new", label: "Nouvelle œuvre" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === t.key ? "bg-text text-white" : "text-muted hover:text-text",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "existing" ? (
              <div className="space-y-4 px-5 py-5">
                {attachable.length === 0 ? (
                  <p className="rounded-md bg-bg px-3 py-2.5 text-sm text-muted">
                    Aucune œuvre existante à rattacher. Crée-en une via « Nouvelle œuvre » (ou depuis la vue Œuvres).
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted">
                        Œuvre à rattacher
                      </label>
                      <select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                      >
                        <option value="">Sélectionner une œuvre…</option>
                        {attachable.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}{o.artist_name ? ` — ${o.artist_name}` : ""}{o.drop_name ? ` (actuellement : ${o.drop_name})` : " (sans drop)"}
                          </option>
                        ))}
                      </select>
                    </div>
                    {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">{error}</p>}
                    <button
                      disabled={pending || !selected}
                      onClick={() =>
                        start(async () => {
                          setError(null);
                          const res = await attachOeuvreToDrop(selected, dropId);
                          if (res.error) setError(res.error);
                          else { close(); router.refresh(); }
                        })
                      }
                      className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover disabled:opacity-60"
                    >
                      {pending ? "Rattachement…" : "Rattacher au drop"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <OeuvreForm
                drops={drops}
                defaultDropId={dropId}
                artists={artists}
                costs={costs}
                onSuccess={() => { close(); router.refresh(); }}
              />
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
