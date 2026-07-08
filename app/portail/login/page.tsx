import type { Metadata } from "next";
import { PortalLoginForm } from "./login-form";
import { Logo, Mascotte } from "@/components/brand/Logo";

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
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Mascotte className="mb-2 h-24 w-auto" />
          <Logo className="h-8 text-accent" />
          <p className="eyebrow mt-3">Espace artiste</p>
          <p className="mt-2 text-sm text-muted">
            Bienvenue dans ton espace. Retrouve tes ventes, tes fichiers,
            tes contrats et tes commissions.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <PortalLoginForm notice={notice} />
        </div>

        <p className="mt-6 text-center text-2xs text-faint">
          Un souci pour te connecter ? Écris à l&apos;équipe Aldo.
        </p>
      </div>
    </main>
  );
}
