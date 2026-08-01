import { createClient } from "@/lib/supabase/server";
import type { Task, TaskComment } from "@/types/database";

export type ProfileLite = {
  id: string;
  display_name: string | null;
  avatar_initials: string | null;
};

export type TaskWithRefs = Task & {
  assignee: { display_name: string | null; avatar_initials: string | null } | null;
  drop_name: string | null;
};

export type TaskFilter = { assignee?: string; status?: string; mine?: string };

const SELECT =
  "*, assignee:profiles!assignee_id(display_name, avatar_initials), drops(name)";

function flatten(rows: unknown[]): TaskWithRefs[] {
  return (rows ?? []).map((r) => {
    const { drops, ...rest } = r as Task & {
      assignee: { display_name: string | null; avatar_initials: string | null } | null;
      drops: { name: string } | null;
    };
    return { ...rest, drop_name: drops?.name ?? null };
  });
}

/** Toutes les tâches (filtrables par assigné / statut). */
export async function getTasks(filter: TaskFilter = {}): Promise<TaskWithRefs[]> {
  const supabase = createClient();
  let q = supabase.from("tasks").select(SELECT);
  if (filter.assignee) q = q.eq("assignee_id", filter.assignee);
  if (filter.status) q = q.eq("status", filter.status);
  q = q.order("created_at", { ascending: false });
  const { data } = await q;
  return flatten((data ?? []) as unknown[]);
}

/** Profils de l'équipe admin (pour l'assignation et les filtres). */
export async function getAdminProfiles(): Promise<ProfileLite[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_initials")
    .eq("role", "admin")
    .order("display_name", { ascending: true });
  return (data ?? []) as ProfileLite[];
}

export type TaskCommentWithAuthor = TaskComment & {
  author: { display_name: string | null; avatar_initials: string | null } | null;
};

/** Détail d'une tâche + ses commentaires (auteur = profil). */
export async function getTaskDetail(id: string): Promise<{
  task: TaskWithRefs | null;
  comments: TaskCommentWithAuthor[];
}> {
  const supabase = createClient();
  const [taskRes, commentsRes] = await Promise.all([
    supabase.from("tasks").select(SELECT).eq("id", id).maybeSingle(),
    supabase
      .from("task_comments")
      .select("*, author:profiles!author_id(display_name, avatar_initials)")
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
  ]);
  const task = taskRes.data ? flatten([taskRes.data])[0] : null;
  return { task, comments: (commentsRes.data ?? []) as TaskCommentWithAuthor[] };
}

/** Tâches ouvertes assignées à un profil (dashboard « Actions requises »). */
export async function getMyOpenTasks(profileId: string): Promise<TaskWithRefs[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("assignee_id", profileId)
    .neq("status", "terminé")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  return flatten((data ?? []) as unknown[]);
}
