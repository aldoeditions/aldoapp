"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Checklist d'accueil créée quand un artiste passe « signé » (ou à la main). */
const ONBOARDING_TASKS: { title: string; priority: string }[] = [
  { title: "Générer le contrat", priority: "haute" },
  { title: "Demander la bio et la photo à l'artiste", priority: "normale" },
  { title: "Demander les visuels HD à l'artiste", priority: "haute" },
  { title: "Envoyer le contrat à signer", priority: "normale" },
  { title: "Contre-signer le contrat (Aldo)", priority: "normale" },
  { title: "Classer le contrat signé (Drive + app)", priority: "basse" },
];

/**
 * Crée la checklist d'accueil d'un artiste (tâches liées à l'artist_id,
 * assignées à l'utilisateur courant). Idempotent : ne recrée pas une tâche
 * (même titre) déjà présente pour cet artiste.
 */
export async function createOnboardingTasks(
  artistId: string,
): Promise<{ created: number; error?: string }> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();

    const { data: artist } = await supabase
      .from("artists")
      .select("name")
      .eq("id", artistId)
      .maybeSingle();
    const artistName = artist?.name ?? "artiste";

    const { data: existing } = await supabase
      .from("tasks")
      .select("title")
      .eq("artist_id", artistId);
    const seen = new Set((existing ?? []).map((t) => t.title));

    const rows: TablesInsert<"tasks">[] = ONBOARDING_TASKS.map((t) => ({
      title: `${t.title} — ${artistName}`,
      priority: t.priority,
      artist_id: artistId,
      status: "à faire",
      assignee_id: user.id,
      created_by_id: user.id,
    })).filter((r) => !seen.has(r.title));
    if (rows.length === 0) return { created: 0 };

    const { error } = await supabase.from("tasks").insert(rows);
    if (error) return { created: 0, error: error.message };

    revalidatePath("/projet");
    revalidatePath("/");
    revalidatePath(`/artistes/${artistId}`);
    return { created: rows.length };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : "Erreur." };
  }
}

/* ------- Automatisation : drop terminé → relevé + commission par artiste ------- */

const DROP_COMPLETION_TASKS: { title: string; priority: string }[] = [
  { title: "Établir le relevé des ventes", priority: "haute" },
  { title: "Verser la commission", priority: "normale" },
];

/**
 * Quand un drop passe « terminé » : pour chaque artiste ayant une œuvre dans ce
 * drop, crée « Établir le relevé des ventes — X (Drop) » et « Verser la
 * commission — X (Drop) ». Idempotent (dedup titre + artiste + drop).
 */
export async function createDropCompletionTasks(
  dropId: string,
): Promise<{ created: number; error?: string }> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();

    const { data: drop } = await supabase
      .from("drops")
      .select("name")
      .eq("id", dropId)
      .maybeSingle();
    const dropName = drop?.name ?? "drop";

    const { data: oeuvres } = await supabase
      .from("oeuvres")
      .select("artist_id, artists(name)")
      .eq("drop_id", dropId);

    const artistsMap = new Map<string, string>();
    for (const o of oeuvres ?? []) {
      const row = o as { artist_id: string | null; artists: { name: string } | null };
      if (row.artist_id) artistsMap.set(row.artist_id, row.artists?.name ?? "artiste");
    }
    if (artistsMap.size === 0) return { created: 0 };

    const artistIds = Array.from(artistsMap.keys());
    const { data: existing } = await supabase
      .from("tasks")
      .select("title, artist_id")
      .in("artist_id", artistIds)
      .eq("drop_id", dropId);
    const seen = new Set((existing ?? []).map((t) => `${t.artist_id}|${t.title}`));

    const rows: TablesInsert<"tasks">[] = [];
    for (const [artistId, artistName] of Array.from(artistsMap.entries())) {
      for (const t of DROP_COMPLETION_TASKS) {
        const title = `${t.title} — ${artistName} (${dropName})`;
        if (seen.has(`${artistId}|${title}`)) continue;
        rows.push({
          title,
          priority: t.priority,
          artist_id: artistId,
          drop_id: dropId,
          status: "à faire",
          assignee_id: user.id,
          created_by_id: user.id,
        });
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

/* ------- Automatisation : fiches artistes incomplètes → « Compléter la fiche » ------- */

/**
 * Pour chaque artiste actif dont il manque la bio ou la photo, crée
 * « Compléter la fiche de X ». Idempotent (dedup titre + artiste).
 * Déclenché à la main depuis le tableau de bord.
 */
export async function createMissingDataTasks(): Promise<{ created: number; error?: string }> {
  try {
    const user = await assertCanEdit();
    const supabase = createClient();

    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, bio, avatar_url")
      .eq("phase", "actif");
    const incomplete = (artists ?? []).filter((a) => !a.bio || !a.avatar_url);
    if (incomplete.length === 0) return { created: 0 };

    const ids = incomplete.map((a) => a.id);
    const { data: existing } = await supabase
      .from("tasks")
      .select("title, artist_id")
      .in("artist_id", ids);
    const seen = new Set((existing ?? []).map((t) => `${t.artist_id}|${t.title}`));

    const rows = incomplete
      .map((a) => ({
        title: `Compléter la fiche de ${a.name}`,
        priority: "normale",
        artist_id: a.id,
        status: "à faire",
        assignee_id: user.id,
        created_by_id: user.id,
      }))
      .filter((r) => !seen.has(`${r.artist_id}|${r.title}`)) as TablesInsert<"tasks">[];
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

/* ------- Automatisation : fichier déposé au portail → « Valider le fichier de X » ------- */

/**
 * Crée « Valider le fichier de X — fichier.ext » quand un artiste dépose un
 * fichier. Appelée depuis le portail (contexte artiste) → client admin pour
 * franchir la RLS ; tâche non assignée (l'équipe se la répartit). Idempotent.
 */
export async function createFileReviewTask(input: {
  artistId: string;
  filename: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: artist } = await admin
    .from("artists")
    .select("name")
    .eq("id", input.artistId)
    .maybeSingle();
  const artistName = artist?.name ?? "artiste";
  const title = `Valider le fichier de ${artistName} — ${input.filename}`;

  const { data: existing } = await admin
    .from("tasks")
    .select("id")
    .eq("artist_id", input.artistId)
    .eq("title", title)
    .maybeSingle();
  if (existing) return;

  await admin
    .from("tasks")
    .insert({ title, priority: "haute", artist_id: input.artistId, status: "à faire" } as TablesInsert<"tasks">);

  revalidatePath("/projet");
  revalidatePath("/");
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
