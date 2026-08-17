import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-form";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — Aldo Éditions",
};

export default async function ResetPasswordPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=link");

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-9 text-accent" />
          <p className="eyebrow mt-4">Administration</p>
          <p className="mt-2 text-sm text-muted">
            Choisis un nouveau mot de passe pour ton compte.
          </p>
        </div>

        <div className="card p-6">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
