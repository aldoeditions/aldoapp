import "server-only";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Contexte MCP résolu depuis le token, transporté dans `AuthInfo.extra` et relu
 * par chaque outil (lib/mcp/context.ts).
 */
export type McpPrincipal = {
  userId: string;
  email: string;
  role: string;
  /** Access token, pour reconstruire un client Supabase scopé à l'utilisateur. */
  accessToken: string;
};

/** Décode (sans vérifier) le payload d'un JWT pour lire exp / client. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Valide le token Bearer auprès de Supabase Auth et exige un compte admin.
 *
 * Renvoie `AuthInfo` si et seulement si le token est valide ET que l'utilisateur
 * a le rôle `admin`. Sinon `undefined` → le serveur répond 401 (RFC 9728), avec
 * l'en-tête WWW-Authenticate pointant vers la métadonnée de ressource protégée.
 *
 * Signature attendue par mcp-handler `withMcpAuth` :
 *   (req, bearerToken?) => Promise<AuthInfo | undefined>
 */
export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  const token = bearerToken?.trim();
  if (!token) return undefined;

  const admin = createAdminClient();

  // 1) Validation du token (appel GoTrue /user avec le JWT fourni).
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return undefined;
  const user = data.user;

  // 2) Exigence de rôle admin (lecture via service_role, fiable).
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return undefined;

  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : undefined;
  const clientId =
    (typeof payload?.client_id === "string" && payload.client_id) ||
    (typeof payload?.azp === "string" && payload.azp) ||
    user.id;

  const principal: McpPrincipal = {
    userId: user.id,
    email: profile.email ?? user.email ?? "",
    role: profile.role,
    accessToken: token,
  };

  return {
    token,
    clientId,
    scopes: [],
    expiresAt: exp,
    extra: { principal },
  };
}
