"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerOeuvreFile } from "@/app/(app)/drops/actions";

const MAX_MB = 50;
const ACCEPT = ".tif,.tiff,.pdf,.psd,.png,.jpg,.jpeg";

export function OeuvreFileReplace({
  oeuvreId,
  artistId,
  dropId,
  hasFile,
}: {
  oeuvreId: string;
  artistId: string;
  dropId: string;
  hasFile: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function upload(file: File) {
    setError(null);
    setDone(false);
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${MAX_MB} Mo).`);
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expirée, reconnecte-toi.");
      return;
    }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${artistId}/${Date.now()}-${safe}`;
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/artist-files/${path}`;

    setProgress(0);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
        xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        xhr.setRequestHeader("x-upsert", "true");
        if (file.type) xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(xhr.responseText || `Erreur ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Échec réseau pendant l'upload."));
        xhr.send(file);
      });

      const res = await registerOeuvreFile({
        oeuvreId,
        artistId,
        dropId,
        path,
        filename: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
      });
      if (res.error) throw new Error(res.error);

      setProgress(null);
      setDone(true);
      router.refresh();
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message.slice(0, 200) : "Échec de l'upload.");
    }
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      {progress !== null ? (
        <div className="max-w-[220px]">
          <p className="mb-1 text-2xs text-muted">Upload… {progress}%</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-2xs font-medium text-accent hover:underline"
        >
          {hasFile ? "Remplacer le fichier…" : "Ajouter un fichier…"}
        </button>
      )}

      {done && (
        <p className="mt-1 text-2xs font-medium text-success">
          ✓ Nouvelle version enregistrée et validée.
        </p>
      )}
      {error && <p className="mt-1 text-2xs text-danger">{error}</p>}
    </div>
  );
}
