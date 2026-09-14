export type ContractOeuvre = {
  title: string;
  format: string;
  fileInfo: string;
  createdAt: string;
};

export type ContractData = {
  /* Identité artiste (déjà formatée) */
  civility: "Madame" | "Monsieur" | null;
  firstName: string;
  lastName: string;
  fullName: string;
  identityLine: string; // phrase d'identification complète (art. parties)
  qualite: string; // « sa qualité d'artiste-auteur » ou « son activité de création » (art. 5.3)
  statutSocialBullet: string; // puce d'inscription sociale adaptée au statut (art. 5.3)
  address: string;
  email: string;
  iban: string; // groupé par 4
  notifName: string; // « CARTRON Diane »

  /* Campagne (drop) */
  campaignName: string;
  campaignStart: string; // « 1er mars 2026 »
  campaignEnd: string;

  /* Commission */
  commissionPct: string; // « 30 »
  commissionWords: string; // « trente »

  /* Génération */
  generationDate: string; // « 09/04/2026 »
  generationPlace: string; // « Bordeaux »

  /* Annexe 1 */
  oeuvres: ContractOeuvre[];
};
