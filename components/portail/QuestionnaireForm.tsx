"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { updateMyQuestionnaire, type ProfileState } from "@/app/portail/(shell)/actions";
import { SubmitButton, FormError, inputCls } from "@/components/ui/form";
import { ARTIST_QUESTIONS } from "@/lib/constants";

const initial: ProfileState = { error: null };

export function QuestionnaireForm({ answers }: { answers: Record<string, string> }) {
  const router = useRouter();
  const [state, action] = useFormState(updateMyQuestionnaire, initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const filled = ARTIST_QUESTIONS.filter((q) => answers[q.id]?.trim()).length;

  return (
    <form action={action} className="space-y-5">
      {state.ok && (
        <p className="rounded-lg bg-successBg px-4 py-3 text-sm font-medium text-success">
          ✓ Tes réponses sont enregistrées. Merci !
        </p>
      )}
      <p className="text-sm text-muted">
        Ces réponses nourrissent ta page artiste sur le site et nos réseaux. Pas besoin de tout remplir
        d&apos;un coup — tu peux revenir quand tu veux.{" "}
        <span className="font-medium text-text">{filled}/{ARTIST_QUESTIONS.length} répondues.</span>
      </p>

      {ARTIST_QUESTIONS.map((q, i) => (
        <div key={q.id}>
          <label htmlFor={q.id} className="mb-1.5 block text-sm font-medium text-text">
            <span className="text-faint">{i + 1}.</span> {q.label}
          </label>
          <textarea
            id={q.id}
            name={q.id}
            rows={3}
            defaultValue={answers[q.id] ?? ""}
            className={inputCls}
            placeholder="Ta réponse…"
          />
        </div>
      ))}

      <FormError error={state.error} />
      <SubmitButton label="Enregistrer mes réponses" />
    </form>
  );
}
