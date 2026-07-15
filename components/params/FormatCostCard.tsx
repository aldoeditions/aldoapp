"use client";

import { useState, useTransition } from "react";
import { saveFormatCosts, type ParamState } from "@/app/(app)/parametres/actions";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { euros } from "@/lib/format";
import { COMMISSION_PCT } from "@/lib/constants";
import type { FormatCosts } from "@/lib/data/params";

const inputCls =
  "w-24 rounded-md border border-border bg-white px-2.5 py-1.5 text-right text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function FormatCostCard({ init }: { init: FormatCosts }) {
  const [impression, setImpression] = useState(String(init.impression));
  const [packaging, setPackaging] = useState(
    init.packaging.map((p) => ({ name: p.name, valeur: String(p.valeur) })),
  );
  const [pending, start] = useTransition();
  const [state, setState] = useState<ParamState | null>(null);

  const num = (v: string) => Number(v.replace(",", ".")) || 0;
  const packTotal = packaging.reduce((s, p) => s + num(p.valeur), 0);
  const imp = num(impression);
  const revient = imp + packTotal;
  const commission = init.prix * COMMISSION_PCT;
  const marge = init.prix - commission - revient;

  function setItem(i: number, valeur: string) {
    setPackaging((ps) => ps.map((p, idx) => (idx === i ? { ...p, valeur } : p)));
    setState(null);
  }

  function save() {
    setState(null);
    start(async () => {
      const res = await saveFormatCosts(
        init.format,
        imp,
        packaging.map((p) => ({ name: p.name, valeur: num(p.valeur) })),
      );
      setState(res);
    });
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return (
    <Card>
      <CardHeader
        title={`Format ${init.format}`}
        subtitle={`Prix de vente ${euros(init.prix)}`}
      />
      <CardBody className="space-y-4">
        {/* Impression */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">Coût d&apos;impression</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.01"
              value={impression}
              onChange={(e) => { setImpression(e.target.value); setState(null); }}
              className={inputCls}
            />
            <span className="text-sm text-muted">€</span>
          </div>
        </div>

        {/* Packaging */}
        <div className="border-t border-border pt-3">
          <p className="eyebrow mb-2">Packaging</p>
          <div className="space-y-2">
            {packaging.map((p, i) => (
              <div key={p.name + i} className="flex items-center justify-between">
                <span className="text-sm text-muted">{p.name}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={p.valeur}
                    onChange={(e) => setItem(i, e.target.value)}
                    className={inputCls}
                  />
                  <span className="text-sm text-muted">€</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
            <span className="text-muted">Total packaging</span>
            <span className="font-medium text-text">{euros(round2(packTotal))}</span>
          </div>
        </div>

        {/* Synthèse */}
        <div className="rounded-lg bg-bg px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Coût de revient</span>
            <span className="font-medium text-text">{euros(round2(revient))}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted">
              Marge nette <span className="text-faint">(après commission {Math.round(COMMISSION_PCT * 100)} %)</span>
            </span>
            <span className={"font-semibold " + (marge >= 0 ? "text-success" : "text-danger")}>
              {euros(round2(marge))}
            </span>
          </div>
        </div>

        {state?.ok && (
          <p className="rounded-md bg-successBg px-3 py-2 text-2xs font-medium text-success">
            ✓ Coûts enregistrés. Les prochaines œuvres utiliseront ces valeurs.
          </p>
        )}
        {state?.error && (
          <p className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">{state.error}</p>
        )}

        <button
          onClick={save}
          disabled={pending}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </CardBody>
    </Card>
  );
}
