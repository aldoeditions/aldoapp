# CLAUDE.md — App de gestion Aldo Éditions

Ce fichier présente le projet à Claude, que ce soit Claude Code dans ce dépôt ou Claude dans la conversation Cowork du projet « Aldo ». Lis-le en entier avant toute modification, puis lis `REPRISE.md` (où on en est) et le haut de `CHANGELOG.md` (ce qui a changé récemment).

---

## 1. Le projet en deux minutes

**Aldo Éditions** (SAS, siège à Cenon, atelier en Indre-et-Loire) édite des affiches d'artistes en séries limitées. Louison (direction, production, relation artistes) et Charley (créatif, réseaux sociaux, B2B) font tourner le projet à deux.

**Le modèle par campagnes (« drops »)** :

- Chaque mois, une sélection d'artistes est mise en avant (5 à 8 en temps normal, 16 pour le drop 3).
- Leurs affiches restent en vente 30 jours.
- À la clôture, Aldo imprime tout en une fois à l'atelier (Epson P900, papier Innova 210 g), puis expédie les commandes groupées.
- Le délai entre l'achat et la réception est d'environ 6 semaines. C'est assumé et c'est annoncé au client.

**Prix et argent** :

- Deux formats : A4 à 25 € TTC, A3 à 40 € TTC.
- L'artiste touche **30 % du prix HT**, soit 6,25 € par A4 et 10,00 € par A3. Le port est exclu.
- Licence non exclusive, un contrat par campagne.

**Calendrier** :

| Campagne | Dates |
| --- | --- |
| Drop 1 (C1) | 29/09 → 27/10/2026 |
| Drop 2 (C2) | 28/10 → 25/11/2026 |
| Drop 3 (C3) | Démarrage fin novembre 2026, contrats à signer avant le 26/11 |

## 2. L'écosystème autour de l'app

| Brique | Rôle | Lien avec l'app |
| --- | --- | --- |
| **Webflow** (aldo-editions.com) | Site vitrine et fiches affiches (CMS Affiches, Artistes) | Aucun lien direct pour l'instant (prévu : push des artistes et des dates) |
| **Shopify** | Panier, paiement, commandes | Webhook `/api/webhooks/shopify` → `orders` / `order_items`. La liaison se fait par SKU. |
| **Smootify** | Relie Webflow et Shopify | Synchronise certains champs Webflow : ne jamais les écraser |
| **Supabase** | Base Postgres, Auth, Storage | Cœur de l'app (offre gratuite, keep-alive GitHub Action tous les 3 jours) |
| **Vercel** | Hébergement, région `cdg1` | Déploiement depuis `main` |
| **Google Drive** | `ALDO/Artistes/C{n}_{Prénom Nom}/{Visuels, Contrats}` | Lien Drive saisi sur la fiche artiste (`artists.drive_link`) |
| **Signature électronique** | Goodflag Community jusqu'ici. Passage prévu à Youtrust (ex-Yousign). | Manuel : l'app génère le PDF, le contrat signé est redéposé dans l'app |
| **Qonto** | Banque de la SAS | Virements aux artistes faits à la main (export groupé prévu) |
| **Claude (Cowork)** | Supervise, prépare, tient les fiches du projet « Aldo » | Lit ce dépôt en lecture seule chaque matin (fiche « État de l'app Aldo ») |

## 3. Stack technique

- **Next.js 14** (App Router, Server Actions), **TypeScript**, **Tailwind**, **recharts**.
- **Supabase** : `@supabase/ssr` et `@supabase/supabase-js`, sécurité par **RLS**.
  - `lib/supabase/server.ts` : client avec la session de l'utilisateur. À utiliser par défaut.
  - `lib/supabase/admin.ts` : client `service_role`, côté serveur uniquement. Réservé au Storage, aux invitations et aux données sensibles.
- **PDF** : `@react-pdf/renderer` + `pdf-lib`, rendus côté serveur. Les polices sont dans `public/fonts`, incluses dans la fonction Vercel via `outputFileTracingIncludes`.
- **Images** : `sharp`. Les visuels sont réduits à 1600 px au stockage et servis via `next/image`.
- Les polices de l'UI sont auto-hébergées avec `next/font/local`.
- La limite des Server Actions est relevée à 5 Mo. Vercel plafonne de toute façon autour de 4,5 Mo.

### Variables d'environnement (`.env.local` et Vercel, jamais commitées)

| Variable | Usage |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Client admin. Serveur uniquement. |
| `ARTIST_DATA_KEY` | Clé AES-256-GCM pour chiffrer le n° de sécurité sociale (`lib/crypto.ts`) |
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET` | API Admin Shopify et vérification HMAC du webhook |
| `NEXT_PUBLIC_SITE_URL` | URL publique (liens d'invitation et de réinitialisation) |

## 4. Organisation du code

```
app/
  (app)/          back-office équipe : dashboard, projet, social, prospection, artistes,
                  drops (+ relevés), oeuvres, commandes, finances (+ urssaf), charges, parametres (+ shopify)
  portail/        portail artiste : profil, onboarding, fichiers, oeuvres, ventes, releves,
                  contrats, calendrier, evenements
  api/webhooks/shopify/   réception des commandes Shopify
  login, reset-password, auth/callback
components/       un dossier par module (artists, contracts, drops, orders, portail…) + ui, layout, brand
lib/
  auth/           session, permissions (matrice rôle × module)
  data/           lecture des données par module (une fonction = une requête métier)
  contracts/      génération du contrat PDF (template, body, generate)
  royalties/      relevés de droits d'auteur, certificat de précompte
  releve/, print/ PDF annexes (relevé, liste d'impression)
  shopify/        client, sync, sku, csv
  constants.ts    règles commerciales (prix, TVA, commission, frais de paiement)
  crypto.ts, fiscal.ts, format.ts
supabase/migrations/   SQL numéroté 0001 → 0034, à lancer à la main dans le SQL Editor
scripts/          selftests (fiscal, royalties, shopify), seed/test contrat, import Notion
types/database.ts types générés Supabase
```

**Les conventions de code existantes :**

- Les **Server Actions** sont dans des fichiers `actions.ts` placés à côté des pages, par exemple `app/(app)/artistes/contract-actions.ts`.
- Chaque action d'écriture commence par vérifier les droits : `requireUser()` puis `canEdit(user.role, "<module>")`.
- Une action renvoie `{ error?: string }` au lieu de lever une erreur vers l'UI. Elle appelle `revalidatePath` après chaque écriture.
- Les montants de paiement sont stockés **en centimes** (migration 0027). Les arrondis se font **par ligne** (relevés).
- Les textes sont en français, dans le ton Aldo : phrases courtes, aucun superlatif.

## 5. Données (Supabase)

**Les tables principales :**

| Domaine | Tables |
| --- | --- |
| Artistes | `artists` (fiche, pipeline, statut social, `sku_code`, `drive_link`, `commission_pct`, `user_id`) · `artist_banking` (IBAN, sensible) · `artist_files` (dépôts HD) · `artist_events` · `artist_precompte_exemptions` |
| Catalogue | `oeuvres` · `drops` · `drop_oeuvres` (programmation d'une œuvre dans une campagne, avec son prix et son taux ; permet les rééditions) |
| Ventes | `orders` · `order_items` (unicité anti-doublon depuis la migration 0034) · `webhook_events` · `sync_log` |
| Argent | `payments` (centimes) · `royalty_statements` (+ `royalty_sequence`) · `charges` · `params` (coûts unitaires) · `company_settings` |
| Contrats | `contracts` (`artist_id`, `drop_id`, `status` brouillon / envoyé / signé, `pdf_path`, `file_path` du signé, dates) |
| Social et équipe | `social_posts` · `social_rates` · `tasks` / `task_comments` (module masqué) · `profiles` (rôles) |
| Vues | `artist_sales` (ventes vues par l'artiste, sans coûts ni clients) · `artists_with_stats` · `oeuvre_stats(_total)` · `drop_pnl` |

**Les buckets Storage :**

- `artist-assets` : public (avatars, visuels).
- `artist-files` : privé (fichiers HD).
- `contracts` : privé (contrats générés et signés).
- Un bucket de documents artistes (migration 0028).

**Rôles** (`profiles.role`) :

- `admin` : Louison et Charley, accès total.
- `marketing`, `creatif` : rôles prévus pour plus tard (voir `lib/auth/permissions.ts`).
- `artist` : accès au portail uniquement. La RLS limite chaque artiste à ses propres lignes.

**Les SKU** suivent le format `ALDO-{CODE_ARTISTE}-{NUM}-{FORMAT}`, par exemple `ALDO-DC-001-A4`. C'est la clé entre Shopify et l'app. Un SKU inconnu ne doit jamais faire échouer le traitement d'une commande.

## 6. Règles absolues

1. **Les données sensibles** (IBAN, n° de sécurité sociale, adresse personnelle des artistes) :
   - ne sont jamais affichées ailleurs qu'à leur place prévue ;
   - ne sont jamais loguées, jamais envoyées à un service tiers ;
   - ne sont jamais exposées dans une API ou un futur serveur MCP.
   Le n° de sécu reste chiffré.
2. **Côté artiste** (portail, relevés, e-mails), on ne montre jamais les coûts, les marges, la contribution diffuseur ni les données clients. On passe par `artist_sales`.
3. **On ne supprime pas de données métier sans confirmation.** Une migration est additive par défaut (EXPAND, puis CONTRACT plus tard), numérotée à la suite et idempotente quand c'est possible.
4. **Shopify** : l'export CSV « format Shopify » ne doit pas servir à réimporter sur des produits existants, car il écrase les visuels. Les produits sont créés par les skills de lancement de campagne de Claude.
5. **Les secrets** ne sont jamais commités. Seul `.env.example` donne la liste des variables.
6. **Le contrat** est un document juridique rédigé par l'avocate. On ne modifie pas son texte (`lib/contracts/body.ts`) sans demande explicite de Louison.

## 7. Workflow de travail avec Claude Code

**Au début d'une session :**

1. `git pull`.
2. Lire `REPRISE.md`, puis le haut de `CHANGELOG.md`.
3. Annoncer en 3 lignes où on en est et ce qu'on va faire.

**Pendant :**

- Un commit par évolution cohérente, avec un message en français au format `Module — ce qui change`.
- Une migration SQL se signale clairement : elle doit être lancée à la main dans Supabase.

**À chaque commit poussé sur `main`**, mets à jour `CHANGELOG.md` dans le même commit. Sous la date du jour (AAAA-MM-JJ, plus récent en haut), ajoute une ligne par changement :

```
- Module — ce qui change pour l'utilisateur (état : terminé | en cours) · tables/migrations : … · à faire à la main : …
```

**En fin de session** (ou quand Louison dit « on s'arrête », « je change de machine »), mets à jour `REPRISE.md` :

- la date et la machine ;
- ce qui a été fait ;
- ce qui est en cours, avec le fichier et l'étape précise ;
- les prochaines étapes, par ordre de priorité ;
- les actions manuelles en attente (SQL, Vercel, Supabase) ;
- les décisions prises.

Commit, puis push : `Reprise — <date>`.

`CLAUDE.md` est mis à jour seulement quand quelque chose de **durable** change : un nouveau module, une nouvelle intégration, une nouvelle règle, ou un changement de stack.

## 8. Lien avec la conversation Claude (Cowork)

- Claude (Cowork) lit ce dépôt chaque matin et tient la fiche « État de l'app Aldo » dans le projet Claude « Aldo ». Il ne pousse rien dans le dépôt.
- Les décisions prises dans la conversation Cowork qui concernent l'app sont recopiées par Louison dans la section « Décisions venues de Claude (Cowork) » de `REPRISE.md`.
- Les autres fiches du projet Claude « Aldo » sont la référence pour le business : récapitulatif complet, plan d'automatisation, bilan des ventes, audit SEO, accès Instagram.
