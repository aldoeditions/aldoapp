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

/**
 * Étapes du pipeline de prospection.
 * ⚠️ Les `value` correspondent EXACTEMENT aux CHECK constraints en base
 * (accentués, avec espaces) — vérifiés par introspection.
 */
export const PIPE_STATUSES: StatusOption[] = [
  { value: "prospect", label: "Prospect", variant: "gray" },
  { value: "contacté", label: "Contacté", variant: "blue" },
  { value: "intéressé", label: "Intéressé", variant: "orange" },
  { value: "confirmé", label: "Confirmé", variant: "green" },
];
export const PIPE_STATUS = dict(PIPE_STATUSES);

/**
 * Statut générique des éléments de suivi (kit, visuels, infos).
 * ⚠️ `value` = valeurs réelles observées en base. Le vocabulaire exact varie
 * un peu par colonne (kit_impression / visuels / demande_infos) — à affiner
 * lors du module Prospection/Suivi.
 */
export const SUIVI_STATUSES: StatusOption[] = [
  { value: "a demander", label: "À demander", variant: "gray" },
  { value: "a envoyer", label: "À envoyer", variant: "orange" },
  { value: "envoyé", label: "Envoyé", variant: "blue" },
  { value: "reçu", label: "Reçu", variant: "green" },
];
export const SUIVI_STATUS = dict(SUIVI_STATUSES);

/* --- Suivi de lancement : vocabulaires spécifiques par colonne (CHECK réelles) --- */

/** kit_impression : a envoyer · envoyé · reçu */
export const KIT_STATUSES: StatusOption[] = [
  { value: "a envoyer", label: "À envoyer", variant: "orange" },
  { value: "envoyé", label: "Envoyé", variant: "blue" },
  { value: "reçu", label: "Reçu", variant: "green" },
];
export const KIT_STATUS = dict(KIT_STATUSES);

/** visuels : a demander · en attente · validé */
export const VISUELS_STATUSES: StatusOption[] = [
  { value: "a demander", label: "À demander", variant: "gray" },
  { value: "en attente", label: "En attente", variant: "orange" },
  { value: "validé", label: "Validé", variant: "green" },
];
export const VISUELS_STATUS = dict(VISUELS_STATUSES);

/** demande_infos : a demander · reçu */
export const DEMANDE_STATUSES: StatusOption[] = [
  { value: "a demander", label: "À demander", variant: "gray" },
  { value: "reçu", label: "Reçu", variant: "green" },
];
export const DEMANDE_STATUS = dict(DEMANDE_STATUSES);

/** Statut d'un drop / campagne. ⚠️ `value` = CHECK constraint réelle. */
export const DROP_STATUSES: StatusOption[] = [
  { value: "à venir", label: "À venir", variant: "blue" },
  { value: "en cours", label: "En cours", variant: "green" },
  { value: "terminé", label: "Terminé", variant: "gray" },
];
export const DROP_STATUS = dict(DROP_STATUSES);

/** Statut d'une œuvre. ⚠️ `value` = CHECK constraint réelle. */
export const OEUVRE_STATUSES: StatusOption[] = [
  { value: "brouillon", label: "Brouillon", variant: "gray" },
  { value: "actif", label: "Actif", variant: "green" },
  { value: "archivé", label: "Archivé", variant: "gray" },
];
export const OEUVRE_STATUS = dict(OEUVRE_STATUSES);

/** Statut de validation d'un fichier / visuel. ⚠️ `value` = CHECK constraint réelle. */
export const FILE_STATUSES: StatusOption[] = [
  { value: "en attente", label: "En attente", variant: "orange" },
  { value: "validé", label: "Validé", variant: "green" },
];
export const FILE_STATUS = dict(FILE_STATUSES);

/** Statut d'une commande Shopify. */
export const ORDER_STATUSES: StatusOption[] = [
  { value: "en attente", label: "En attente", variant: "orange" },
  { value: "imprimé", label: "Imprimé", variant: "blue" },
  { value: "expédié", label: "Expédié", variant: "green" },
];
export const ORDER_STATUS = dict(ORDER_STATUSES);

/**
 * Statut d'un contrat artiste.
 * ⚠️ `value` = CHECK constraint réelle en base (« a envoyer » / « envoyé » / « signé »).
 */
export const CONTRACT_STATUSES: StatusOption[] = [
  { value: "a envoyer", label: "À envoyer", variant: "gray" },
  { value: "envoyé", label: "Envoyé", variant: "blue" },
  { value: "signé", label: "Signé", variant: "green" },
];
export const CONTRACT_STATUS = dict(CONTRACT_STATUSES);

/** Statut d'un paiement artiste. */
export const PAYMENT_STATUSES: StatusOption[] = [
  { value: "a_payer", label: "À payer", variant: "orange" },
  { value: "paye", label: "Payé", variant: "green" },
];
export const PAYMENT_STATUS = dict(PAYMENT_STATUSES);

/** Type de charge. ⚠️ `value` = CHECK constraint réelle (Fixe / Variable). */
export const CHARGE_TYPES: StatusOption[] = [
  { value: "Fixe", label: "Fixe", variant: "blue" },
  { value: "Variable", label: "Variable", variant: "orange" },
];
export const CHARGE_TYPE = dict(CHARGE_TYPES);

/**
 * Catégorie de charge. ⚠️ CHECK constraint réelle limitée à Marketing / Autre.
 * Le détail (Shopify, Webflow, Ads…) se met dans le nom de la charge.
 */
export const CHARGE_CATEGORIES: StatusOption[] = [
  { value: "Marketing", label: "Marketing", variant: "blue" },
  { value: "Autre", label: "Autre", variant: "gray" },
];
export const CHARGE_CATEGORY = dict(CHARGE_CATEGORIES);

/* ------------------------------------------------------------------ */
/* Équipe                                                              */
/* ------------------------------------------------------------------ */

export const TEAM = ["Louison", "Tom", "Charley"] as const;
export type TeamMember = (typeof TEAM)[number];

/**
 * Type d'entité artiste — CHECK constraint réelle en base.
 * (Le médium artistique est saisi librement dans le champ « style ».)
 */
export const ARTIST_TYPES = ["Artiste", "Collectif", "Studio"] as const;
