/** Concatène des classes conditionnelles (clsx minimaliste). */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
