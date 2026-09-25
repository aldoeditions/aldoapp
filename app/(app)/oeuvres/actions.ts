"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "drops")) throw new Error("Accès refusé : droits insuffisants.");
}

/** Valide la description d'une œuvre (avec édition éventuelle du texte). */
export async function validateDescription(oeuvreId: string, description: string): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    const supabase = createClient();
    const { error } = await supabase
      .from("oeuvres")
      .update({ description: description.trim() || null, description_status: "validée" })
      .eq("id", oeuvreId);
    if (error) return { error: error.message };
    revalidatePath("/");
    revalidatePath("/oeuvres");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}

/** Renvoie la description à l'artiste pour reprise (repasse « à écrire »). */
export async function sendBackDescription(oeuvreId: string): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    const supabase = createClient();
    const { error } = await supabase
      .from("oeuvres")
      .update({ description_status: "à écrire" })
      .eq("id", oeuvreId);
    if (error) return { error: error.message };
    revalidatePath("/");
    revalidatePath("/oeuvres");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }
}
