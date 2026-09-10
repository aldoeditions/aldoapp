"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/Badge";
import { TASK_STATUSES, TASK_PRIORITY } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import { updateTaskStatus } from "@/app/(app)/projet/actions";
import { AssigneeAvatar, StatusSelect } from "./bits";
import { TaskDetail } from "./TaskDetail";
import type { ProfileLite, TaskWithRefs } from "@/lib/data/tasks";

export function TaskViews({
  tasks,
  profiles,
  drops,
  view,
}: {
  tasks: TaskWithRefs[];
  profiles: ProfileLite[];
  drops: { id: string; name: string }[];
  view: "liste" | "kanban";
}) {
  const [selected, setSelected] = useState<TaskWithRefs | null>(null);

  return (
    <>
      {view === "kanban" ? (
        <BoardView tasks={tasks} onOpen={setSelected} />
      ) : (
        <ListView tasks={tasks} onOpen={setSelected} />
      )}
      <TaskDetail
        task={selected}
        profiles={profiles}
        drops={drops}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

/* ------------------------------- Liste ------------------------------- */

function ListView({ tasks, onOpen }: { tasks: TaskWithRefs[]; onOpen: (t: TaskWithRefs) => void }) {
  if (tasks.length === 0) {
    return <p className="rounded-xl border border-border bg-surface py-10 text-center text-sm text-faint">Aucune tâche.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
              <th className="px-5 py-2.5 font-semibold">Tâche</th>
              <th className="px-3 py-2.5 font-semibold">Assigné</th>
              <th className="px-3 py-2.5 font-semibold">Campagne</th>
              <th className="px-3 py-2.5 font-semibold">Échéance</th>
              <th className="px-3 py-2.5 font-semibold">Priorité</th>
              <th className="px-5 py-2.5 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} onClick={() => onOpen(t)} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-bg">
                <td className="px-5 py-3 font-medium text-text">{t.title}</td>
                <td className="px-3 py-3">
                  <AssigneeAvatar initials={t.assignee?.avatar_initials} name={t.assignee?.display_name} />
                </td>
                <td className="px-3 py-3 text-muted">{t.drop_name ?? "—"}</td>
                <td className="px-3 py-3 text-muted">{t.due_date ? dateCourte(t.due_date) : "—"}</td>
                <td className="px-3 py-3">{t.priority ? <StatusBadge value={t.priority} dict={TASK_PRIORITY} /> : <span className="text-faint">—</span>}</td>
                <td className="px-5 py-3"><StatusSelect id={t.id} status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------- Kanban ------------------------------ */

function BoardView({ tasks, onOpen }: { tasks: TaskWithRefs[]; onOpen: (t: TaskWithRefs) => void }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [dragOver, setDragOver] = useState<string | null>(null);

  function drop(status: string, id: string) {
    setDragOver(null);
    start(async () => {
      await updateTaskStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.value); }}
            onDragLeave={() => setDragOver((d) => (d === col.value ? null : d))}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/task"); if (id) drop(col.value, id); }}
            className={cn(
              "rounded-xl border bg-bg/60 p-3 transition-colors",
              dragOver === col.value ? "border-accent bg-accentBg/40" : "border-border",
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted">{col.label}</span>
              <span className="text-2xs text-faint">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                  onClick={() => onOpen(t)}
                  className="cursor-pointer rounded-lg border border-border bg-surface p-3 shadow-card transition-shadow hover:shadow-float"
                >
                  <p className="text-sm font-medium text-text">{t.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <AssigneeAvatar initials={t.assignee?.avatar_initials} name={t.assignee?.display_name} />
                    <div className="flex items-center gap-2">
                      {t.priority && <StatusBadge value={t.priority} dict={TASK_PRIORITY} />}
                      {t.due_date && <span className="text-2xs text-faint">{dateCourte(t.due_date)}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="px-1 py-3 text-center text-2xs text-faint">—</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
