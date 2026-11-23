# REPRISE.md — Où on en est

Ce fichier sert à reprendre le travail sur n'importe quelle machine, dans Claude Code comme dans la conversation Claude (Cowork). Il est mis à jour à la fin de chaque session, puis commité et poussé.

---

## Dernière mise à jour

**23/11/2026**, Claude Code (machine de Louison, Windows).
Dernier commit : correction rééditions (œuvres d'une campagne via `drop_oeuvres`) pour les contrats et le MCP. Dernière migration : `0035_mcp_audit_log` (à jouer). `0034_order_items_dedup` est jouée.

## Priorité du moment : les contrats du drop 3 (avant le 26/11)

- **16 artistes** : Aglaé Rochette, Amélie Pichon, Ben Coosmans, Clément Causse, Elma Boisumeau, Félix Godefroy, Jeanne Guérard, Jeanne Tocqueville, Josué Fontaine, Julie Jup, Laure Lesage, Lucas Burtin, Marie-Lou Garcia, Matthieu Ossona, Nina Baldo, Tara Keogh.
- **FAIT (23/11)** : section « Contrats » sur la fiche campagne (`app/(app)/drops/[id]`). Tableau par artiste (statut + dates), bouton « Générer les contrats manquants » (progression + erreurs, ne régénère jamais), zip des brouillons `C{n}_Prénom Nom_Contrat.pdf`, « Marquer tous comme envoyés », dépôt groupé des PDF signés rattachés par nom de fichier (accents/casse/suffixes tolérés, aperçu avant enregistrement). Réutilise `generateContract` / `markContractSent` / `markContractSigned` (source unique). Nouveaux fichiers : `lib/data/drop-contracts.ts`, `lib/contracts/filename.ts`, `components/drops/DropContractsPanel.tsx`, `app/(app)/drops/[id]/contract-actions.ts`, route zip `app/(app)/drops/[id]/contracts/zip/route.ts`. Dépendance ajoutée : `jszip`.
- **Reste à faire pour Louison** : compléter l'identité des artistes dont la fiche est incomplète (le tableau signale « Identité incomplète »), puis générer, envoyer en signature, et déposer les signés.
- **Corrigé (23/11)** : les contrats (annexe) et le MCP prenaient les œuvres via `oeuvres.drop_id`, ce qui ignorait les rééditions programmées via `drop_oeuvres`. Désormais tout passe par la programmation (`drop_oeuvres`, helper `lib/data/drop-oeuvres.ts`). Vérifié sur le drop 3 : 18 artistes / 72 œuvres programmées ; Josué Confort et Mathieu Pauget (4 œuvres chacun, rééditions) remontent de nouveau. Garde-fou : aucun contrat à annexe vide.
- **Signature** : passage à **Youtrust** (ex-Yousign) acté côté app (le portail mentionne Youtrust ; le contrat art. 21 ne nomme plus la plateforme, formulation eIDAS neutre — 23/11). Reste la décision d'offre : Plus un mois (~30 € HT) pour les 16 envois, puis One (11 €/mois) ; essai gratuit 14 jours à vérifier.
- **Classement** : chaque contrat signé est déposé dans l'app, puis dans le Drive `ALDO/Artistes/C3_{Prénom Nom}/Contrats/`. Claude (Cowork) peut s'en charger via le connecteur Google Drive, une fois celui-ci connecté au compte Google d'Aldo.
- **À corriger dans le Drive** : renommer « C3_Josué Fontainte » en « C3_Josué Fontaine ». Harmoniser « C3_Jeanne Guérard » et « C2_Jeanne Guerrard » sur l'orthographe de la fiche identité.

## En cours / prochaines étapes

1. **Serveur MCP de l'app (connecteur Aldo)** — plan en 3 phases (prompt de Claude Cowork).
   - **Phase 1 FAITE (23/11)** : serveur MCP `/api/mcp` (mcp-handler 2.x, Streamable HTTP) authentifié OAuth 2.1 via Supabase Auth ; page de consentement `/oauth/consent` ; métadonnée RFC 9728 (`/.well-known/oauth-protected-resource`, réécrite depuis `/well-known/...`) ; 7 outils (5 lecture + 2 écriture avec `confirm`) ; garde-fou anti-fuite (`lib/mcp/redact.ts`, testé par `scripts/mcp-redaction-selftest.ts`) ; journal `mcp_audit_log`. Logique des contrats extraite dans `lib/contracts/service.ts` (source unique, réutilisée par les Server Actions ET le MCP). Build + tsc OK ; 401/RFC 9728 vérifiés en local. **Non testé en réel** tant que le serveur OAuth Supabase n'est pas activé et qu'un token admin n'est pas obtenu. Nouveaux fichiers : `lib/mcp/*`, `lib/supabase/bearer.ts`, `app/api/mcp/route.ts`, `app/well-known/oauth-protected-resource/route.ts`, `app/oauth/consent/*`.
   - **Vérifié avant de coder** : Supabase « OAuth 2.1 Server » est en **beta, inclus dans l'offre gratuite** (pas de surcoût ; les connexions comptent en MAU) ; DCR, PKCE, rotation des refresh tokens supportés. Le paquet s'appelle `@modelcontextprotocol/server@2` (et non `@modelcontextprotocol/sdk`) ; `zod@4` requis par mcp-handler 2.x (ajouté, aucun conflit car zod n'était pas utilisé).
   - **Reste (manuel, côté Louison) avant de tester** : voir « Actions manuelles en attente ».
   - **Phases 2 et 3** (à venir) : signature DocuSeal (EU Cloud, dès le drop 4) + classement Google Drive, puis outils MCP d'envoi/suivi/relance/synchro des signatures. Pour le drop 3 on reste sur l'essai Youtrust + envoi manuel.
2. **Avant le drop 3, côté site** : badges Nouveau / Bientôt fini / Terminé calculés à partir des dates Webflow, et clôture automatique dans Shopify à la date de fin.
3. **Décembre** : push des produits vers Shopify et des artistes vers Webflow depuis l'app, export des virements groupés vers Qonto, envoi automatique des relevés.
4. **Janvier** : chaîne d'impression (contrôle des fichiers, TIFF A3 et A4 avec marges, liste d'impression), résumé hebdomadaire par Claude.

## Actions manuelles en attente

- **Migration `0035_mcp_audit_log`** : à jouer dans le SQL Editor Supabase (journal du connecteur MCP).
- **Régénérer les types** après la migration : `npx supabase gen types typescript --project-id exdrjewvotwibqelogns > types/database.ts` (la table `mcp_audit_log` y a été ajoutée à la main en attendant).
- **Activer le serveur OAuth dans Supabase** (Authentication → OAuth Server) : activer, Authorization Path = `/oauth/consent`, activer la *Dynamic Client Registration*. Vérifier que le Site URL (Authentication → URL Configuration) pointe bien sur l'app en prod. Callback à autoriser côté clients : `https://claude.ai/api/mcp/auth_callback` (Claude) ; la DCR couvre le loopback `http://localhost:*` de Claude Code (Supabase n'accepte que des URL exactes, pas de jokers).
- **Ajouter le connecteur dans Claude** : Paramètres → Connecteurs → Ajouter un connecteur personnalisé → URL `https://app.aldo-editions.com/api/mcp`. Puis se connecter avec un compte **admin** (Louison ou Charley) et accepter sur la page de consentement. Test en ligne de commande possible : `npx @modelcontextprotocol/inspector` ou `claude mcp add --transport http aldo https://app.aldo-editions.com/api/mcp`.
- Le texte du contrat doit refléter les 30 % et assouplir la clause Maison des Artistes : à valider avec l'avocate.

## Décisions venues de Claude (Cowork)

À recopier ici quand une décision prise dans la conversation touche l'app.

- **07/11** : l'app est la source unique. Les automatisations prennent en charge ce qui suit une règle. Louison valide l'argent, le légal, la qualité et la publication.
- **07/11** : l'export CSV « format Shopify » ne sert pas en plus des skills de lancement, à cause du risque de doublons et d'écrasement des visuels.
- **23/11** : `CLAUDE.md`, `REPRISE.md` et `CHANGELOG.md` deviennent le socle de suivi. Claude (Cowork) lit le dépôt chaque matin (tâche planifiée à 7 h 22) et tient la fiche « État de l'app Aldo ».
- **23/11** : le classement Drive reste `C{n}_{Prénom Nom}/Contrats`, avec un dossier par campagne et par artiste.

## Historique des sessions

| Date | Machine | Résumé |
| --- | --- | --- |
| 23/11/2026 | Cowork | Création de CLAUDE.md et REPRISE.md, convention CHANGELOG, préparation des contrats du drop 3 |
| 23/11/2026 | Claude Code | Relecture CLAUDE.md/REPRISE.md, convention CHANGELOG appliquée, gestion des contrats en lot sur la fiche campagne (génération, zip, envoi, dépôt des signés) |
| 23/11/2026 | Claude Code | Contrat art. 21 : signature électronique sans nom de plateforme (eIDAS) ; portail → Youtrust. Drop 3 : aucun contrat encore généré, rien à régénérer |
| 23/11/2026 | Claude Code | MCP — Phase 1 du connecteur Aldo : serveur `/api/mcp` OAuth 2.1 (Supabase), consentement, 7 outils, garde-fou anti-fuite + journal. Vérif doc (OAuth Supabase gratuit/beta). Build + 401 RFC 9728 OK en local ; reste activation Supabase + ajout connecteur |
| 23/11/2026 | Claude Code | Correction rééditions : œuvres d'une campagne lues via `drop_oeuvres` (helper `getProgrammedOeuvres`) pour l'annexe des contrats et le MCP ; garde-fou annexe vide ; `generer_contrats_manquants` + `artist_ids` et annexe dans l'aperçu. Vérifié sur le drop 3 (Josué Confort, Mathieu Pauget). Build + tsc OK |
