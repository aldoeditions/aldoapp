"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { ChargeForm } from "./ChargeForm";
import { cn } from "@/lib/cn";
import type { Charge } from "@/types/database";

export function ChargeFormButton({
  drops,
  charge,
  variant = "primary",
  label,
}: {
  drops: { id: string; name: string }[];
  charge?: Charge | null;
  variant?: "primary" | "row";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(charge);

  return (
    <>
      {variant === "primary" ? (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentHover",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {label ?? "Nouvelle charge"}
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="text-2xs font-medium text-accent hover:underline">
          {label ?? "Modifier"}
        </button>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Modifier la charge" : "Nouvelle charge"}>
        {open && <ChargeForm charge={charge} drops={drops} onSuccess={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}
