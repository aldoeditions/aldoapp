import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** Routes accessibles sans session. */
const PUBLIC_PATHS = ["/login", "/auth", "/portail/login"];

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes.
 * Appelé depuis `middleware.ts`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isPortal = pathname.startsWith("/portail");

  // Non connecté sur une route protégée → login de la bonne zone.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = isPortal ? "/portail/login" : "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Déjà connecté sur une page de login → sortie (le rôle sera résolu par les layouts).
  if (user && (pathname === "/login" || pathname === "/portail/login")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/portail") ? "/portail" : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
