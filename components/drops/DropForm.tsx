"use client";

import { useFormState } from "react-dom";
import { saveDrop, type FormState } from "@/app/(app)/drops/actions";
import { Field, Select, SubmitButton, FormError } from "@/components/ui/form";
import { DROP_STATUSES } from "@/lib/constants";
import type { Drop } from "@/types/database";

const initial: FormState = { error: null };

export function DropForm({ drop }: { drop?: Drop | null }) {
  const editing = Boolean(drop);
  const [state, formAction] = useFormState(
    saveDrop.bind(null, drop?.id ?? null),
    initial,
  );

  return (
    <form action={formAction} className="space-y-4 px-5 py-5">
      <Field label="Nom du drop *" name="name" defaultValue={drop?.name} placeholder="Drop de mars 2026" />

      <Select
        label="Statut"
        name="status"
        defaultValue={drop?.status ?? "à venir"}
        options={DROP_STATUSES}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Début *" name="start_date" type="date" defaultValue={drop?.start_date} />
        <Field label="Fin *" name="end_date" type="date" defaultValue={drop?.end_date} />
      </div>

      <Field
        label="Objectif CA (€)"
        name="objectif_ca"
        type="number"
        step="0.01"
        defaultValue={drop?.objectif_ca}
        placeholder="Ex. 5000"
      />

      <div>
        <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={drop?.notes ?? ""}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <FormError error={state.error} />
      <SubmitButton label={editing ? "Enregistrer" : "Créer le drop"} />
    </form>
  );
}
