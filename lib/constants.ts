/**
 * Constantes métier — Aldo Éditions.
 * Source de vérité partagée par toute l'UI (prix, commission, statuts, badges).
 */

/* ------------------------------------------------------------------ */
/* Règles commerciales                                                 */
/* ------------------------------------------------------------------ */

/** Commission artiste par défaut : 30 % du prix de vente TTC. */
export const COMMISSION_PCT = 0.3;

export type FormatKey = "A3" | "A4";

/** Prix de vente TTC par format. */
export const FORMATS: Record<FormatKey, { label: string; prix: number }> = {
  A3: { label: "A3", prix: 40 },
  A4: { label: "A4", prix: 25 },
};

export const DEVISE = "EUR";

/* ------------------------------------------------------------------ */
/* Badges — variantes de couleur du design system                     */
/*   green  = validé / signé                                           */
/*   orange = en attente                                               */
/*   blue   = envoyé / contacté                                        */
/*   gray   = à demander / neutre                                      */
/*   red    = refusé / annulé                                          */
/* ------------------------------------------------------------------ */

export type BadgeVariant = "green" | "orange" | "blue" | "gray" | "red";

export type StatusOption = {
  value: string;
  label: string;
  variant: BadgeVariant;
};

/** Construit un dictionnaire indexé par `value` pour lookup O(1). */
function dict(options: StatusOption[]): Record<string, StatusOption> {
  return Object.fromEntries(options.map((o) => [o.value, o]));
}

/* ------------------------------------------------------------------ */
/* Statuts par domaine                                                 */
/* ------------------------------------------------------------------ */

/** Phase de l'artiste — pilote l'aiguillage Prospection / Suivi / Actif. */
export const ARTIST_PHASES: StatusOption[] = [
  { value: "prospect", label: "Prospect", variant: "gray" },
  { value: "suivi", label: "Suivi lancement", variant: "blue" },
  { value: "actif", label: "Actif", variant: "green" },
  { value: "inactif", label: "Inactif", variant: "gray" },
];
export const ARTIST_PHASE = dict(ARTIST_PHASES);

/** Étapes du pipeline de prospection. */
export const PIPE_STATUSES: StatusOption[] = [
  { value: "prospect", label: "Prospect", variant: "gray" },
  { value: "contacte", label: "Contacté", variant: "blue" },
  { value: "interesse", label: "Intéressé", variant: "orange" },
  { value: "confirme", label: "Confirmé", variant: "green" },
  { value: "refuse", label: "Refusé", variant: "red" },
];
export const PIPE_STATUS = dict(PIPE_STATUSES);

/** Statut générique des éléments de suivi (kit, visuels, contrat, infos). */
export const SUIVI_STATUSES: StatusOption[] = [
  { value: "a_demander", label: "À demander", variant: "gray" },
  { value: "demande", label: "Demandé", variant: "blue" },
  { value: "en_attente", label: "En attente", variant: "orange" },
  { value: "valide", label: "Validé", variant: "green" },
];
export const SUIVI_STATUS = dict(SUIVI_STATUSES);

/** Statut d'un drop / campagne. */
export const DROP_STATUSES: StatusOption[] = [
  { value: "brouillon", label: "Brouillon", variant: "gray" },
  { value: "planifie", label: "Planifié", variant: "blue" },
  { value: "en_cours", label: "En cours", variant: "orange" },
  { value: "termine", label: "Terminé", variant: "green" },
];
export const DROP_STATUS = dict(DROP_STATUSES);

/** Statut d'une œuvre. */
export const OEUVRE_STATUSES: StatusOption[] = [
  { value: "brouillon", label: "Brouillon", variant: "gray" },
  { value: "en_preparation", label: "En préparation", variant: "orange" },
  { value: "pret", label: "Prêt", variant: "blue" },
  { value: "en_ligne", label: "En ligne", variant: "green" },
  { value: "archive", label: "Archivé", variant: "gray" },
];
export const OEUVRE_STATUS = dict(OEUVRE_STATUSES);

/** Statut de validation d'un fichier déposé. */
export const FILE_STATUSES: StatusOption[] = [
  { value: "a_demander", label: "À demander", variant: "gray" },
  { value: "en_attente", label: "En attente", variant: "orange" },
  { value: "valide", label: "Validé", variant: "green" },
  { value: "rejete", label: "Rejeté", variant: "red" },
];
export const FILE_STATUS = dict(FILE_STATUSES);

/** Statut d'une commande Shopify. */
export const ORDER_STATUSES: StatusOption[] = [
  { value: "nouvelle", label: "Nouvelle", variant: "blue" },
  { value: "en_impression", label: "En impression", variant: "orange" },
  { value: "expediee", label: "Expédiée", variant: "green" },
  { value: "annulee", label: "Annulée", variant: "red" },
];
export const ORDER_STATUS = dict(ORDER_STATUSES);

/** Statut d'un contrat artiste. */
export const CONTRACT_STATUSES: StatusOption[] = [
  { value: "a_envoyer", label: "À envoyer", variant: "gray" },
  { value: "envoye", label: "Envoyé", variant: "blue" },
  { value: "signe", label: "Signé", variant: "green" },
];
export const CONTRACT_STATUS = dict(CONTRACT_STATUSES);

/** Statut d'un paiement artiste. */
export const PAYMENT_STATUSES: StatusOption[] = [
  { value: "a_payer", label: "À payer", variant: "orange" },
  { value: "paye", label: "Payé", variant: "green" },
];
export const PAYMENT_STATUS = dict(PAYMENT_STATUSES);

/* ------------------------------------------------------------------ */
/* Équipe                                                              */
/* ------------------------------------------------------------------ */

export const TEAM = ["Louison", "Tom", "Charley"] as const;
export type TeamMember = (typeof TEAM)[number];
