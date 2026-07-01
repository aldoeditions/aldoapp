/**
 * Matrice de permissions par rôle — Aldo Éditions.
 *
 * Rôles : admin (Louison) · marketing (Tom) · creatif (Charley).
 * À AJUSTER avec l'équipe : ce sont des valeurs par défaut raisonnables.
 *   - admin    : accès total
 *   - marketing: pipeline + produit + lecture finances, pas les paramètres
 *   - creatif  : pipeline + produit (œuvres/fichiers), pas de finances
 */

export type Role = "admin" | "marketing" | "creatif";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  marketing: "Marketing",
  creatif: "Créatif",
};

/** Clés des modules (= segments de route). */
export type ModuleKey =
  | "dashboard"
  | "prospection"
  | "artistes"
  | "drops"
  | "commandes"
  | "finances"
  | "charges"
  | "parametres";

/** Niveau d'accès par module : aucun, lecture seule, ou édition. */
export type Access = "none" | "read" | "write";

const ALL_WRITE: Record<ModuleKey, Access> = {
  dashboard: "write",
  prospection: "write",
  artistes: "write",
  drops: "write",
  commandes: "write",
  finances: "write",
  charges: "write",
  parametres: "write",
};

export const ROLE_ACCESS: Record<Role, Record<ModuleKey, Access>> = {
  admin: { ...ALL_WRITE },
  marketing: {
    dashboard: "write",
    prospection: "write",
    artistes: "write",
    drops: "write",
    commandes: "write",
    finances: "read",
    charges: "read",
    parametres: "none",
  },
  creatif: {
    dashboard: "read",
    prospection: "write",
    artistes: "write",
    drops: "write",
    commandes: "read",
    finances: "none",
    charges: "none",
    parametres: "none",
  },
};

const FALLBACK_ROLE: Role = "creatif";

export function asRole(role: string | null | undefined): Role {
  return role === "admin" || role === "marketing" || role === "creatif"
    ? role
    : FALLBACK_ROLE;
}

/** Niveau d'accès d'un rôle sur un module. */
export function accessFor(role: string | null | undefined, mod: ModuleKey): Access {
  return ROLE_ACCESS[asRole(role)][mod];
}

/** Le module est-il visible (lecture ou édition) ? */
export function canView(role: string | null | undefined, mod: ModuleKey): boolean {
  return accessFor(role, mod) !== "none";
}

/** Le rôle peut-il éditer ce module ? */
export function canEdit(role: string | null | undefined, mod: ModuleKey): boolean {
  return accessFor(role, mod) === "write";
}
