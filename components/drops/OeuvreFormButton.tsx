"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { OeuvreForm } from "./OeuvreForm";
import type { Oeuvre } from "@/types/database";
import type { CostByFormat } from "@/lib/data/drops";

export function OeuvreFormButton({
  dropId,
  artists,
  costs,
  oeuvre,
  hdFile = null,
  variant = "primary",
}: {
  dropId: string;
  artists: { id: string; name: string }[];
  costs: CostByFormat;
  oeuvre?: Oeuvre | null;
  hdFile?: { path: string; filename: string | null } | null;
  variant?: "primary" | "row";
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(oeuvre);

  return (
    <>
      {variant === "primary" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentHover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter une œuvre
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-2xs font-medium text-accent hover:underline"
        >
          Modifier
        </button>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier l'œuvre" : "Nouvelle œuvre"}
      >
        {open && (
          <OeuvreForm
            dropId={dropId}
            artists={artists}
            costs={costs}
            oeuvre={oeuvre}
            hdFile={hdFile}
            onSuccess={() => setOpen(false)}
          />
        )}
      </Drawer>
    </>
  );
}
