import "server-only";
import { createBearerClient } from "@/lib/supabase/bearer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { McpPrincipal } from "@/lib/mcp/auth";

/**
 * Forme minimale du contexte passé aux handlers d'outils par mcp-handler.
 * L'AuthInfo vérifié (verifyMcpToken) est posé dans ctx.http.authInfo.
 */
export type ToolCtx = {
  http?: {
    authInfo?: {
      clientId?: string;
      extra?: { principal?: McpPrincipal };
    };
  };
};

export type ToolSession = {
  principal: McpPrincipal;
  clientId?: string;
  /** Client Supabase scopé à l'utilisateur (RLS appliquée). */
  supabase: ReturnType<typeof createBearerClient>;
  /** Client service_role : Storage + IBAN uniquement. */
  admin: ReturnType<typeof createAdminClient>;
};

/** Extrait le principal vérifié et prépare les clients. Lève si absent. */
export function sessionFromCtx(ctx: ToolCtx): ToolSession {
  const principal = ctx.http?.authInfo?.extra?.principal;
  if (!principal) throw new Error("Session MCP non authentifiée.");
  return {
    principal,
    clientId: ctx.http?.authInfo?.clientId,
    supabase: createBearerClient(principal.accessToken),
    admin: createAdminClient(),
  };
}
