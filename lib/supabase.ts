/**
 * Point d'entrée pratique pour Supabase.
 *
 * On expose les deux fabriques SSR (navigateur / serveur) ainsi qu'un client
 * navigateur prêt à l'emploi. Pour les Server Components / Actions, préférer
 * `createServerClient()` (lecture de la session via cookies).
 *
 *   import { supabase } from "@/lib/supabase";              // composants client
 *   import { createServerClient } from "@/lib/supabase";    // RSC / actions
 */

import { createClient as createBrowserClient } from "@/lib/supabase/client";

export { createClient as createBrowserClient } from "@/lib/supabase/client";
export { createClient as createServerClient } from "@/lib/supabase/server";

/** Client navigateur singleton (usage dans les composants "use client"). */
export const supabase = createBrowserClient();
