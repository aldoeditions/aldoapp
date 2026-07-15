"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updatePassword, type ResetState } from "./actions";

const initialState: ResetState = { error: null };

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : "Définir mon mot de passe"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useFormState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputCls}
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-text">
          Confirmer le mot de passe
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputCls}
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-dangerBg px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
