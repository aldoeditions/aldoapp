# Changelog

Évolutions notables de l'application de gestion **Aldo Éditions**.
Généré depuis l'historique Git (messages de commit). Dates au format AAAA-MM-JJ, plus récent en haut.

## 2026-11-24

- Contrat — article 8.2 (limitation de responsabilité) : la parenthèse d'exclusions du plafond ajoute « toute atteinte par Aldo aux droits d'auteur, patrimoniaux et moraux, de l'Artiste sur les Œuvres », en plus des dommages corporels, de la violation des droits de tiers (art. 6) et de la faute lourde ou dolosive. Demande explicite de Louison (règle 6 de CLAUDE.md) (état : terminé) · fichiers : `lib/contracts/body.ts` · à faire à la main : **les contrats déjà générés (brouillon) ou déjà envoyés en signature portent l'ancien texte** — régénérer les brouillons, et pour les contrats déjà « envoyés », utiliser « Annuler l'envoi » (ci-dessous) puis renvoyer si le nouveau texte doit s'appliquer
- Contrats — action « Annuler l'envoi » sur un contrat au statut « envoyé » (fiche campagne, bouton par ligne ; outil MCP `annuler_envoi` avec `confirm`) : archive la soumission DocuSeal, repasse le contrat en brouillon et régénère son PDF avec les données ACTUELLES de la fiche (régime social compris) (état : terminé, à tester en réel) · fichiers : `lib/docuseal/signature.ts` (`cancelContractSending`), `app/(app)/drops/[id]/contract-actions.ts`, `components/drops/DropContractsPanel.tsx`, `lib/mcp/tools.ts` · à faire à la main : aucune
- MCP `etat_campagne` — chaque œuvre renvoyée inclut désormais son SKU (`ALDO-XXX-NNN-A3/A4`) (état : terminé) · fichiers : `lib/data/drop-oeuvres.ts`, `lib/mcp/tools.ts` · à faire à la main : aucune

## 2026-11-23

- Signature — la contre-signature Aldo part **toujours** vers `company_settings.email` (contact@aldo-editions.com), que l'envoi vienne du bouton de l'app ou du connecteur MCP (plus l'e-mail de l'admin connecté). Erreur claire si `company_settings.email` est vide. Le « Tester la signature » continue d'utiliser l'adresse de l'admin connecté pour les deux rôles (état : terminé) · fichiers : `lib/docuseal/signature.ts`, `app/(app)/drops/[id]/contract-actions.ts` · à faire à la main : aucune (vérifier que `company_settings.email` = contact@aldo-editions.com)
- Signature — e-mails : nouveau message aux artistes (ton Aldo, lien de signature seul sur sa ligne) et **message distinct pour le contre-signataire Aldo** (objet « À contresigner — contrat C{n} {Prénom Nom} », corps court) via `submitters[].message` (confirmé dans la doc). « Tester la signature » utilise désormais **exactement le même gabarit** que l'envoi réel, avec un faux artiste « Test Aldo » (tu vois le vrai rendu). Garde-fou étendu : tout corps d'e-mail personnalisé doit contenir `{{submitter.link}}`. Gabarit unique partagé `buildSignatureMessages()` (état : terminé, à tester en réel) · **doc vérifiée** : le format du corps (Markdown/HTML) n'est PAS documenté → texte brut, URL seule sur sa ligne ; le logo de l'e-mail n'est pas un champ API → à régler dans le **branding du compte DocuSeal** · fichiers : `lib/docuseal/{signature,client}.ts` · à faire à la main : régler le logo/branding dans DocuSeal ; régénérer les brouillons puis retester
- Signature — placement des champs par **coordonnées** (repli après échec des balises de texte, non détectées à cause de la police sous-ensemblée de @react-pdf). Les signatures sont désormais sur une **page dédiée, toujours la dernière** du contrat (position fixe, géométrie partagée `lib/contracts/signature-layout.ts`) : DocuSeal place les champs signature Artiste (droite) et Aldo (gauche) via `documents[].fields[].areas` (ratios 0–1, page = dernière page calculée par pdf-lib). Balises de texte retirées du template (plus aucun texte parasite dans le PDF). Lien `{{submitter.link}}` ajouté au corps des e-mails (réel + test) + garde-fou qui refuse l'envoi si le lien manque. Le test archive automatiquement le test précédent (`DELETE /submissions/{id}`) et relit la soumission via l'API pour confirmer les 2 signataires (Artiste + Aldo), résultat affiché dans l'app (état : terminé, à tester en réel) · fichiers : `lib/contracts/signature-layout.ts` (nouveau), `lib/contracts/template.tsx`, `lib/docuseal/{client,signature}.ts` · à faire à la main : **régénérer les brouillons du drop 3** (nouvelle mise en page) puis refaire le test
- Signature — Phase 2 du connecteur : signature électronique via **DocuSeal** (compte docuseal.com, hôte `api.docuseal.com`). Le PDF du contrat porte deux balises de champ signature ajoutées au template — **Artiste** puis **Aldo** (contre-signature) — retirées du PDF signé via `remove_tags`. L'app crée la soumission DocuSeal à deux signataires (`order: preserved` : l'artiste signe d'abord, Aldo ensuite), et un webhook signé (HMAC) horodate chaque signature (`form.completed`) puis, quand **les deux** ont signé (`submission.completed`), range le PDF signé + le journal d'audit dans le bucket `contracts` et passe le contrat à « signé ». Message aux artistes personnalisé (tutoiement, campagne, 30 % du prix HT). Nouveaux boutons sur la fiche campagne : « Régénérer les brouillons » (ajoute les balises aux contrats déjà générés — jamais les envoyés/signés), « Tester la signature » (s'envoie les deux rôles à soi, sans rien modifier) et « Envoyer en signature ». Outils MCP : `envoyer_contrats_en_signature` (aperçu = artistes + e-mails + nb d'œuvres ; contre-signature Aldo = `company_settings.email` ; `confirm` obligatoire) et `suivi_signatures` (distingue « signé par l'artiste » et « signé par Aldo »). Le connecteur MCP ne voit jamais le PDF ni l'IBAN (état : terminé, à tester en réel) · fichiers : `lib/docuseal/*`, `app/api/webhooks/docuseal/route.ts`, `lib/contracts/service.ts` (régénération), `lib/contracts/template.tsx` · tables/migrations : 0036 (`contracts.docuseal_submission_id`, `audit_log_path`, `artist_signed_at`, `aldo_signed_at` ; table `docuseal_events`) · **vérifié dans la doc DocuSeal avant de coder** : en-tête `X-Auth-Token`, `POST /submissions/pdf`, webhook HMAC `X-Docuseal-Signature` · à faire à la main : jouer 0036 ; régénérer `types/database.ts` ; copier la valeur HMAC `whsec_…` dans `DOCUSEAL_WEBHOOK_SECRET` (Vercel) ; régler la langue du compte DocuSeal sur le français ; déclarer le webhook vers `/api/webhooks/docuseal` (`form.completed` + `submission.completed`) ; **régénérer les brouillons du drop 3** (pour la balise Aldo) puis faire le test
- Contrats & MCP — correction rééditions : les œuvres d'une campagne sont désormais lues via la programmation (`drop_oeuvres`) et non plus via `oeuvres.drop_id`. L'annexe des contrats et l'outil MCP `etat_campagne` incluent les œuvres reprogrammées (rééditions) ; sur le drop 3, Josué Confort et Mathieu Pauget remontent avec leurs 4 œuvres (ignorées jusqu'ici). Garde-fou : aucun contrat n'est généré avec une annexe vide (artiste listé dans « ignorés : aucune œuvre programmée »). `generer_contrats_manquants` accepte un `artist_ids` optionnel et détaille l'annexe de chaque contrat dans l'aperçu (état : terminé) · fichiers : `lib/data/drop-oeuvres.ts` (nouveau helper `getProgrammedOeuvres`, source unique), `lib/contracts/service.ts`, `lib/mcp/tools.ts` · relevés et liste d'impression déjà corrects (basés sur les ventes) · à faire à la main : aucune
- MCP — Phase 1 du connecteur Aldo : serveur MCP de l'app (`/api/mcp`, Streamable HTTP, mcp-handler 2.x) authentifié par OAuth 2.1 (Supabase Auth), avec page de consentement `/oauth/consent` aux couleurs d'Aldo, métadonnée de ressource protégée RFC 9728, et 7 outils — lecture : `lister_campagnes`, `etat_campagne`, `lister_contrats`, `ventes_campagne`, `etat_app` ; écriture (avec aperçu obligatoire via `confirm`) : `generer_contrats_manquants`, `marquer_contrats_envoyes`. Aucune donnée sensible exposée (liste blanche + garde-fou testé) ; chaque appel journalisé. Réutilise la logique existante des contrats (source unique) (état : terminé, à tester en réel une fois le serveur OAuth Supabase activé) · tables/migrations : 0035 (`mcp_audit_log`) · dépendances : mcp-handler, @modelcontextprotocol/server, zod · à faire à la main : jouer 0035 ; activer « OAuth Server » dans Supabase (beta, offre gratuite) ; régénérer `types/database.ts` ; ajouter le connecteur dans Claude
- Contrats — article 21 (signature électronique) : la plateforme n'est plus nommée, formulation neutre conforme au règlement eIDAS ; le portail artiste mentionne désormais Youtrust au lieu de Goodflag (état : terminé) · à faire à la main : aucune (aucun contrat du drop 3 encore généré, rien à régénérer)
- Contrats — gestion en lot depuis la fiche campagne : tableau par artiste (statut, dates), « Générer les contrats manquants » (un par un, avec progression et erreurs), zip des brouillons nommés `C{n}_Prénom Nom_Contrat.pdf`, « Marquer tous comme envoyés », dépôt groupé des PDF signés rattachés par nom de fichier (accents/casse/suffixes tolérés, aperçu avant enregistrement) (état : terminé) · dépendance : jszip · à faire à la main : aucune
- Docs — CLAUDE.md et REPRISE.md relus contre le code (exacts) ; convention CHANGELOG (§7) appliquée à la section 2026-11-17 (état : terminé) · à faire à la main : aucune

## 2026-11-17

- Relevés — les ventes sont rattachées à la campagne de la commande (et non à la campagne d'origine de l'œuvre) : les rééditions sont comptées correctement (état : terminé) · à faire à la main : aucune
- Commandes — fiabilisation des lignes Shopify : upsert idempotent par ligne, fin des doublons (« 2 pièces » au lieu d'1) et du double comptage dans les relevés (état : terminé) · tables/migrations : 0034 (dédoublonnage + index d'unicité sur `order_items.shopify_line_item_id`) · à faire à la main : jouer 0034 dans le SQL Editor (faite le 23/11)
- Commandes — suppression de la notion de « vagues d'impression » (onglet, colonne, champ) (état : terminé) · à faire à la main : aucune (colonne `orders.wave` laissée dormante)
- Campagnes — nouvel export PDF « liste d'impression » (aperçu des visuels + quantités à imprimer, depuis la fiche campagne) (état : terminé) · à faire à la main : aucune
- Tâches — module masqué (menu, dashboard, fiche artiste) en attendant une refonte ; routes et données conservées (état : terminé) · à faire à la main : aucune
- Typo — polices de l'UI auto-hébergées (`next/font/local`) : la typo ne retombe plus en police système si Google Fonts est injoignable au build (état : terminé) · à faire à la main : redéployer

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
