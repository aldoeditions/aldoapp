import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asRole, canView, type ModuleKey, type Role } from "@/lib/auth/permissions";
import type { Profile } from "@/types/database";

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile | null;
  role: Role;
};

/**
 * Récupère l'utilisateur courant + son profil (rôle).
 * Renvoie `null` si non connecté.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    role: asRole(profile?.role),
  };
}

/**
 * Exige une session ; redirige vers /login sinon.
 * À utiliser dans les layouts/pages protégés.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Exige une session ET l'accès (lecture/écriture) à un module donné.
 * Redirige vers /login si non connecté, vers l'accueil si non autorisé.
 */
export async function requireModule(mod: ModuleKey): Promise<SessionUser> {
  const user = await requireUser();
  if (!canView(user.role, mod)) redirect("/");
  return user;
}
