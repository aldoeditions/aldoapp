import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-form";
import { Logo, Mascotte } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — Aldo Éditions",
};

export default async function ResetPasswordPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sans session de récupération valide, on renvoie vers la connexion.
  if (!user) redirect("/portail/login?error=link");

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Mascotte className="mb-2 h-24 w-auto" />
          <Logo className="h-8 text-accent" />
          <p className="eyebrow mt-3">Espace artiste</p>
          <p className="mt-2 text-sm text-muted">
            Choisis un nouveau mot de passe pour sécuriser ton espace.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
