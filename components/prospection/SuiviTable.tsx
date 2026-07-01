"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
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
import type { SuiviArtist } from "@/lib/data/prospection";

type FieldKey = "kit_impression" | "visuels" | "demande_infos" | "contrat_status";

const COLUMNS: { key: FieldKey; label: string; options: StatusOption[] }[] = [
  { key: "kit_impression", label: "Kit impression", options: KIT_STATUSES },
  { key: "visuels", label: "Visuels", options: VISUELS_STATUSES },
  { key: "demande_infos", label: "Infos", options: DEMANDE_STATUSES },
  { key: "contrat_status", label: "Contrat", options: CONTRACT_STATUSES },
];

const DICTS = {
  kit_impression: KIT_STATUS,
  visuels: VISUELS_STATUS,
  demande_infos: DEMANDE_STATUS,
  contrat_status: CONTRACT_STATUS,
};

function InlineSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string | null;
  options: StatusOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SuiviTable({
  artists,
  editable,
}: {
  artists: SuiviArtist[];
  editable: boolean;
}) {
  const [rows, setRows] = useState(artists);
  const [, startTransition] = useTransition();

  function change(id: string, field: FieldKey, value: string) {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, [field]: value || null } : r)),
    );
    startTransition(() => updateSuiviField(id, field, value));
  }

  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-faint">
        Aucun artiste en suivi de lancement (confirmés ou en phase suivi).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
            <th className="px-5 py-2.5 font-semibold">Artiste</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className="px-3 py-2.5 font-semibold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0">
              <td className="px-5 py-2.5">
                <Link
                  href={`/artistes/${a.id}`}
                  className="flex items-center gap-2.5 hover:text-accent"
                >
                  <Avatar name={a.name} src={a.avatar_url} size="sm" />
                  <span className="font-medium text-text">{a.name}</span>
                </Link>
              </td>
              {COLUMNS.map((c) => (
                <td key={c.key} className="px-3 py-2.5">
                  {editable ? (
                    <InlineSelect
                      value={a[c.key]}
                      options={c.options}
                      onChange={(v) => change(a.id, c.key, v)}
                    />
                  ) : (
                    <StatusBadge value={a[c.key]} dict={DICTS[c.key]} fallback="—" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
