"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { saveOrder, type FormState } from "@/app/(app)/commandes/actions";
import { Field, Select, SubmitButton, FormError, inputCls, labelCls } from "@/components/ui/form";
import { ORDER_STATUSES } from "@/lib/constants";
import { euros } from "@/lib/format";
import type { Order } from "@/types/database";

const initial: FormState = { error: null };

type OeuvreOpt = {
  id: string;
  name: string;
  format: string;
  price: number;
  drop_id: string | null;
};
type ItemRow = { oeuvre_id: string; quantity: number; unit_price: number };

export function OrderForm({
  order,
  items: initialItems,
  oeuvres,
  drops,
  waveNames,
  onSuccess,
}: {
  order?: Order | null;
  items?: ItemRow[];
  oeuvres: OeuvreOpt[];
  drops: { id: string; name: string }[];
  waveNames: string[];
  onSuccess: () => void;
}) {
  const editing = Boolean(order);
  const [state, formAction] = useFormState(
    saveOrder.bind(null, order?.id ?? null),
    initial,
  );
  const [items, setItems] = useState<ItemRow[]>(
    initialItems?.length ? initialItems : [{ oeuvre_id: "", quantity: 1, unit_price: 0 }],
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state, onSuccess]);

  const oeuvreById = new Map(oeuvres.map((o) => [o.id, o]));

  function setRow(idx: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function pickOeuvre(idx: number, oeuvreId: string) {
    const o = oeuvreById.get(oeuvreId);
    setRow(idx, { oeuvre_id: oeuvreId, unit_price: o ? o.price : 0 });
  }
  function addRow() {
    setItems((r) => [...r, { oeuvre_id: "", quantity: 1, unit_price: 0 }]);
  }
  function removeRow(idx: number) {
    setItems((r) => (r.length > 1 ? r.filter((_, i) => i !== idx) : r));
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const cleanItems = items.filter((i) => i.oeuvre_id && i.quantity > 0);

  return (
    <form action={formAction} className="space-y-4 px-5 py-5">
      <input type="hidden" name="items" value={JSON.stringify(cleanItems)} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="N° commande" name="order_number" defaultValue={order?.order_number} placeholder="auto si vide" />
        <Select label="Statut" name="status" defaultValue={order?.status ?? "en attente"} options={ORDER_STATUSES} />
      </div>

      <Field label="Client *" name="client_name" defaultValue={order?.client_name} placeholder="Nom du client" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" name="client_email" type="email" defaultValue={order?.client_email} />
        <Field label="Tracking" name="tracking_number" defaultValue={order?.tracking_number} />
      </div>
      <Field label="Adresse" name="client_address" defaultValue={order?.client_address} />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Drop"
          name="drop_id"
          defaultValue={order?.drop_id}
          placeholder="—"
          options={drops.map((d) => ({ value: d.id, label: d.name }))}
        />
        <div>
          <label className={labelCls} htmlFor="wave">Vague d&apos;impression</label>
          <input id="wave" name="wave" list="waves" defaultValue={order?.wave ?? ""} placeholder="2026-03-A" className={inputCls} />
          <datalist id="waves">
            {waveNames.map((w) => <option key={w} value={w} />)}
          </datalist>
        </div>
      </div>

      {/* Articles */}
      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Articles</p>
          <button type="button" onClick={addRow} className="text-2xs font-semibold text-accent hover:underline">
            + Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {items.map((row, idx) => {
            const o = oeuvreById.get(row.oeuvre_id);
            return (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  <select
                    value={row.oeuvre_id}
                    onChange={(e) => pickOeuvre(idx, e.target.value)}
                    className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="">Œuvre…</option>
                    {oeuvres.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} · {op.format}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-14">
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => setRow(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none focus:border-accent"
                    aria-label="Quantité"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    step="0.01"
                    value={row.unit_price}
                    onChange={(e) => setRow(idx, { unit_price: Number(e.target.value) || 0 })}
                    className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none focus:border-accent"
                    aria-label="Prix unitaire"
                  />
                </div>
                <span className="w-16 pb-1.5 text-right text-2xs font-medium text-text">
                  {euros(row.quantity * row.unit_price)}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="pb-1.5 text-faint hover:text-danger"
                  aria-label="Retirer"
                  title={o ? `Retirer ${o.name}` : "Retirer"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-sm">
          <span className="text-muted">Total commande</span>
          <span className="font-serif text-lg text-text">{euros(total)}</span>
        </div>
      </div>

      <FormError error={state.error} />
      <SubmitButton label={editing ? "Enregistrer" : "Créer la commande"} />
    </form>
  );
}
