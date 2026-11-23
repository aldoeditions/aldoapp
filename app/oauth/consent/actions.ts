"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

/**
 * Décisions de consentement OAuth. L'utilisateur doit être un compte admin
 * (seuls Louison et Charley autorisent le connecteur). On délègue à Supabase
 * Auth (approbation/refus), puis on renvoie vers le client OAuth.
 */

async function assertAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Seul un compte administrateur peut autoriser le connecteur.");
}

export async function approveConsent(authorizationId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin();
    const supabase = createClient();
    const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId, {
      skipBrowserRedirect: true,
    });
    if (error || !data?.redirect_url) return { error: error?.message ?? "Approbation impossible." };
    redirect(data.redirect_url);
  } catch (e) {
    // redirect() lève une exception de contrôle de flux Next : on la relaie.
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    if (isNextRedirect(e)) throw e;
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
  return {};
}

export async function denyConsent(authorizationId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin();
    const supabase = createClient();
    const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId, {
      skipBrowserRedirect: true,
    });
    if (error || !data?.redirect_url) return { error: error?.message ?? "Refus impossible." };
    redirect(data.redirect_url);
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
  return {};
}

/** redirect() de Next lève un objet portant `digest = "NEXT_REDIRECT;..."`. */
function isNextRedirect(e: unknown): boolean {
  return typeof e === "object" && e !== null && "digest" in e && typeof (e as { digest: unknown }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}
