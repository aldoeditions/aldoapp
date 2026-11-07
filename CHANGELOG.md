# Changelog

Évolutions notables de l'application de gestion **Aldo Éditions**.
Généré depuis l'historique Git (messages de commit). Dates au format AAAA-MM-JJ, plus récent en haut.

## 2026-11-07

- Relevés droits d'auteur — Phase 7 : certificat de précompte annuel
- Relevés droits d'auteur — « Marquer payé » + Phase 6 (Urssaf + CSV)
- Relevés droits d'auteur — Phase 5 : portail artiste + fiche artiste
- Relevés droits d'auteur — Phase 4 : PDF du relevé
- Relevés droits d'auteur — Phase 3 : écran Campagne → Relevés
- Relevés droits d'auteur — Phase 1 : table royalty_statements + numérotation
- Relevés droits d'auteur — Phase 0 : arrondi par ligne + socle calcul

## 2026-11-02

- Agenda artistes — vraie vue agenda (chronologique, par mois)
- Dashboard — carte « Événements proposés » par les artistes

## 2026-10-28

- Fiche artiste — liens de contact affichés en entier (plus de troncature)

## 2026-10-26

- Shopify — nom client correct en livraison point relais
- Drops — export « format Shopify » (import produits prêt à l'emploi)
- Drops — export CSV des œuvres (nom, format, prix, description, artiste, SKU)

## 2026-10-21

- Portail — adresse complète et libellés clairs (n° et rue / CP / ville / pays)
- Portail — IBAN désormais visible côté admin + champs identité manquants

## 2026-10-16

- Portail — barrière d'erreur + wizard plus robuste (anti écran blanc)

## 2026-10-09

- Œuvres — suppression depuis l'édition + SKU artiste obligatoire
- Œuvres — l'artiste peut valider/corriger le nom du visuel
- Onboarding — réordonne le wizard (essentiel d'abord, personnel ensuite)
- Onboarding v2 — Phase D : wizard de première connexion
- Onboarding v2 — Phase B : questionnaire 10 questions + photos d'atelier
- Onboarding v2 — Phase C : module Événements (Agenda)
- Onboarding v2 — Phase A : socle données (questionnaire, photos, événements)

## 2026-10-07

- Artistes — colonne « Drops » + filtre par campagne
- Finances — intègre les frais de paiement Shopify au P&L

## 2026-09-29

- Portail — n° sécu : confirmation visible « enregistré » (feedback)
- Portail — n° sécu : échec de chiffrement non bloquant + message clair
- Fix — l'artiste ne pouvait pas modifier son profil (trigger colonne fantôme)
- Artistes — bouton « Régénérer le mot de passe » (accès portail)
- Portail — corrige le débordement horizontal sur mobile (profil & co)
- Portail — tableaux lisibles sur mobile (colonnes secondaires masquées)
- Portail — l'artiste renseigne son statut social & Urssaf

## 2026-09-28

- Statut artiste-auteur — Phase 4 : portail + clause contrat
- Statut artiste-auteur — Phase 3 : relevé PDF, Urssaf, P&L, dispenses
- Statut artiste-auteur — Phase 2 : formulaire social + versements
- Fix migration 0024 — numeric(7,4) pour accepter les assiettes à 100 %
- Statut artiste-auteur — Phase 1 : fondations (précompte, contribution diffuseur)
- Emails Auth — titre en bleu Aldo (#0627B7)

## 2026-09-26

- Emails Auth — templates HTML brandés Aldo (invite + recovery) à coller dans Supabase

## 2026-09-25

- Portail — onboarding déclenché, contrats clarifiés (Goodflag), « Comment ça marche »
- Portail accueil — fix commission par œuvre (campagne en cours) sur le HT
- Œuvre (admin) — affiche la description artiste + son statut dans le formulaire
- Portail — description d'œuvre par l'artiste + validation admin
- Favicon de l'app (app/icon.png, 256×256) — détecté automatiquement par Next
- Artistes — colonne Instagram (lien cliquable) dans la vue liste

## 2026-09-24

- Compta — commission artiste sur le HT + CA affiché en TTC et HT

## 2026-09-21

- Portail artiste — vue Calendrier (agenda des dates clés de campagne)
- Réseaux — filtres (campagne/statut) + carte « Posts à venir » sur le dashboard
- Module Réseaux sociaux — calendrier des posts Instagram + automatisation tâche

## 2026-09-18

- Fix commandes annulées Shopify — exclues des stats + non ré-importées
- Nettoyage — retrait des colonnes de stats mortes (oeuvres.nb_ventes/ca_brut)
- Shopify Étape 8 — script de tests d'intégration (13 vérifs, auto-nettoyage)
- Shopify 0019 (palier 2) — portail sur ventes réelles (artist_sales)
- Shopify 0019 (palier 1) — programmation des œuvres via drop_oeuvres (rééditions)
- Stats — brancher les ventes Shopify sur les Finances (migration 0018 + détail par œuvre)
- Sync Shopify Étape 7 (2/2) — code SKU artiste + génération auto des SKU d'œuvres
- Sync Shopify Étape 7 (1/2) — page Sync Shopify + Catalogue enrichi
- Sync Shopify — suppression de la route OAuth temporaire /api/shopify/install
- Fix webhook Shopify — statut de commande valide + erreurs détaillées
- Fix webhook Shopify — le middleware redirigeait /api vers /login
- Sync Shopify — script scripts/shopify-ping.mjs (vérif token Admin API depuis .env.local)
- Sync Shopify — route TEMPORAIRE d'obtention du token Admin API par OAuth
- Sync Shopify Étapes 4-5 — endpoint webhook + mapping des commandes
- Sync Shopify Étape 3 — lib/shopify/sku.ts (parseSku + resolveOeuvre) + types 0017
- Sync Shopify — migration 0017 (EXPAND) : catalogue/programmation + tables de sync

## 2026-09-16

- Portail — fix boucle de redirection (ERR_TOO_MANY_REDIRECTS) sur /portail/login

## 2026-09-14

- Fiche artiste — le champ « Nom » reste le pseudo (app), le contrat prend le nom + prénom du bloc identité + champ Code postal
- Fiche artiste & contrat — statut administratif (SIRET / Maison des Artistes / artiste-auteur) + pseudo

## 2026-09-10

- Automatisations dashboard — 4 nouvelles règles
- Tâches artiste — nom de l'artiste dans le titre de la checklist d'accueil (+ retrait du sous-titre redondant, titre nettoyé sur la fiche artiste)
- Automatisation — signature d'un artiste crée une checklist d'accueil (tasks liées à l'artiste) + bloc Tâches sur la fiche + bouton manuel
- Fiche artiste — bloc 'Photo & bio' : aperçu + téléchargement de la photo, affichage de la biographie
- Prospection — resynchronise le tableau/kanban avec les données serveur (recherche, filtres et tri s'appliquent enfin)

## 2026-09-07

- Œuvres — fix 413 à l'ajout d'un visuel : réduction de l'image dans le navigateur avant envoi + garde anti-crash + bodySizeLimit Server Actions

## 2026-08-17

- Auth admin — flux 'mot de passe oublié' + page /reset-password (callback intelligent admin/portail)
- Contrats — fix ENOENT polices sur Vercel : inclusion des polices dans la fonction (outputFileTracingIncludes) + repli URL publique

## 2026-08-02

- Prospection — retire colonnes Style + 1er contact, ajoute bouton Supprimer sur chaque ligne
- Prospection — sélecteur 'Trier par' (récents, anciens, prochain drop, étape, nom)
- Prospection — toggle 'pour les prochains drop' en ligne (étoile cliquable) sans passer par la modale
- Œuvres — downscale des visuels au stockage (sharp, max 1600px JPEG q78) : aperçus légers (~100Ko au lieu de plusieurs Mo) ; existants reprocessés
- Œuvres — aperçu fluide : images servies optimisées/redimensionnées via next/image (miniature légère + modale WebP), plus de chargement du master HD brut

## 2026-08-01

- Œuvres — sélecteur artiste limité aux signés + upload du visuel possible dès la création
- Œuvres — aperçu visuel en modale au clic (catalogue, fiche artiste, fiche drop) + choix 'œuvre existante / nouvelle' à l'ajout dans un drop
- Œuvres — catalogue global indépendant des drops (vue Œuvres) : créer/éditer avec drop optionnel + rattachement ; drop devient un champ du formulaire
- Prospection — champ 'Pour les prochains drop' (dans_le_pipe) : case dans le form + filtre + étoile (tableau & kanban)
- Prospection — clic sur un prospect ouvre le drawer d'édition (mode prospect) au lieu de la fiche artiste
- Prospection — création prospect: phase masquée (forcée prospect) + retour vers /prospection ; tri par date de création (récents d'abord) ; statut pipeline masqué hors phase prospect
- Prospection — colonne Instagram cliquable (tableau + carte Kanban) pour prospecter plus vite
- Artistes — basculement Liste (tableau, défaut) / Cartes pour passer à l'échelle
- Typo — corps en DM Sans (Google Font) à la place d'Azeret Mono
- Migration 0013 — recrée artists_with_stats sans contacted_by puis drop la colonne
- Migration 0012 — reporte le drop contacted_by (dépendance vue artists_with_stats) en 0013
- Équipe & Projet — profils admin liés (display_name/avatar_initials), module Tâches (liste/kanban/commentaires/générateur), nettoyage contacted_by & Tom
- Contrats — logo aldo vectoriel, titres DM Sans gras bleu, aération + anti-orphelin, retrait Taux en garde, fusion formats A3/A4 en annexe
- Contrats — script de seed/test bout-en-bout (fiche Diane + génération)
- Contrats (4) — génération/statuts côté admin (fiche artiste) + champs identité/IBAN + portail lecture
- Contrats (1-3) — migration schéma + génération PDF brandée (@react-pdf + pdf-lib), template juridique complet

## 2026-07-31

- Prospection — retire 'Contacté par' partout (Kanban, formulaire, filtre) sans écraser la donnée existante
- Prospection — retire la colonne 'Contacté par' du tableau
- Import Notion prospects — migration (dans_le_pipe_notion) + script d'import CSV

## 2026-07-15

- Oeuvre — remplacer le fichier HD côté admin (nouvelle version validée + aperçu régénéré)
- Oeuvre — retire l'upload manuel du visuel (vient de la validation du fichier artiste)
- Fichiers — auto-aperçu de l'oeuvre à la validation + téléchargement HD (ligne drop + panneau oeuvre)
- Fichiers — statut œuvre dérivé des dépôts réels (fin du doublon file_status stocké)
- Fichiers — validation relie l'oeuvre (file_status) + encart 'Fichiers en attente' sur la fiche artiste
- Portail — container pleine largeur + masquer le CA (commissions uniquement)
- Portail — callback client (template par défaut, jetons dans le hash) pour reset mot de passe
- Portail — flux réinitialisation de mot de passe (callback + page + lien oublié)
- Paramètres — coûts unitaires éditables + réappliquer sur un drop
- Responsive : sidebar admin en drawer mobile + tables scrollables
- Perf : région Vercel EU + dédup de la session
- Keep-alive Supabase (GitHub Action)
- Fix middleware timeout Vercel (MIDDLEWARE_INVOCATION_TIMEOUT)

## 2026-07-08

- Préparation au déploiement
- Portail — footer sticky en bas + en-têtes plus aérés
- Portail — sidebar en bleu Aldo + grain
- Portail — sidebar gauche (layout app) au lieu de la navbar horizontale
- Refonte graphique — identité Aldo (fondations)

## 2026-07-02

- Portail — Fichiers & Profil + validation admin (prompt 15)
- Portail — Œuvres & Ventes (prompt 14)
- Supprimer la policy permissive Allow all (RLS)
- Portail — Dashboard artiste enrichi (prompt 13)
- Activer RLS sur les tables métier (portail)
- Portail artiste — Sous-phase A (socle & sécurité)

## 2026-07-01

- Fix récursion infinie RLS sur profiles
- Fix bootstrapping du 1er admin (trigger rôles)
- Phase 6 — Module Finances (P&L)
- Phase 5 — Module Charges
- Phase 4 — Module Commandes & Impressions
- Refonte Prospection / Artistes (séparation des rôles)
- Phase 3 — Module Prospection & Suivi
- Phase 2 — Module Drops & Œuvres
- Phase 1 — Module Artistes
- Phase 0 — fondations Aldo Éditions admin
