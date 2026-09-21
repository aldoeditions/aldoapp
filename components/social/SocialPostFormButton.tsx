"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Select, inputCls, labelCls } from "@/components/ui/form";
import { SOCIAL_STATUSES, SOCIAL_FORMATS, SOCIAL_VISUAL_LEAD_DAYS } from "@/lib/constants";
import { createSocialPost, updateSocialPost } from "@/app/(app)/social/actions";
import type { SocialPostWithRefs } from "@/lib/data/social";

export function SocialPostFormButton({
  drops,
  post,
  defaultDate,
  variant = "primary",
  label,
  className,
}: {
  drops: { id: string; name: string }[];
  post?: SocialPostWithRefs | null;
  defaultDate?: string;
  variant?: "primary" | "secondary" | "link";
  label?: string;
  /** Surcharge le style du bouton déclencheur (ex. puce de calendrier). */
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(post);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      setError(null);
      const res = editing ? await updateSocialPost(post!.id, fd) : await createSocialPost(fd);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
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
      <button onClick={() => setOpen(true)} className={className ?? cls}>
        {!className && variant === "primary" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        )}
        {label ?? (editing ? "Modifier" : "Nouveau post")}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Modifier le post" : "Nouveau post"}>
        {open && (
          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <div>
              <label className={labelCls} htmlFor="title">Titre *</label>
              <input id="title" name="title" defaultValue={post?.title ?? ""} className={inputCls} placeholder="Ex. Annonce campagne d'octobre" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="post_date">Date de post *</label>
                <input id="post_date" name="post_date" type="date" defaultValue={post?.post_date ?? defaultDate ?? ""} className={inputCls} />
              </div>
              <Select label="Format" name="format" defaultValue={post?.format ?? ""} placeholder="—" options={SOCIAL_FORMATS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Statut" name="status" defaultValue={post?.status ?? "en préparation"} options={SOCIAL_STATUSES} />
              <Select label="Campagne" name="drop_id" defaultValue={post?.drop_id ?? ""} placeholder="Aucune" options={drops.map((d) => ({ value: d.id, label: d.name }))} />
            </div>

            <div>
              <label className={labelCls} htmlFor="drive_link">Lien Drive (ressources)</label>
              <input id="drive_link" name="drive_link" type="url" defaultValue={post?.drive_link ?? ""} className={inputCls} placeholder="https://drive.google.com/…" />
            </div>

            <div>
              <label className={labelCls} htmlFor="caption">Légende / notes</label>
              <textarea id="caption" name="caption" defaultValue={post?.caption ?? ""} rows={3} className={inputCls} placeholder="Texte du post, hashtags, idées…" />
            </div>

            {!editing && (
              <p className="rounded-md border border-accent/20 bg-accentBg/50 px-3 py-2 text-2xs text-muted">
                Une tâche <span className="font-medium text-text">« Créer le visuel du post »</span> sera créée automatiquement,
                avec une échéance {SOCIAL_VISUAL_LEAD_DAYS} jours avant la date de post.
              </p>
            )}

            {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">{error}</p>}

            <button type="submit" disabled={pending} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover disabled:opacity-60">
              {pending ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le post"}
            </button>
          </form>
        )}
      </Drawer>
    </>
  );
}
