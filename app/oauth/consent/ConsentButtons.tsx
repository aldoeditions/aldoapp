"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { approveConsent, denyConsent } from "./actions";

export function ConsentButtons({ authorizationId }: { authorizationId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);

  function run(kind: "approve" | "deny") {
    setError(null);
    setAction(kind);
    startTransition(async () => {
      const res = kind === "approve" ? await approveConsent(authorizationId) : await denyConsent(authorizationId);
      // En cas de succès, l'action redirige (pas de retour). Ici = erreur.
      if (res?.error) {
        setError(res.error);
        setAction(null);
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p className="rounded-lg bg-dangerBg px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <div className="flex gap-3">
        <Button
          variant="primary"
          className="flex-1"
          disabled={pending}
          onClick={() => run("approve")}
        >
          {pending && action === "approve" ? "Autorisation…" : "Autoriser l'accès"}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={pending}
          onClick={() => run("deny")}
        >
          {pending && action === "deny" ? "Refus…" : "Refuser"}
        </Button>
      </div>
    </div>
  );
}
