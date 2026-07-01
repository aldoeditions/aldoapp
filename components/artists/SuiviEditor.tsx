"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { updateSuiviField } from "@/app/(app)/prospection/actions";
import {
  KIT_STATUSES,
  KIT_STATUS,
  VISUELS_STATUSES,
  VISUELS_STATUS,
  DEMANDE_STATUSES,
  DEMANDE_STATUS,
  CONTRACT_STATUSES,
  CONTRACT_STATUS,
  type StatusOption,
} from "@/lib/constants";

type FieldKey = "kit_impression" | "visuels" | "demande_infos" | "contrat_status";

const FIELDS: { key: FieldKey; label: string; options: StatusOption[]; dict: Record<string, StatusOption> }[] = [
  { key: "kit_impression", label: "Kit impression", options: KIT_STATUSES, dict: KIT_STATUS },
  { key: "visuels", label: "Visuels", options: VISUELS_STATUSES, dict: VISUELS_STATUS },
  { key: "demande_infos", label: "Demande infos", options: DEMANDE_STATUSES, dict: DEMANDE_STATUS },
  { key: "contrat_status", label: "Contrat", options: CONTRACT_STATUSES, dict: CONTRACT_STATUS },
];

export function SuiviEditor({
  id,
  editable,
  values,
}: {
  id: string;
  editable: boolean;
  values: Record<FieldKey, string | null>;
}) {
  const [state, setState] = useState(values);
  const [, start] = useTransition();

  function change(field: FieldKey, value: string) {
    setState((s) => ({ ...s, [field]: value || null }));
    start(() => updateSuiviField(id, field, value));
  }

  return (
    <div className="divide-y divide-border">
      {FIELDS.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="text-2xs font-semibold uppercase tracking-wide text-faint">
            {f.label}
          </span>
          {editable ? (
            <select
              value={state[f.key] ?? ""}
              onChange={(e) => change(f.key, e.target.value)}
              className="rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            >
              <option value="">—</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <StatusBadge value={state[f.key]} dict={f.dict} fallback="—" />
          )}
        </div>
      ))}
    </div>
  );
}
