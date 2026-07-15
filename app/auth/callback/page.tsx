"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Atterrissage des liens e-mail Supabase avec le template PAR DÉFAUT.
 *
 * Le template par défaut renvoie les jetons dans le fragment d'URL
 * (`#access_token=…&refresh_token=…`), invisible côté serveur. Ce composant
 * client lit ce fragment, pose la session (cookies via le client SSR
 * navigateur), puis redirige vers `next` (par défaut : nouveau mot de passe).
 *
 * Gère aussi le flux PKCE (`?code=…`) au cas où.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);

      const rawNext = url.searchParams.get("next") || "/portail/reset-password";
      const next = rawNext.startsWith("/") ? rawNext : "/portail/reset-password";

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = url.searchParams.get("code");
      const errDesc =
        hash.get("error_description") || url.searchParams.get("error_description");

      try {
        if (errDesc) throw new Error(errDesc);

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          throw new Error("no-token");
        }

        // Rechargement complet : garantit l'envoi des cookies de session.
        window.location.assign(next);
      } catch {
        window.location.assign("/portail/login?error=link");
      }
    };
    run();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted">Connexion en cours…</p>
      </div>
    </main>
  );
}
