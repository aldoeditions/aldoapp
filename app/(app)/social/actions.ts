"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { SOCIAL_VISUAL_LEAD_DAYS } from "@/lib/constants";
import { visualDueDate } from "@/lib/social";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export type SocialState = { error: string | null; ok?: boolean };

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "social")) throw new Error("Accès refusé : droits insuffisants.");
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
    caption: str(fd, "caption"),
    post_date: str(fd, "post_date"),
    status: str(fd, "status") ?? "en préparation",
    format: str(fd, "format"),
    drive_link: str(fd, "drive_link"),
    drop_id: str(fd, "drop_id"),
  };
}

type PostForSync = {
  id: string;
  title: string;
  post_date: string;
  status: string;
  drop_id: string | null;
};

/**
 * Synchronise la tâche « Créer le visuel du post » liée à un post : la crée si
 * absente, met à jour titre / échéance (date − 7 j) / campagne, et la termine
 * automatiquement quand le post passe « prêt à poster »/« posté » (réouverte
 * sinon). Idempotent (une tâche par post via social_post_id).
 */
async function syncVisualTask(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  post: PostForSync,
) {
  const title = `Créer le visuel du post — ${post.title}`;
  const due = visualDueDate(post.post_date, SOCIAL_VISUAL_LEAD_DAYS);
  const done = post.status === "prêt à poster" || post.status === "posté";

  const { data: existing } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("social_post_id", post.id)
    .maybeSingle();

  if (existing) {
    const nextStatus = done ? "terminé" : existing.status === "terminé" ? "à faire" : existing.status;
    await supabase
      .from("tasks")
      .update({ title, due_date: due, drop_id: post.drop_id, status: nextStatus })
      .eq("id", existing.id);
  } else {
    await supabase.from("tasks").insert({
      title,
      status: done ? "terminé" : "à faire",
      priority: "normale",
      assignee_id: userId,
      created_by_id: userId,
      drop_id: post.drop_id,
      social_post_id: post.id,
      due_date: due,
    } as TablesInsert<"tasks">);
  }
}

export async function createSocialPost(fd: FormData): Promise<SocialState> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();
    const fields = fieldsFrom(fd);
    if (!fields.title) return { error: "Le titre est obligatoire." };
    if (!fields.post_date) return { error: "La date de post est obligatoire." };

    const { data, error } = await supabase
      .from("social_posts")
      .insert({ ...fields, created_by_id: user.id } as TablesInsert<"social_posts">)
      .select("id, title, post_date, status, drop_id")
      .single();
    if (error) return { error: error.message };

    // Automatisation : tâche « Créer le visuel » (non bloquante).
    try {
      await syncVisualTask(supabase, user.id, data);
    } catch {
      /* le post reste valide même si la tâche échoue */
    }

    revalidatePath("/social");
    revalidatePath("/projet");
    revalidatePath("/");
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function updateSocialPost(id: string, fd: FormData): Promise<SocialState> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();
    const fields = fieldsFrom(fd);
    if (!fields.title) return { error: "Le titre est obligatoire." };
    if (!fields.post_date) return { error: "La date de post est obligatoire." };

    const { error } = await supabase
      .from("social_posts")
      .update({ ...fields, updated_at: new Date().toISOString() } as TablesUpdate<"social_posts">)
      .eq("id", id);
    if (error) return { error: error.message };

    try {
      await syncVisualTask(supabase, user.id, {
        id,
        title: fields.title,
        post_date: fields.post_date,
        status: fields.status,
        drop_id: fields.drop_id,
      });
    } catch {
      /* non bloquant */
    }

    revalidatePath("/social");
    revalidatePath("/projet");
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Change rapidement le statut d'un post (liste / calendrier) + sync la tâche. */
export async function updateSocialStatus(id: string, status: string) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { data: post, error } = await supabase
    .from("social_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, title, post_date, status, drop_id")
    .single();
  if (error) throw error;
  try {
    await syncVisualTask(supabase, user.id, post);
  } catch {
    /* non bloquant */
  }
  revalidatePath("/social");
  revalidatePath("/projet");
}

export async function deleteSocialPost(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  // La tâche liée est supprimée en cascade (FK social_post_id).
  const { error } = await supabase.from("social_posts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/social");
  revalidatePath("/projet");
}
