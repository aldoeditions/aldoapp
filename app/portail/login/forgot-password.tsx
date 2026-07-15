"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset, type ForgotState } from "./actions";

const initialState: ForgotState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Recevoir le lien"}
    </button>
  );
}

export function ForgotPassword() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <p className="mt-5 rounded-lg bg-successBg px-3 py-2.5 text-center text-2xs text-success">
        Si un compte existe pour cette adresse, un lien de réinitialisation vient
        d&apos;être envoyé. Pense à vérifier tes spams.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 block w-full text-center text-2xs text-muted underline-offset-2 hover:text-accent hover:underline"
      >
        Mot de passe oublié ?
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-5 space-y-2.5 border-t border-border pt-5">
      <label htmlFor="forgot-email" className="block text-sm font-medium text-text">
        Réinitialiser mon mot de passe
      </label>
      <input
        id="forgot-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        placeholder="ton@email.com"
      />
      {state.error && (
        <p className="rounded-lg bg-dangerBg px-3 py-2 text-2xs text-danger">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
