"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { OrderForm } from "./OrderForm";
import { cn } from "@/lib/cn";
import type { Order } from "@/types/database";

type OeuvreOpt = { id: string; name: string; format: string; price: number; drop_id: string | null };
type ItemRow = { oeuvre_id: string; quantity: number; unit_price: number };

export function OrderFormButton({
  oeuvres,
  drops,
  waveNames,
  order,
  items,
  variant = "primary",
  label,
}: {
  oeuvres: OeuvreOpt[];
  drops: { id: string; name: string }[];
  waveNames: string[];
  order?: Order | null;
  items?: ItemRow[];
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(order);
  const text = label ?? (editing ? "Modifier" : "Nouvelle commande");

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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        )}
        {text}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Modifier la commande" : "Nouvelle commande"}>
        {open && (
          <OrderForm
            order={order}
            items={items}
            oeuvres={oeuvres}
            drops={drops}
            waveNames={waveNames}
            onSuccess={() => setOpen(false)}
          />
        )}
      </Drawer>
    </>
  );
}
