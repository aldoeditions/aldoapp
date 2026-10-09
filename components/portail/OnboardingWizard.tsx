"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, setOnboardingStep } from "@/app/portail/(shell)/actions";
import { cn } from "@/lib/cn";

export type WizardStep = {
  key: string;
  title: string;
  subtitle?: string;
  node: React.ReactNode;
};

export function OnboardingWizard({
  steps,
  startStep = 0,
}: {
  steps: WizardStep[];
  startStep?: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(Math.min(Math.max(startStep, 0), steps.length - 1));
  const [finishing, startFinish] = useTransition();

  const last = steps.length - 1;
  const isLast = current === last;
  const pct = Math.round((current / last) * 100);

  const go = (next: number) => {
    const n = Math.min(Math.max(next, 0), last);
    setCurrent(n);
    void setOnboardingStep(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () =>
    startFinish(async () => {
      await completeOnboarding();
      router.push("/portail");
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Progression */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-2xs font-semibold uppercase tracking-wide text-faint">
            Étape {current + 1} / {steps.length}
          </p>
          {!isLast && (
            <button
              onClick={finish}
              disabled={finishing}
              className="text-2xs font-medium text-muted hover:text-text disabled:opacity-50"
            >
              Finir plus tard
            </button>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => go(i)}
              className={cn(
                "rounded-full px-2.5 py-1 text-2xs font-medium transition-colors",
                i === current
                  ? "bg-accent text-white"
                  : i < current
                    ? "bg-accentBg text-accent"
                    : "bg-bg text-faint hover:text-muted",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* En-tête de l'étape */}
      <div className="mb-4">
        <h2 className="font-serif text-2xl text-text">{steps[current].title}</h2>
        {steps[current].subtitle && (
          <p className="mt-1 text-sm text-muted">{steps[current].subtitle}</p>
        )}
      </div>

      {/* Contenu (toutes les étapes montées, seule l'active est visible) */}
      <div>
        {steps.map((s, i) => (
          <div key={s.key} className={i === current ? "" : "hidden"}>
            {s.node}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        <button
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>

        {isLast ? (
          <button
            onClick={finish}
            disabled={finishing}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accentHover disabled:opacity-60"
          >
            {finishing ? "Un instant…" : "Accéder à mon espace →"}
          </button>
        ) : (
          <button
            onClick={() => go(current + 1)}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accentHover"
          >
            Continuer
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-2xs text-faint">
        Tes réponses s&apos;enregistrent au fur et à mesure (bouton « Enregistrer » dans chaque bloc). Tu peux revenir plus tard.
      </p>
    </div>
  );
}
