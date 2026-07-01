import type { Metadata } from "next";
import { LoginForm } from "./login-form";

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
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Administration</p>
          <h1 className="font-serif text-3xl tracking-tight text-text">
            Aldo Éditions
          </h1>
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
