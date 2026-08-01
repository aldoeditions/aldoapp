"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Select, inputCls, labelCls } from "@/components/ui/form";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { createTask, updateTask } from "@/app/(app)/projet/actions";
import type { ProfileLite, TaskWithRefs } from "@/lib/data/tasks";

export function TaskFormButton({
  profiles,
  drops,
  task,
  variant = "primary",
  label,
  onSaved,
}: {
  profiles: ProfileLite[];
  drops: { id: string; name: string }[];
  task?: TaskWithRefs | null;
  variant?: "primary" | "secondary" | "link";
  label?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(task);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      setError(null);
      const res = editing ? await updateTask(task!.id, fd) : await createTask(fd);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        onSaved?.();
        router.refresh();
      }
    });
  }

  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover"
      : variant === "secondary"
        ? "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:bg-bg"
        : "text-2xs font-medium text-accent hover:underline";

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        {variant === "primary" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        )}
        {label ?? (editing ? "Modifier" : "Nouvelle tâche")}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Modifier la tâche" : "Nouvelle tâche"}>
        {open && (
          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <div>
              <label className={labelCls} htmlFor="title">Titre *</label>
              <input id="title" name="title" defaultValue={task?.title ?? ""} className={inputCls} placeholder="Ex. Valider les fichiers HD" />
            </div>

            <div>
              <label className={labelCls} htmlFor="description">Description</label>
              <textarea id="description" name="description" defaultValue={task?.description ?? ""} rows={3} className={inputCls} placeholder="Détails, contexte…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Assigné à" name="assignee_id" defaultValue={task?.assignee_id ?? ""} placeholder="Non assigné" options={profiles.map((p) => ({ value: p.id, label: p.display_name ?? "—" }))} />
              <Select label="Campagne" name="drop_id" defaultValue={task?.drop_id ?? ""} placeholder="Aucune" options={drops.map((d) => ({ value: d.id, label: d.name }))} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Select label="Statut" name="status" defaultValue={task?.status ?? "à faire"} options={TASK_STATUSES} />
              <Select label="Priorité" name="priority" defaultValue={task?.priority ?? ""} placeholder="—" options={TASK_PRIORITIES} />
              <div>
                <label className={labelCls} htmlFor="due_date">Échéance</label>
                <input id="due_date" name="due_date" type="date" defaultValue={task?.due_date ?? ""} className={inputCls} />
              </div>
            </div>

            {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">{error}</p>}

            <button type="submit" disabled={pending} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover disabled:opacity-60">
              {pending ? "Enregistrement…" : editing ? "Enregistrer" : "Créer la tâche"}
            </button>
          </form>
        )}
      </Drawer>
    </>
  );
}
