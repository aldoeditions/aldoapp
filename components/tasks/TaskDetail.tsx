"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/Badge";
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { addComment, deleteTask } from "@/app/(app)/projet/actions";
import { TaskFormButton } from "./TaskFormButton";
import { AssigneeAvatar } from "./bits";
import type { ProfileLite, TaskWithRefs } from "@/lib/data/tasks";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_legacy: string | null;
  author: { display_name: string | null; avatar_initials: string | null } | null;
};

export function TaskDetail({
  task,
  profiles,
  drops,
  open,
  onClose,
}: {
  task: TaskWithRefs | null;
  profiles: ProfileLite[];
  drops: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pending, start] = useTransition();

  const load = useCallback(async () => {
    if (!task) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("task_comments")
      .select("id, body, created_at, author_legacy, author:profiles!author_id(display_name, avatar_initials)")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true });
    setComments((data as unknown as Comment[]) ?? []);
  }, [task]);

  useEffect(() => {
    if (open && task) load();
  }, [open, task, load]);

  if (!task) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Détail de la tâche">
      <div className="space-y-5 px-5 py-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-lg text-text">{task.title}</h3>
            <StatusBadge value={task.status} dict={TASK_STATUS} />
          </div>
          {task.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{task.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-bg px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <AssigneeAvatar initials={task.assignee?.avatar_initials} name={task.assignee?.display_name} />
            <span className="text-muted">{task.assignee?.display_name ?? "Non assigné"}</span>
          </div>
          <div className="text-muted">Campagne : <span className="text-text">{task.drop_name ?? "—"}</span></div>
          <div className="text-muted">Échéance : <span className="text-text">{task.due_date ? dateCourte(task.due_date) : "—"}</span></div>
          <div className="text-muted">Priorité : {task.priority ? <StatusBadge value={task.priority} dict={TASK_PRIORITY} /> : <span className="text-text">—</span>}</div>
        </div>

        <div className="flex items-center gap-3">
          <TaskFormButton profiles={profiles} drops={drops} task={task} variant="secondary" label="Modifier" onSaved={onClose} />
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Supprimer cette tâche ?")) {
                start(async () => {
                  await deleteTask(task.id);
                  onClose();
                  router.refresh();
                });
              }
            }}
            className="text-2xs font-medium text-danger hover:underline disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>

        {/* Commentaires */}
        <div className="border-t border-border pt-4">
          <p className="eyebrow mb-3">Commentaires</p>
          <ul className="space-y-3">
            {comments.length === 0 && <li className="text-2xs text-faint">Aucun commentaire.</li>}
            {comments.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <AssigneeAvatar initials={c.author?.avatar_initials} name={c.author?.display_name ?? c.author_legacy} muted />
                <div className="min-w-0">
                  <p className="text-2xs text-faint">
                    <span className="font-medium text-text">{c.author?.display_name ?? c.author_legacy ?? "—"}</span> · {dateCourte(c.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-text">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              if (!String(fd.get("body") ?? "").trim()) return;
              start(async () => {
                await addComment(task.id, fd);
                form.reset();
                await load();
                router.refresh();
              });
            }}
          >
            <textarea
              name="body"
              rows={2}
              required
              placeholder="Ajouter un commentaire…"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <button type="submit" disabled={pending} className="self-end rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white hover:bg-accentHover disabled:opacity-60">
              {pending ? "…" : "Commenter"}
            </button>
          </form>
        </div>
      </div>
    </Drawer>
  );
}
