"use client";

import { useFormStatus } from "react-dom";

export const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";
export const labelCls =
  "mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted";

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SubmitButton({
  label,
  pendingLabel = "Enregistrement…",
}: {
  label: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormError({ error }: { error: string | null | undefined }) {
  if (!error) return null;
  return (
    <p className="rounded-md bg-dangerBg px-3 py-2 text-sm text-danger">
      {error}
    </p>
  );
}
