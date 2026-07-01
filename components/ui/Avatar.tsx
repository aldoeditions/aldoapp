import { cn } from "@/lib/cn";
import { initiales } from "@/lib/format";

const SIZES = {
  sm: "h-8 w-8 text-2xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accentBg font-semibold uppercase text-accent",
        SIZES[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{initiales(name)}</span>
      )}
    </div>
  );
}
