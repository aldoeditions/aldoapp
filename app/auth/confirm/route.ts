import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Point d'atterrissage des liens e-mail Supabase (réinitialisation de mot de
 * passe, lien magique, confirmation). Échange le jeton contre une session
 * (cookies) puis redirige vers `next`.
 *
 * Deux formats gérés :
 *  - token_hash + type  → verifyOtp (recommandé côté serveur, cf. templates)
 *  - code               → exchangeCodeForSession (flux PKCE)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // `next` doit rester une route interne (anti open-redirect).
  const rawNext = searchParams.get("next") || "/portail";
  const next = rawNext.startsWith("/") ? rawNext : "/portail";

  const successUrl = new URL(next, request.url);
  const errorUrl = new URL("/portail/login", request.url);
  errorUrl.searchParams.set("error", "link");

  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.redirect(successUrl);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return response;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(errorUrl);
}
