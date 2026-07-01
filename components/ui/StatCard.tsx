import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("card p-5", className)}>
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "mt-2 font-serif text-3xl leading-none tracking-tight",
          accent ? "text-accent" : "text-text",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-2xs text-faint">{hint}</p>}
    </div>
  );
}
