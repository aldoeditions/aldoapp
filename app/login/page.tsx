import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { ForgotPassword } from "./forgot-password";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Connexion — Aldo Éditions",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  const notice =
    searchParams.error === "link"
      ? "Ce lien est invalide ou expiré. Redemande un lien de réinitialisation ci-dessous."
      : undefined;

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
          {notice && (
            <p className="mb-4 rounded-lg bg-warningBg px-3 py-2 text-sm text-warning">{notice}</p>
          )}
          <LoginForm redirectTo={searchParams.redirect ?? "/"} />
          <ForgotPassword />
        </div>

        <p className="mt-6 text-center text-2xs text-faint">
          Aldo Éditions · espace réservé à l’équipe
        </p>
      </div>
    </main>
  );
}
