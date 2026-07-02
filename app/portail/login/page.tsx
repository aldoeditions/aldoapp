import type { Metadata } from "next";
import { PortalLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Espace artiste — Aldo Éditions",
};

export default function PortalLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const notice =
    searchParams.error === "unlinked"
      ? "Ton compte n'est pas encore relié à ta fiche artiste. Contacte l'équipe Aldo."
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Espace artiste</p>
          <h1 className="font-serif text-4xl tracking-tight text-text">Aldo Éditions</h1>
          <p className="mt-3 text-sm text-muted">
            Bienvenue dans ton espace. Retrouve tes ventes, tes fichiers,
            tes contrats et tes commissions.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7 shadow-card">
          <PortalLoginForm notice={notice} />
        </div>

        <p className="mt-6 text-center text-2xs text-faint">
          Un souci pour te connecter ? Écris à l&apos;équipe Aldo.
        </p>
      </div>
    </main>
  );
}
