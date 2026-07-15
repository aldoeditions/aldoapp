import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  asRole,
  canView,
  isTeam,
  isArtist,
  type ModuleKey,
  type Role,
} from "@/lib/auth/permissions";
import type { Profile } from "@/types/database";

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile | null;
  role: Role;
  /** id de la ligne `artists` liée (si l'utilisateur est un artiste), sinon null. */
  artistId: string | null;
};

/**
 * Récupère l'utilisateur courant + son profil (rôle) + son artiste lié.
 * Renvoie `null` si non connecté.
 *
 * Mémoïsé par requête (React `cache`) : layout + page partagent le même
 * appel (un seul getUser + une seule requête profil par rendu).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
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

  const role = asRole(profile?.role);

  // Résout l'artiste lié uniquement pour un compte artiste.
  let artistId: string | null = null;
  if (role === "artist") {
    const { data: artist } = await supabase
      .from("artists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    artistId = artist?.id ?? null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    role,
    artistId,
  };
});

/** Exige une session ; redirige vers /login sinon. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Exige un membre de l'ÉQUIPE (admin/marketing/creatif).
 * Un artiste connecté est renvoyé vers son portail.
 */
export async function requireTeam(): Promise<SessionUser> {
  const user = await requireUser();
  if (isArtist(user.role)) redirect("/portail");
  if (!isTeam(user.role)) redirect("/login");
  return user;
}

/**
 * Exige un ARTISTE lié. Un membre d'équipe est renvoyé vers l'admin ;
 * un non-connecté vers /portail/login.
 */
export async function requireArtist(): Promise<SessionUser & { artistId: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/portail/login");
  if (isTeam(user.role)) redirect("/");
  if (!isArtist(user.role) || !user.artistId) {
    // Compte artiste non encore lié à une fiche → déconnexion douce.
    redirect("/portail/login?error=unlinked");
  }
  return user as SessionUser & { artistId: string };
}

/**
 * Exige une session ET l'accès à un module admin.
 * Artiste → portail ; membre sans accès → accueil admin.
 */
export async function requireModule(mod: ModuleKey): Promise<SessionUser> {
  const user = await requireUser();
  if (isArtist(user.role)) redirect("/portail");
  if (!canView(user.role, mod)) redirect("/");
  return user;
}
