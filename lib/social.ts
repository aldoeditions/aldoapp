import type { BadgeVariant } from "@/lib/constants";

export type SocialUrgency = {
  level: "none" | "soon" | "urgent" | "late";
  label: string;
  variant: BadgeVariant;
  days: number | null;
};

/**
 * Urgence CALCULÉE d'un post (jamais stockée) : dépend de la proximité de la
 * date de post et du statut. Un post « prêt à poster » ou « posté » n'a plus
 * d'urgence (le visuel est fait). Sinon : dépassé → rouge, ≤2 j → rouge, 3-6 j
 * → orange, ≥7 j → neutre.
 */
export function socialUrgency(postDate: string, status: string): SocialUrgency {
  if (status === "prêt à poster" || status === "posté") {
    return { level: "none", label: "", variant: "gray", days: null };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${postDate}T00:00:00`);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { level: "late", label: "En retard", variant: "red", days };
  if (days <= 2) return { level: "urgent", label: "Urgent", variant: "red", days };
  if (days <= 6) return { level: "soon", label: "Bientôt", variant: "orange", days };
  return { level: "none", label: "", variant: "gray", days };
}

/** Date d'échéance du visuel = date du post − N jours (retourne "YYYY-MM-DD"). */
export function visualDueDate(postDate: string, leadDays: number): string {
  const d = new Date(`${postDate}T00:00:00`);
  d.setDate(d.getDate() - leadDays);
  return d.toISOString().slice(0, 10);
}
