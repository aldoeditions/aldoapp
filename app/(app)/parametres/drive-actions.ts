"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { decryptSensitive } from "@/lib/crypto";
import { revokeGoogleToken, clearDriveTokenCache } from "@/lib/gdrive/auth";

/**
 * Déconnecte Google Drive : révoque le refresh token côté Google (best-effort
 * — un token déjà expiré/révoqué ne doit pas empêcher de nettoyer l'app), puis
 * efface la connexion dans `company_settings`. Admin uniquement.
 */
export async function disconnectGoogleDrive(): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!canEdit(user.role, "parametres")) return { error: "Accès refusé." };

  const supabase = createClient();
  const admin = createAdminClient();
  const { data } = await admin
    .from("company_settings")
    .select("google_drive_refresh_token_enc")
    .eq("id", 1)
    .maybeSingle();
  const refreshToken = decryptSensitive(data?.google_drive_refresh_token_enc ?? null);
  if (refreshToken) await revokeGoogleToken(refreshToken);
  clearDriveTokenCache();

  const { error } = await supabase
    .from("company_settings")
    .update({ google_drive_refresh_token_enc: null, google_drive_connected_email: null, google_drive_connected_at: null })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/parametres");
  return {};
}
