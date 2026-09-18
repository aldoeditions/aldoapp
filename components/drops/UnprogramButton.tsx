"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { unprogramOeuvre } from "@/app/(app)/drops/actions";

/** Retire une œuvre d'une campagne (sans la supprimer du catalogue). */
export function UnprogramButton({ oeuvreId, dropId, name }: { oeuvreId: string; dropId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title={`Retirer « ${name} » de cette campagne (l'œuvre reste au catalogue)`}
      onClick={() =>
        start(async () => {
          await unprogramOeuvre(oeuvreId, dropId);
          router.refresh();
        })
      }
      className="text-2xs font-medium text-muted transition-colors hover:text-danger disabled:opacity-50"
    >
      {pending ? "…" : "Retirer"}
    </button>
  );
}
