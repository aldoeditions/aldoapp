"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { dateCourte } from "@/lib/format";
import { updatePipeStatus } from "@/app/(app)/prospection/actions";
import type { PipeColumn, PipeCard } from "@/lib/data/prospection";

export function KanbanBoard({
  columns: initial,
  editable,
}: {
  columns: PipeColumn[];
  editable: boolean;
}) {
  const router = useRouter();
  const [columns, setColumns] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(id: string, toStatus: string) {
    let card: PipeCard | undefined;
    const without = columns.map((c) => ({
      ...c,
      cards: c.cards.filter((k) => {
        if (k.id === id) {
          card = k;
          return false;
        }
        return true;
      }),
    }));
    if (!card) return;
    if (card.pipe_status === toStatus) return;

    const moved = { ...card, pipe_status: toStatus };
    setColumns(
      without.map((c) =>
        c.status === toStatus ? { ...c, cards: [moved, ...c.cards] } : c,
      ),
    );

    startTransition(async () => {
      try {
        await updatePipeStatus(id, toStatus);
      } catch {
        router.refresh(); // resync en cas d'échec
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <div
          key={col.status}
          onDragOver={(e) => {
            if (!editable) return;
            e.preventDefault();
            setOverCol(col.status);
          }}
          onDragLeave={() => setOverCol((c) => (c === col.status ? null : c))}
          onDrop={(e) => {
            e.preventDefault();
            setOverCol(null);
            if (dragId) move(dragId, col.status);
          }}
          className={cn(
            "flex flex-col rounded-card border bg-bg/60 p-2 transition-colors",
            overCol === col.status
              ? "border-accent bg-accentBg/50"
              : "border-border",
          )}
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-2xs font-semibold uppercase tracking-wide text-muted">
              {col.label}
            </span>
            <span className="rounded-full bg-border/70 px-1.5 text-2xs text-muted">
              {col.cards.length}
            </span>
          </div>

          <div className="flex min-h-[80px] flex-col gap-2 p-1">
            {col.cards.map((card) => (
              <div
                key={card.id}
                draggable={editable}
                onDragStart={(e) => {
                  setDragId(card.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", card.id);
                }}
                onDragEnd={() => setDragId(null)}
                onClick={() => router.push(`/artistes/${card.id}`)}
                className={cn(
                  "card cursor-pointer p-3 transition-shadow hover:shadow-float",
                  editable && "active:cursor-grabbing",
                  dragId === card.id && "opacity-50",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar name={card.name} src={card.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {card.name}
                    </p>
                    <p className="truncate text-2xs text-muted">
                      {[card.style, card.renommee].filter(Boolean).join(" · ") ||
                        card.type ||
                        "—"}
                    </p>
                  </div>
                </div>
                {(card.contacted_by || card.first_contact_date) && (
                  <div className="mt-2 flex items-center justify-between text-2xs text-faint">
                    <span>{card.contacted_by ?? ""}</span>
                    <span>{dateCourte(card.first_contact_date)}</span>
                  </div>
                )}
              </div>
            ))}
            {col.cards.length === 0 && (
              <p className="px-2 py-4 text-center text-2xs text-faint">
                Aucun prospect
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
