"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addStudioPhoto, removeStudioPhoto } from "@/app/portail/(shell)/actions";

export function StudioPhotos({ photos }: { photos: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = (file: File) => {
    const fd = new FormData();
    fd.set("photo", file);
    start(async () => {
      const r = await addStudioPhoto(fd);
      if (r.error) setError(r.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  };

  const remove = (url: string) =>
    start(async () => {
      await removeStudioPhoto(url);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Ajoute des photos de ton atelier, de toi au travail, de tes outils… Elles illustreront ta page
        artiste. (JPG/PNG, 8&nbsp;Mo max)
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Atelier" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              disabled={pending}
              className="absolute right-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-2xs font-medium text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100 disabled:opacity-50"
            >
              Retirer
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-60"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          <span className="text-2xs font-medium">{pending ? "Envoi…" : "Ajouter"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
