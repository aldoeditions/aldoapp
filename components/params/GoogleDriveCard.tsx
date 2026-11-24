"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectGoogleDrive } from "@/app/(app)/parametres/drive-actions";
import { dateCourte } from "@/lib/format";
import type { GoogleDriveStatus } from "@/lib/data/params";

export function GoogleDriveCard({
  status,
  notice,
}: {
  status: GoogleDriveStatus;
  notice?: { kind: "ok" | "error"; message: string } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function disconnect() {
    if (!confirm("Déconnecter Google Drive ? Le classement automatique des contrats signés s'arrêtera jusqu'à reconnexion.")) return;
    start(async () => {
      await disconnectGoogleDrive();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {notice && (
        <p className={`rounded-md px-3 py-2 text-sm ${notice.kind === "error" ? "bg-dangerBg text-danger" : "bg-successBg text-success"}`}>
          {notice.message}
        </p>
      )}

      {status.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="text-text">
              Connecté en tant que <span className="font-semibold">{status.email ?? "—"}</span>
            </p>
            <p className="mt-0.5 text-2xs text-faint">
              Depuis le {status.connectedAt ? dateCourte(status.connectedAt) : "—"}. L&apos;app Google est en mode « Test » :
              la connexion expire au bout de 7 jours sans reconnexion.
            </p>
          </div>
          <button
            onClick={disconnect}
            disabled={pending}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-2xs font-semibold text-text transition-colors hover:bg-bg disabled:opacity-50"
          >
            {pending ? "Déconnexion…" : "Déconnecter"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Non connecté — le classement automatique des contrats signés dans Drive est inactif.
          </p>
          <a
            href="/api/google/authorize"
            className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-accentHover"
          >
            Connecter Google Drive
          </a>
        </div>
      )}
    </div>
  );
}
