import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** Routes accessibles sans session. */
const PUBLIC_PATHS = ["/login", "/auth", "/portail/login"];

/**
 * Rafraîchit la session Supabase et pré-oriente les routes.
 *
 * Robustesse Vercel/Edge : le middleware ne doit JAMAIS pouvoir bloquer
 * (sinon MIDDLEWARE_INVOCATION_TIMEOUT). Si la config manque ou si l'appel
 * Supabase échoue/traîne, on laisse simplement passer — l'authentification
 * reste garantie par les layouts (rendus côté Node via requireUser/…).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse; // config absente → pass-through

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() avec garde-fou de temps : ne bloque jamais le middleware.
  let user = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth-timeout")), 4000),
      ),
    ]);
    user = result.data.user;
  } catch {
    // Échec/timeout réseau → on laisse passer ; les layouts trancheront.
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isPortal = pathname.startsWith("/portail");

  // Non connecté sur une route protégée → login de la bonne zone.
  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isPortal ? "/portail/login" : "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Déjà connecté sur une page de login → sortie (rôle résolu par les layouts).
  if (user && (pathname === "/login" || pathname === "/portail/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.startsWith("/portail") ? "/portail" : "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
