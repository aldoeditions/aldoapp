/** Utilitaires de formatage — UI Aldo Éditions. */

import { COMMISSION_PCT } from "@/lib/constants";

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EUR_0 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Montant en euros, ex. « 1 234,50 € ». */
export function euros(value: number | null | undefined): string {
  return EUR.format(value ?? 0);
}

/** Montant en euros sans décimales, ex. « 1 235 € ». */
export function euros0(value: number | null | undefined): string {
  return EUR_0.format(value ?? 0);
}

/** Entier formaté façon française, ex. « 1 234 ». */
export function nombre(value: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR").format(value ?? 0);
}

/** Pourcentage, ex. 0.3 → « 30 % ». */
export function pourcent(ratio: number | null | undefined): string {
  return `${Math.round((ratio ?? 0) * 100)} %`;
}

/** Date courte, ex. « 30 juin 2026 ». Accepte ISO string ou null. */
export function dateCourte(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Commission artiste (30 % par défaut) sur un montant. */
export function commission(
  montant: number | null | undefined,
  pct: number = COMMISSION_PCT,
): number {
  return Math.round((montant ?? 0) * pct * 100) / 100;
}

/** Initiales pour les avatars, ex. « Louison Dupont » → « LD ». */
export function initiales(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
