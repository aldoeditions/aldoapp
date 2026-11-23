/**
 * Constantes du serveur MCP de l'app (connecteur Aldo).
 *
 * L'app est à la fois serveur de ressources MCP et s'appuie sur Supabase Auth
 * comme serveur d'autorisation OAuth 2.1. Rien de sensible ici.
 */

/** Chemin RFC 9728 de la métadonnée de ressource protégée. */
export const PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";

/** Chemin monté du serveur MCP. */
export const MCP_PATH = "/api/mcp";

/**
 * Issuer du serveur d'autorisation (Supabase Auth).
 * Doit correspondre au champ `issuer` des métadonnées OAuth de Supabase.
 */
export function supabaseIssuer(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant.");
  return `${url.replace(/\/$/, "")}/auth/v1`;
}

/** Nom et version annoncés au client MCP. */
export const MCP_SERVER_INFO = {
  name: "Aldo Éditions — Administration",
  version: "1.0.0",
} as const;
