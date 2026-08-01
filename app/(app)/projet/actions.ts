"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import type { TablesInsert } from "@/types/database";

export type TaskState = { error: string | null; ok?: boolean };

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "projet")) throw new Error("Accès refusé : droits insuffisants.");
  return user;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function fieldsFrom(fd: FormData) {
  return {
    title: str(fd, "title") ?? "",
    description: str(fd, "description"),
    status: str(fd, "status") ?? "à faire",
    priority: str(fd, "priority"),
    assignee_id: str(fd, "assignee_id"),
    drop_id: str(fd, "drop_id"),
    due_date: str(fd, "due_date"),
  };
}

export async function createTask(fd: FormData): Promise<TaskState> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();
    const fields = fieldsFrom(fd);
    if (!fields.title) return { error: "Le titre est obligatoire." };

    const { error } = await supabase
      .from("tasks")
      .insert({ ...fields, created_by_id: user.id } as TablesInsert<"tasks">);
    if (error) return { error: error.message };

    revalidatePath("/projet");
    revalidatePath("/");
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function updateTask(id: string, fd: FormData): Promise<TaskState> {
  try {
    await assertCanEdit();
    const supabase = createClient();
    const fields = fieldsFrom(fd);
    if (!fields.title) return { error: "Le titre est obligatoire." };

    const { error } = await supabase.from("tasks").update(fields).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/projet");
    revalidatePath("/");
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Changement de statut (drag Kanban). */
export async function updateTaskStatus(id: string, status: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw error;
  revalidatePath("/projet");
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/projet");
  revalidatePath("/");
}

/** Ajoute un commentaire (auteur = profil connecté, aucune saisie de nom). */
export async function addComment(taskId: string, fd: FormData): Promise<TaskState> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();
    const body = str(fd, "body");
    if (!body) return { error: "Commentaire vide." };

    const { error } = await supabase
      .from("task_comments")
      .insert({ task_id: taskId, author_id: user.id, body });
    if (error) return { error: error.message };

    revalidatePath("/projet");
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

const LAUNCH_TASKS = [
  "Valider les fichiers HD des artistes",
  "Générer et envoyer les contrats",
  "Préparer les visuels de la boutique",
  "Programmer la communication (newsletter, réseaux)",
  "Vérifier les prix et les marges",
  "Planifier les impressions",
];

/**
 * Génère les tâches de lancement pour chaque campagne active/à venir.
 * Tâches NON assignées par défaut (on se les répartit à la main). Idempotent :
 * ne recrée pas une tâche (même titre + même drop) déjà présente.
 */
export async function generateLaunchTasks(): Promise<{ created: number; error?: string }> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const { data: drops } = await supabase
      .from("drops")
      .select("id, name")
      .in("status", ["à venir", "en cours"]);
    if (!drops || drops.length === 0) return { created: 0 };

    const dropIds = drops.map((d) => d.id);
    const { data: existing } = await supabase
      .from("tasks")
      .select("title, drop_id")
      .in("drop_id", dropIds);
    const seen = new Set((existing ?? []).map((t) => `${t.drop_id}|${t.title}`));

    const rows: TablesInsert<"tasks">[] = [];
    for (const d of drops) {
      for (const title of LAUNCH_TASKS) {
        const full = `${title} — ${d.name}`;
        if (seen.has(`${d.id}|${full}`)) continue;
        rows.push({ title: full, drop_id: d.id, status: "à faire", assignee_id: null });
      }
    }
    if (rows.length === 0) return { created: 0 };

    const { error } = await supabase.from("tasks").insert(rows);
    if (error) return { created: 0, error: error.message };

    revalidatePath("/projet");
    revalidatePath("/");
    return { created: rows.length };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : "Erreur." };
  }
}
