"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Barrière d'erreur du portail artiste : évite l'écran blanc « Application
 * error » et affiche un message clair + de quoi diagnostiquer (temporaire).
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Visible dans la console navigateur + logs Vercel.
    console.error("[portail] erreur de rendu :", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warningBg text-warning">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
      </div>
      <h1 className="font-serif text-2xl text-text">Oups, un petit souci s&apos;est glissé</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Une erreur est survenue en affichant cette page. Réessaie — si ça persiste, préviens l&apos;équipe
        Aldo en lui envoyant le détail ci-dessous.
      </p>

      <div className="mt-5 flex justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accentHover"
        >
          Réessayer
        </button>
        <Link
          href="/portail"
          className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text hover:bg-bg"
        >
          Retour à l&apos;accueil
        </Link>
      </div>

      <details className="mx-auto mt-6 max-w-md rounded-lg border border-border bg-bg px-4 py-3 text-left">
        <summary className="cursor-pointer text-2xs font-semibold uppercase tracking-wide text-faint">
          Détail technique (à envoyer à Aldo)
        </summary>
        <p className="mt-2 break-words font-mono text-2xs text-muted">{error?.message || "Erreur inconnue"}</p>
        {error?.digest && <p className="mt-1 font-mono text-2xs text-faint">digest: {error.digest}</p>}
      </details>
    </div>
  );
}
