"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateFile, rejectFile } from "@/app/(app)/artistes/actions";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import { taille, dateCourte } from "@/lib/format";
import type { PendingFile } from "@/lib/data/artists";

function Row({ file }: { file: PendingFile }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const act = (fn: () => Promise<void>) =>
    start(async () => { await fn(); router.refresh(); });

  return (
    <li className="border-b border-border px-5 py-3.5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{file.filename}</p>
          <p className="text-2xs text-faint">
            {file.artist_name ?? "—"}
            {file.oeuvre_name ? ` · ${file.oeuvre_name}` : ""} · {taille(file.file_size)} · {dateCourte(file.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <FileDownloadButton bucket="artist-files" path={file.file_path} label="Voir" />
          <button
            onClick={() => act(() => validateFile(file.id))}
            disabled={pending}
            className="rounded-md bg-successBg px-2.5 py-1.5 text-2xs font-semibold text-success transition-colors hover:bg-success hover:text-white disabled:opacity-60"
          >
            Valider
          </button>
          <button
            onClick={() => setRejecting((r) => !r)}
            disabled={pending}
            className="rounded-md bg-dangerBg px-2.5 py-1.5 text-2xs font-semibold text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
          >
            Refuser
          </button>
        </div>
      </div>

      {rejecting && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motif du refus (ex. résolution insuffisante)…"
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <button
            onClick={() => act(() => rejectFile(file.id, note))}
            disabled={pending}
            className="rounded-md bg-danger px-3 py-2 text-2xs font-semibold text-white disabled:opacity-60"
          >
            Confirmer le refus
          </button>
        </div>
      )}
    </li>
  );
}

export function FilesReview({ files }: { files: PendingFile[] }) {
  return (
    <ul>
      {files.map((f) => <Row key={f.id} file={f} />)}
    </ul>
  );
}
