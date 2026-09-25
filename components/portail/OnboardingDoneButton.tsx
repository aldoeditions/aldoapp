"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/portail/(shell)/actions";

export function OnboardingDoneButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await completeOnboarding();
          router.push("/portail");
        })
      }
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
    >
      {pending ? "…" : "Accéder à mon espace"}
    </button>
  );
}
