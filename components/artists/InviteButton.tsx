"use client";

import { useState, useTransition } from "react";
import { inviteArtist, type InviteResult } from "@/app/(app)/artistes/actions";

export function InviteButton({
  artistId,
  hasEmail,
  alreadyLinked,
}: {
  artistId: string;
  hasEmail: boolean;
  alreadyLinked: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<InviteResult | null>(null);

  if (alreadyLinked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-successBg px-3 py-2 text-2xs font-semibold text-success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        Portail activé
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={pending || !hasEmail}
        title={hasEmail ? "Créer le compte portail" : "Ajoute un email à l'artiste d'abord"}
        onClick={() => start(async () => setResult(await inviteArtist(artistId)))}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-bg disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v16H4z" opacity="0" />
          <path d="M22 7l-10 6L2 7" /><path d="M2 7h20v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
        </svg>
        {pending ? "Invitation…" : "Inviter au portail"}
      </button>

      {result && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-line bg-surface p-4 shadow-float">
          {result.error ? (
            <p className="text-sm text-danger">{result.error}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-text">Compte portail créé ✅</p>
              <p className="mt-1 text-2xs text-muted">{result.email}</p>
              {result.password ? (
                <>
                  <p className="mt-3 text-2xs font-semibold uppercase tracking-wide text-faint">
                    Mot de passe temporaire
                  </p>
                  <code className="mt-1 block select-all rounded-md bg-bg px-2.5 py-2 text-sm text-text">
                    {result.password}
                  </code>
                  <p className="mt-2 text-2xs text-faint">
                    Communique-le à l&apos;artiste. Il pourra le changer ensuite.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">{result.info}</p>
              )}
              <button
                onClick={() => setResult(null)}
                className="mt-3 text-2xs font-medium text-accent hover:underline"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
