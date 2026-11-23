import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { McpPrincipal } from "@/lib/mcp/auth";
import type { Json } from "@/types/database";

export type McpOutcome = "apercu" | "ok" | "refus" | "erreur";

/** Clés de paramètres jamais journalisées (par prudence, même si les outils n'en reçoivent pas). */
const SKIP_PARAM_KEYS = /iban|secu|token|password|secret|signed/i;

/** Ne garde que des paramètres simples et non sensibles. */
function scrubParams(params: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (SKIP_PARAM_KEYS.test(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Écrit une ligne dans mcp_audit_log. N'échoue jamais l'appel MCP : une erreur
 * de journalisation est avalée (on ne bloque pas l'action pour autant).
 */
export async function logMcpCall(entry: {
  principal: McpPrincipal;
  clientId?: string;
  tool: string;
  params?: Record<string, unknown>;
  outcome: McpOutcome;
  affected?: number;
  message?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("mcp_audit_log").insert({
      user_id: entry.principal.userId,
      user_email: entry.principal.email,
      client_id: entry.clientId ?? null,
      tool: entry.tool,
      params: scrubParams(entry.params) as Json,
      outcome: entry.outcome,
      affected: entry.affected ?? 0,
      message: entry.message ?? null,
    });
  } catch {
    // Journal best-effort : ne doit jamais faire échouer l'outil.
  }
}
