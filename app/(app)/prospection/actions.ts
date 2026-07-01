"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { PIPE_STATUS } from "@/lib/constants";
import type { TablesUpdate } from "@/types/database";

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "prospection")) {
    throw new Error("Accès refusé : droits insuffisants.");
  }
}

/** Déplace un prospect vers une autre étape de pipeline (drag & drop). */
export async function updatePipeStatus(id: string, status: string) {
  await assertCanEdit();
  if (!PIPE_STATUS[status]) throw new Error("Étape invalide.");

  const supabase = createClient();
  const { error } = await supabase
    .from("artists")
    .update({ pipe_status: status })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/prospection");
}

const SUIVI_FIELDS = new Set([
  "kit_impression",
  "visuels",
  "demande_infos",
  "contrat_status",
]);

/** Met à jour un champ de suivi de lancement. */
export async function updateSuiviField(
  id: string,
  field: string,
  value: string,
) {
  await assertCanEdit();
  if (!SUIVI_FIELDS.has(field)) throw new Error("Champ invalide.");

  const supabase = createClient();
  const update = { [field]: value || null } as TablesUpdate<"artists">;
  const { error } = await supabase.from("artists").update(update).eq("id", id);
  if (error) throw error;

  revalidatePath("/prospection");
  revalidatePath(`/artistes/${id}`);
}
