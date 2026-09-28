"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import {
  createExemption,
  deleteExemption,
  type PaymentFormState,
} from "@/app/(app)/artistes/actions";
import type { ExemptionView } from "@/lib/data/social-rates";
import { dateCourte } from "@/lib/format";

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";
const labelCls = "mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted";
const initial: PaymentFormState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : "Ajouter la dispense"}
    </button>
  );
}

function DeleteButton({ id, artistId }: { id: string; artistId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        start(async () => {
          await deleteExemption(id, artistId);
          router.refresh();
        })
      }
      disabled={pending}
      className="text-2xs text-faint hover:text-danger disabled:opacity-50"
      title="Supprimer"
    >
      Supprimer
    </button>
  );
}

export function ExemptionsManager({
  artistId,
  exemptions,
}: {
  artistId: string;
  exemptions: ExemptionView[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createExemption.bind(null, artistId), initial);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="font-serif text-base text-text">Dispenses de précompte</h3>
          <p className="text-2xs text-faint">{exemptions.length} dispense(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-bg"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Ajouter
        </button>
      </div>

      {exemptions.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-faint">
          Aucune dispense. Ajoute-en une si l&apos;artiste a une attestation Urssaf de dispense de précompte.
        </p>
      ) : (
        <ul>
          {exemptions.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 border-b border-border px-5 py-3 text-sm last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">{e.motif}</span>
                  {e.active && (
                    <span className="rounded-full bg-successBg px-2 py-0.5 text-2xs font-semibold text-success">Active</span>
                  )}
                </div>
                <p className="text-2xs text-faint">
                  Du {dateCourte(e.valid_from)} {e.valid_to ? `au ${dateCourte(e.valid_to)}` : "— sans échéance"}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  {e.document_url && (
                    <a href={e.document_url} target="_blank" rel="noreferrer" className="text-2xs text-accent hover:underline">
                      Voir le document
                    </a>
                  )}
                  <DeleteButton id={e.id} artistId={artistId} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Nouvelle dispense de précompte">
        <form action={formAction} className="space-y-5 px-5 py-5">
          <div>
            <label className={labelCls} htmlFor="motif">Motif</label>
            <input id="motif" name="motif" className={inputCls} placeholder="ex. Attestation Urssaf de dispense" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="valid_from">Valable du</label>
              <input id="valid_from" name="valid_from" type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="valid_to">Jusqu&apos;au (optionnel)</label>
              <input id="valid_to" name="valid_to" type="date" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="document">Justificatif (optionnel)</label>
            <input
              id="document"
              name="document"
              type="file"
              accept="application/pdf,image/*"
              className="text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accentBg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
            />
            <p className="mt-1 text-2xs text-faint">Stocké dans un espace privé, accessible à l&apos;équipe uniquement.</p>
          </div>

          {state.error && (
            <p className="rounded-md bg-dangerBg px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <Submit />
        </form>
      </Drawer>
    </>
  );
}
