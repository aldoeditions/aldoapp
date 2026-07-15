"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import type { PackagingItem } from "@/lib/data/params";

export type ParamState = { error: string | null; ok?: boolean };

const round = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Enregistre les coûts d'un format : coût d'impression + postes de packaging.
 * Le total packaging (params.valeur) est recalculé = somme des postes.
 * N'impacte que les FUTURES œuvres (référence) ; les œuvres existantes gardent
 * leur coût enregistré (cf. bouton « Réappliquer » sur les drops).
 */
export async function saveFormatCosts(
  format: string,
  impression: number,
  packaging: PackagingItem[],
): Promise<ParamState> {
  const user = await requireUser();
  if (!canEdit(user.role, "parametres")) return { error: "Accès refusé." };

  const supabase = createClient();
  const clean = packaging.map((p) => ({ name: p.name, valeur: round(p.valeur) }));
  const packTotal = round(clean.reduce((s, p) => s + p.valeur, 0));

  const [r1, r2] = await Promise.all([
    supabase
      .from("params")
      .update({ valeur: round(impression) })
      .eq("type", "Impression")
      .eq("format", format),
    supabase
      .from("params")
      .update({ details: clean, valeur: packTotal })
      .eq("type", "Packaging")
      .eq("format", format),
  ]);

  if (r1.error || r2.error) {
    return { error: (r1.error || r2.error)!.message };
  }

  revalidatePath("/parametres");
  return { error: null, ok: true };
}
