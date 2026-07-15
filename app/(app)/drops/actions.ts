"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import type {
  TablesInsert,
  TablesUpdate,
  OeuvreFormat,
} from "@/types/database";

const BUCKET = "artist-assets";

export type FormState = { error: string | null; ok?: boolean };

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "drops")) {
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

/* ------------------------------- DROPS ------------------------------- */

export async function saveDrop(
  id: string | null,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  let targetId = id;
  try {
    await assertCanEdit();
    const supabase = createClient();

    const fields = {
      name: str(fd, "name") ?? "",
      status: str(fd, "status") ?? "à venir",
      start_date: str(fd, "start_date") ?? "",
      end_date: str(fd, "end_date") ?? "",
      objectif_ca: num(fd, "objectif_ca"),
      notes: str(fd, "notes"),
    };
    if (!fields.name) return { error: "Le nom du drop est obligatoire." };
    if (!fields.start_date || !fields.end_date)
      return { error: "Les dates de début et de fin sont obligatoires." };

    if (targetId) {
      const { error } = await supabase
        .from("drops")
        .update(fields as TablesUpdate<"drops">)
        .eq("id", targetId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("drops")
        .insert(fields as TablesInsert<"drops">)
        .select("id")
        .single();
      if (error) throw error;
      targetId = data.id;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }

  revalidatePath("/drops");
  revalidatePath(`/drops/${targetId}`);
  redirect(`/drops/${targetId}`);
}

export async function deleteDrop(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("drops").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/drops");
  redirect("/drops");
}

/**
 * Réapplique les coûts unitaires ACTUELS (params) aux œuvres du drop.
 * Met à jour cout_impression / cout_packaging de chaque œuvre selon son format
 * → le P&L du drop reflète les coûts à jour. À réserver aux drops non terminés.
 */
export async function reapplyDropCosts(dropId: string) {
  await assertCanEdit();
  const supabase = createClient();

  const { data: paramRows } = await supabase
    .from("params")
    .select("type, format, valeur");
  const impression: Record<string, number> = {};
  const packaging: Record<string, number> = {};
  for (const r of paramRows ?? []) {
    if (r.type === "Impression") impression[r.format] = r.valeur ?? 0;
    else if (r.type === "Packaging") packaging[r.format] = r.valeur ?? 0;
  }

  const { data: oeuvres } = await supabase
    .from("oeuvres")
    .select("id, format")
    .eq("drop_id", dropId);

  for (const o of oeuvres ?? []) {
    await supabase
      .from("oeuvres")
      .update({
        cout_impression: impression[o.format] ?? null,
        cout_packaging: packaging[o.format] ?? null,
      })
      .eq("id", o.id);
  }

  revalidatePath(`/drops/${dropId}`);
  revalidatePath("/finances");
  revalidatePath(`/finances/${dropId}`);
}

/* ------------------------------ ŒUVRES ------------------------------ */

async function uploadVisuel(oeuvreId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `oeuvres/${oeuvreId}/visuel-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) throw error;
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function oeuvreFieldsFrom(fd: FormData, dropId: string) {
  return {
    name: str(fd, "name") ?? "",
    artist_id: str(fd, "artist_id") ?? "",
    drop_id: dropId,
    format: (str(fd, "format") ?? "A3") as OeuvreFormat,
    price: num(fd, "price") ?? 0,
    cout_impression: num(fd, "cout_impression"),
    cout_packaging: num(fd, "cout_packaging"),
    status: str(fd, "status") ?? "brouillon",
  };
}

export async function saveOeuvre(
  id: string | null,
  dropId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const fields = oeuvreFieldsFrom(fd, dropId);
    if (!fields.name) return { error: "Le nom de l'œuvre est obligatoire." };
    if (!fields.artist_id) return { error: "Sélectionne un artiste." };

    let targetId = id;
    if (targetId) {
      const update: TablesUpdate<"oeuvres"> = { ...fields };
      const visuel = fd.get("visuel");
      if (visuel instanceof File && visuel.size > 0) {
        const url = await uploadVisuel(targetId, visuel);
        if (url) update.file_url = url;
      }
      const { error } = await supabase
        .from("oeuvres")
        .update(update)
        .eq("id", targetId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("oeuvres")
        .insert(fields as TablesInsert<"oeuvres">)
        .select("id")
        .single();
      if (error) throw error;
      targetId = data.id;

      const visuel = fd.get("visuel");
      if (visuel instanceof File && visuel.size > 0) {
        const url = await uploadVisuel(targetId, visuel);
        if (url) {
          await supabase
            .from("oeuvres")
            .update({ file_url: url })
            .eq("id", targetId);
        }
      }
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }

  revalidatePath(`/drops/${dropId}`);
  return { error: null, ok: true };
}

export async function deleteOeuvre(id: string, dropId: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("oeuvres").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/drops/${dropId}`);
}
