import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerAldoTools } from "@/lib/mcp/tools";
import { verifyMcpToken } from "@/lib/mcp/auth";
import { MCP_SERVER_INFO, PROTECTED_RESOURCE_PATH } from "@/lib/mcp/config";

// Rendu PDF (génération de contrats) + accès Supabase : runtime Node, jamais Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Serveur MCP de l'app (connecteur Aldo), monté directement sur /api/mcp.
 * Streamable HTTP, sans état (mcp-handler 2.x ne route pas sur le chemin, donc
 * pas de segment [transport]). Authentifié par OAuth 2.1 (Supabase Auth) :
 * chaque appel doit porter un Bearer valide d'un compte admin, sinon 401 +
 * WWW-Authenticate (RFC 9728) pointant vers la métadonnée de ressource protégée.
 */
const handler = createMcpHandler((server) => registerAldoTools(server), {
  serverInfo: MCP_SERVER_INFO,
});

const authed = withMcpAuth(handler, verifyMcpToken, {
  required: true,
  resourceMetadataPath: PROTECTED_RESOURCE_PATH,
});

export { authed as GET, authed as POST };
