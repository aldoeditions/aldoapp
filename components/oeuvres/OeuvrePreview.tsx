"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

/**
 * Miniature d'une œuvre. Si un visuel est présent (file_url), un clic ouvre
 * l'aperçu en modale. Sinon, simple avatar (placeholder), non cliquable.
 */
export function OeuvrePreview({
  name,
  src,
  size = "sm",
}: {
  name: string | null | undefined;
  src: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src) {
    return <Avatar name={name} size={size} className="rounded" />;
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Voir l'aperçu"
        className="group relative shrink-0 overflow-hidden rounded"
      >
        <Avatar name={name} src={src} size={size} className="rounded" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6")}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name ?? ""} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-float" />
            {name && <p className="mt-3 text-sm text-white/90">{name}</p>}
          </div>
        </div>
      )}
    </>
  );
}
