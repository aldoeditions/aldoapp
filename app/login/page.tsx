import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Connexion — Aldo Éditions",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-9 text-accent" />
          <p className="eyebrow mt-4">Administration</p>
          <p className="mt-2 text-sm text-muted">
            Connecte-toi pour accéder au back-office.
          </p>
        </div>

        <div className="card p-6">
          <LoginForm redirectTo={searchParams.redirect ?? "/"} />
        </div>

        <p className="mt-6 text-center text-2xs text-faint">
          Aldo Éditions · espace réservé à l’équipe
        </p>
      </div>
    </main>
  );
}
