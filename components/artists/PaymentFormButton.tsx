"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { recordPayment, type PaymentFormState } from "@/app/(app)/artistes/actions";
import { computeVersement, type SocialRate } from "@/lib/fiscal";
import { eurosCents } from "@/lib/format";
import { PAYMENT_STATUSES } from "@/lib/constants";

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
      {pending ? "Enregistrement…" : "Enregistrer le versement"}
    </button>
  );
}

export function PaymentFormButton({
  artistId,
  rate,
  exempt,
  priorYearGrossCents,
  drops,
  suggestedGross,
}: {
  artistId: string;
  rate: SocialRate | null;
  exempt: boolean;
  priorYearGrossCents: number;
  drops: { id: string; name: string }[];
  /** Rémunération à verser suggérée (en euros), pré-remplie. */
  suggestedGross?: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(recordPayment.bind(null, artistId), initial);
  const [gross, setGross] = useState<string>(
    suggestedGross && suggestedGross > 0 ? suggestedGross.toFixed(2) : "",
  );

  // Fermeture + refresh à la réussite.
  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setGross("");
      router.refresh();
    }
  }, [state.ok, router]);

  const preview = useMemo(() => {
    if (!rate) return null;
    const g = Math.round((Number(gross.replace(",", ".")) || 0) * 100);
    if (g <= 0) return null;
    return computeVersement(g, rate, { exempt, priorYearGrossCents });
  }, [gross, rate, exempt, priorYearGrossCents]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accentHover"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Enregistrer un versement
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Nouveau versement">
        <form action={formAction} className="space-y-5 px-5 py-5">
          {!rate && (
            <p className="rounded-md bg-warningBg px-3 py-2 text-sm text-warning">
              Aucun barème social n&apos;est défini. Ajoute une ligne dans <code>social_rates</code> avant d&apos;enregistrer un versement.
            </p>
          )}

          <div>
            <label className={labelCls} htmlFor="gross">Rémunération brute (€)</label>
            <input
              id="gross"
              name="gross"
              inputMode="decimal"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              placeholder="ex. 125,00"
              className={inputCls}
            />
            <p className="mt-1 text-2xs text-faint">
              Les 30 % du prix HT dus à l&apos;artiste. Le précompte et le net sont calculés automatiquement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="drop_id">Campagne (optionnel)</label>
              <select id="drop_id" name="drop_id" defaultValue="" className={inputCls}>
                <option value="">—</option>
                {drops.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="status">Statut</label>
              <select id="status" name="status" defaultValue="a_payer" className={inputCls}>
                {PAYMENT_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="paid_at">Date du versement</label>
            <input id="paid_at" name="paid_at" type="date" className={inputCls} />
            <p className="mt-1 text-2xs text-faint">
              Détermine le barème appliqué. Vide = aujourd&apos;hui.
            </p>
          </div>

          {/* Aperçu du calcul */}
          {preview && (
            <div className="rounded-lg border border-border bg-bg px-4 py-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted">Rémunération brute</span>
                <span className="font-medium text-text">{eurosCents(preview.gross_cents)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">
                  Précompte {exempt ? "(dispense)" : "retenu"}
                </span>
                <span className="font-medium text-danger">− {eurosCents(preview.precompte_cents)}</span>
              </div>
              <div className="flex justify-between border-t border-border py-1.5">
                <span className="font-medium text-text">Net à verser</span>
                <span className="font-semibold text-accent">{eurosCents(preview.net_cents)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-1.5 text-2xs text-faint">
                <span>Contribution diffuseur (coût Aldo, non déduit)</span>
                <span>{eurosCents(preview.contribution_diffuseur_cents)}</span>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls} htmlFor="notes">Note (optionnel)</label>
            <input id="notes" name="notes" className={inputCls} placeholder="référence, remarque…" />
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
