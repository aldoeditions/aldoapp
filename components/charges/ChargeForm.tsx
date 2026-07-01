"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { saveCharge, type FormState } from "@/app/(app)/charges/actions";
import { Field, Select, SubmitButton, FormError, inputCls, labelCls } from "@/components/ui/form";
import { CHARGE_TYPES, CHARGE_CATEGORIES } from "@/lib/constants";
import type { Charge } from "@/types/database";

const initial: FormState = { error: null };

export function ChargeForm({
  charge,
  drops,
  onSuccess,
}: {
  charge?: Charge | null;
  drops: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const editing = Boolean(charge);
  const [state, formAction] = useFormState(
    saveCharge.bind(null, charge?.id ?? null),
    initial,
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 px-5 py-5">
      <Field label="Libellé *" name="name" defaultValue={charge?.name} placeholder="Ex. Abonnement Shopify" />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Type" name="type" defaultValue={charge?.type ?? "Fixe"} options={CHARGE_TYPES} />
        <Select label="Catégorie" name="categorie" defaultValue={charge?.categorie ?? "Autre"} options={CHARGE_CATEGORIES} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Montant (€) *" name="montant" type="number" step="0.01" defaultValue={charge?.montant} />
        <Select
          label="Drop"
          name="drop_id"
          defaultValue={charge?.drop_id}
          placeholder="Général (aucun)"
          options={drops.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={charge?.notes ?? ""} className={inputCls} />
      </div>

      <FormError error={state.error} />
      <SubmitButton label={editing ? "Enregistrer" : "Ajouter la charge"} />
    </form>
  );
}
