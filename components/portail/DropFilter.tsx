"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Filtre par drop (chips), piloté par l'URL (?drop=). */
export function DropFilter({ drops }: { drops: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("drop") ?? "";

  function set(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("drop", value);
    else next.delete("drop");
    router.replace(`${pathname}?${next.toString()}`);
  }

  if (drops.length === 0) return null;

  const chips = [{ id: "", name: "Toutes" }, ...drops];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.id || "all"}
          onClick={() => set(c.id)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === c.id
              ? "bg-text text-white"
              : "border border-border bg-surface text-muted hover:text-text",
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
