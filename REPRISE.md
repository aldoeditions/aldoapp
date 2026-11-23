# REPRISE.md — Où on en est

Ce fichier sert à reprendre le travail sur n'importe quelle machine, dans Claude Code comme dans la conversation Claude (Cowork). Il est mis à jour à la fin de chaque session, puis commité et poussé.

---

## Dernière mise à jour

**23/11/2026**, Claude Code (machine de Louison, Windows).
Dernier commit : article 21 du contrat — signature électronique sans nom de plateforme (ce jour). Dernière migration : `0034_order_items_dedup` (jouée).

## Priorité du moment : les contrats du drop 3 (avant le 26/11)

- **16 artistes** : Aglaé Rochette, Amélie Pichon, Ben Coosmans, Clément Causse, Elma Boisumeau, Félix Godefroy, Jeanne Guérard, Jeanne Tocqueville, Josué Fontaine, Julie Jup, Laure Lesage, Lucas Burtin, Marie-Lou Garcia, Matthieu Ossona, Nina Baldo, Tara Keogh.
- **FAIT (23/11)** : section « Contrats » sur la fiche campagne (`app/(app)/drops/[id]`). Tableau par artiste (statut + dates), bouton « Générer les contrats manquants » (progression + erreurs, ne régénère jamais), zip des brouillons `C{n}_Prénom Nom_Contrat.pdf`, « Marquer tous comme envoyés », dépôt groupé des PDF signés rattachés par nom de fichier (accents/casse/suffixes tolérés, aperçu avant enregistrement). Réutilise `generateContract` / `markContractSent` / `markContractSigned` (source unique). Nouveaux fichiers : `lib/data/drop-contracts.ts`, `lib/contracts/filename.ts`, `components/drops/DropContractsPanel.tsx`, `app/(app)/drops/[id]/contract-actions.ts`, route zip `app/(app)/drops/[id]/contracts/zip/route.ts`. Dépendance ajoutée : `jszip`.
- **Reste à faire pour Louison** : compléter l'identité des artistes dont la fiche est incomplète (le tableau signale « Identité incomplète »), puis générer, envoyer en signature, et déposer les signés.
- **Signature** : passage à **Youtrust** (ex-Yousign) acté côté app (le portail mentionne Youtrust ; le contrat art. 21 ne nomme plus la plateforme, formulation eIDAS neutre — 23/11). Reste la décision d'offre : Plus un mois (~30 € HT) pour les 16 envois, puis One (11 €/mois) ; essai gratuit 14 jours à vérifier.
- **Classement** : chaque contrat signé est déposé dans l'app, puis dans le Drive `ALDO/Artistes/C3_{Prénom Nom}/Contrats/`. Claude (Cowork) peut s'en charger via le connecteur Google Drive, une fois celui-ci connecté au compte Google d'Aldo.
- **À corriger dans le Drive** : renommer « C3_Josué Fontainte » en « C3_Josué Fontaine ». Harmoniser « C3_Jeanne Guérard » et « C2_Jeanne Guerrard » sur l'orthographe de la fiche identité.

## En cours / prochaines étapes

1. **Serveur MCP de l'app**, pour que Claude (Cowork) puisse lire et agir. Approche retenue : un connecteur sur mesure dans l'app, et non le connecteur Supabase officiel, qui donnerait accès aux IBAN. Actions visées : lister les drops et leurs contrats, générer les contrats, marquer envoyé ou signé, déposer un PDF signé. Aucun IBAN, aucun n° de sécu. Le prompt est à rédiger par Claude (Cowork).
2. **Avant le drop 3, côté site** : badges Nouveau / Bientôt fini / Terminé calculés à partir des dates Webflow, et clôture automatique dans Shopify à la date de fin.
3. **Décembre** : push des produits vers Shopify et des artistes vers Webflow depuis l'app, export des virements groupés vers Qonto, envoi automatique des relevés.
4. **Janvier** : chaîne d'impression (contrôle des fichiers, TIFF A3 et A4 avec marges, liste d'impression), résumé hebdomadaire par Claude.

## Actions manuelles en attente

- Aucune migration en attente connue après la 0034.
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
