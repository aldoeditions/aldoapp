import { cn } from "@/lib/cn";
import type { BadgeVariant, StatusOption } from "@/lib/constants";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green: "bg-successBg text-success",
  orange: "bg-warningBg text-warning",
  blue: "bg-accentBg text-accent",
  gray: "bg-neutralBg text-muted",
  red: "bg-dangerBg text-danger",
};

export function Badge({
  variant = "gray",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

/**
 * Badge piloté par un dictionnaire de statuts (lib/constants).
 * Affiche le libellé + la couleur associés à `value`, avec repli neutre.
 */
export function StatusBadge({
  value,
  dict,
  fallback,
  className,
}: {
  value: string | null | undefined;
  dict: Record<string, StatusOption>;
  fallback?: string;
  className?: string;
}) {
  if (!value) {
    return (
      <Badge variant="gray" className={className}>
        {fallback ?? "—"}
      </Badge>
    );
  }
  const opt = dict[value];
  return (
    <Badge variant={opt?.variant ?? "gray"} className={className}>
      {opt?.label ?? value}
    </Badge>
  );
}
