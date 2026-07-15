"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export type ForgotState = { error: string | null; sent?: boolean };

/** Base URL publique (prod) ou origine de la requête (local/preview). */
function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Renseigne ton adresse e-mail." };

  // Flux « implicit » : le lien renverra les jetons dans le fragment d'URL,
  // consommés côté navigateur par /auth/callback. Indépendant de l'appareil
  // (pas de code_verifier requis), et compatible avec le template par défaut.
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
  );
  const redirectTo = `${siteOrigin()}/auth/callback?next=/portail/reset-password`;
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Réponse volontairement neutre (pas de fuite sur l'existence du compte).
  return { error: null, sent: true };
}

export async function loginPortal(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Identifiants invalides. Réessaie." };
  }

  // Le layout du portail vérifiera le rôle artiste et la liaison.
  redirect("/portail");
}
