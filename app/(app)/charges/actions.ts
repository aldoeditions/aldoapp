"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export type FormState = { error: string | null; ok?: boolean };

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "charges")) {
    throw new Error("Accès refusé : droits insuffisants.");
  }
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function saveCharge(
  id: string | null,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const name = str(fd, "name");
    if (!name) return { error: "Le libellé de la charge est obligatoire." };

    const fields = {
      name,
      type: str(fd, "type") ?? "Fixe",
      categorie: str(fd, "categorie") ?? "Autre",
      montant: num(fd, "montant") ?? 0,
      drop_id: str(fd, "drop_id"),
      notes: str(fd, "notes"),
    };

    if (id) {
      const { error } = await supabase
        .from("charges")
        .update(fields as TablesUpdate<"charges">)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("charges")
        .insert(fields as TablesInsert<"charges">);
      if (error) throw error;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }

  revalidatePath("/charges");
  revalidatePath("/drops");
  return { error: null, ok: true };
}

export async function deleteCharge(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("charges").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/charges");
  revalidatePath("/drops");
}
