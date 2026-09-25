"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateDescription, sendBackDescription } from "@/app/(app)/oeuvres/actions";
import type { PendingDescription } from "@/lib/data/oeuvres";

export function DescriptionReview({ items }: { items: PendingDescription[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((it) => (
        <Row key={it.id} item={it} />
      ))}
    </ul>
  );
}

function Row({ item }: { item: PendingDescription }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState(item.description ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setMsg(null);
      const res = await fn();
      if (res.error) setMsg(res.error);
      else router.refresh();
    });

  return (
    <li className="px-5 py-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-text">
          {item.name} <span className="text-2xs font-normal text-faint">· {item.format}</span>
        </span>
        <span className="text-2xs text-muted">
          {item.artist_name ?? "—"}{item.drop_name ? ` · ${item.drop_name}` : ""}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
      />
      {msg && <p className="mt-1 text-2xs text-danger">{msg}</p>}
      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => sendBackDescription(item.id))}
          className="text-2xs font-medium text-muted transition-colors hover:text-danger disabled:opacity-50"
        >
          Renvoyer à l&apos;artiste
        </button>
        <button
          type="button"
          disabled={pending || !text.trim()}
          onClick={() => run(() => validateDescription(item.id, text))}
          className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-accentHover disabled:opacity-50"
        >
          {pending ? "…" : "Valider"}
        </button>
      </div>
    </li>
  );
}
