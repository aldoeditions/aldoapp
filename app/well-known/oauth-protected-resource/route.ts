import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from "mcp-handler";
import { supabaseIssuer } from "@/lib/mcp/config";

// Métadonnée RFC 9728 : publiée au chemin /.well-known/oauth-protected-resource
// (réécriture dans next.config.mjs). Déclare l'issuer Supabase comme serveur
// d'autorisation. `resource` est dérivé de la requête par le handler.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GET = protectedResourceHandler({ authServerUrls: [supabaseIssuer()] });
const OPTIONS = metadataCorsOptionsRequestHandler();

export { GET, OPTIONS };
