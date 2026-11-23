import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase scopé à un access token OAuth (serveur MCP) — SERVEUR UNIQUEMENT.
 *
 * Le token est posé en en-tête Authorization : la RLS s'applique donc comme
 * pour l'utilisateur qui a autorisé le connecteur. À utiliser pour toutes les
 * lectures/écritures « normales » déclenchées par le MCP. Le client service_role
 * (createAdminClient) reste réservé aux fonctions métier qui en ont déjà besoin
 * (Storage, IBAN pour le calcul des champs manquants…).
 */
export function createBearerClient(accessToken: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
