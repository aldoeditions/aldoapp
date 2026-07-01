import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase « admin » (service_role) — SERVEUR UNIQUEMENT.
 *
 * Contourne RLS. À n'utiliser que dans des Server Actions/Route Handlers
 * déjà protégés (session + rôle), pour des opérations privilégiées :
 * upload Storage, tâches de maintenance, etc. Ne JAMAIS l'importer côté client.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant dans l'environnement.");
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
