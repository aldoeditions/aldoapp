"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerFile } from "@/app/portail/(shell)/actions";
import { cn } from "@/lib/cn";

const MAX_MB = 50; // limite du bucket (relevable dans les réglages projet)
const ACCEPT = ".tif,.tiff,.pdf,.psd,.png,.jpg,.jpeg";

export function FileUploader({
  oeuvres,
}: {
  oeuvres: { id: string; name: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oeuvreId, setOeuvreId] = useState("");

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${MAX_MB} Mo).`);
      return;
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expirée, reconnecte-toi.");
      return;
    }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const artistId = session.user.id; // dossier = artist_id via current_artist_id côté RLS
    // On récupère l'artist_id réel côté serveur (registerFile), mais le chemin
    // Storage doit matcher current_artist_id() → on demande l'artist_id lié.
    const { data: me } = await supabase.from("artists").select("id").maybeSingle();
    const folder = me?.id ?? artistId;
    const path = `${folder}/${Date.now()}-${safe}`;

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/artist-files/${path}`;

    setProgress(0);
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
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `Erreur ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Échec réseau pendant l'upload."));
      xhr.send(file);
    }).then(async () => {
      const res = await registerFile({
        path,
        filename: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        oeuvreId: oeuvreId || null,
      });
      if (res.error) throw new Error(res.error);
      setProgress(null);
      setOeuvreId("");
      router.refresh();
    }).catch((e) => {
      setProgress(null);
      setError(e.message?.slice(0, 200) ?? "Échec de l'upload.");
    });
  }

  return (
    <div className="space-y-3">
      {/* Association œuvre */}
      {oeuvres.length > 0 && (
        <div>
          <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted">
            Associer à une œuvre (optionnel)
          </label>
          <select
            value={oeuvreId}
            onChange={(e) => setOeuvreId(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            <option value="">— Aucune —</option>
            {oeuvres.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      )}

      {/* Zone de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-accent bg-accentBg/50" : "border-border bg-bg hover:border-accent/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
        />
        {progress !== null ? (
          <div className="mx-auto max-w-sm">
            <p className="mb-2 text-sm text-muted">Upload en cours… {progress}%</p>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="font-medium text-text">Glisse ton fichier ici, ou clique pour choisir</p>
            <p className="mt-1 text-2xs text-faint">TIFF · PDF · PSD · PNG haute résolution — max {MAX_MB} Mo</p>
          </>
        )}
      </div>

      {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
