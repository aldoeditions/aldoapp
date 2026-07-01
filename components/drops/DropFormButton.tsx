"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { DropForm } from "./DropForm";
import { cn } from "@/lib/cn";
import type { Drop } from "@/types/database";

export function DropFormButton({
  drop,
  label,
  variant = "primary",
}: {
  drop?: Drop | null;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(drop);
  const text = label ?? (editing ? "Modifier" : "Nouveau drop");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          variant === "primary"
            ? "bg-accent text-white hover:bg-accentHover"
            : "border border-border bg-surface text-text hover:bg-bg",
        )}
      >
        {!editing && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
        {text}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Modifier le drop" : "Nouveau drop"}>
        <DropForm drop={drop} />
      </Drawer>
    </>
  );
}
