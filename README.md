# Aldo Éditions — Administration & Portail Artiste

Plateforme interne d'**Aldo Éditions** (e-commerce d'affiches d'artistes en édition limitée), en deux espaces :

- **Back-office admin** (`/`) — réservé à l'équipe : prospection, artistes, drops & œuvres, commandes & impressions, finances (P&L), charges, paramètres.
- **Portail artiste** (`/portail`) — réservé aux artistes signés : profil & RIB, dépôt de fichiers HD, ventes & commissions en temps réel, contrats, calendrier.

## Stack

- **Next.js 14** (App Router, Server Actions) · **TypeScript**
- **Supabase** (PostgreSQL + Auth + Storage), sécurité par **RLS**
- **Tailwind CSS** · **recharts**
- Typos : Archivo Black (titres) + Azeret Mono (corps)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# puis renseigner les 3 variables (voir ci-dessous)

# 3. Lancer en développement
npm run dev            # http://localhost:3000

# Autres scripts
npm run build          # build de production
npm run start          # serveur de production
npm run lint           # ESLint
```

## Variables d'environnement

Voir [`.env.example`](.env.example). À placer dans `.env.local` (jamais commité) :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (publique) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon publique (navigateur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role — **secrète, serveur uniquement** (upload Storage, invitations) |

Valeurs disponibles dans **Supabase → Project Settings → API**.

## Base de données Supabase

### Migrations

À exécuter **dans l'ordre** dans **Supabase → SQL Editor** (dossier [`supabase/migrations/`](supabase/migrations/)) :

| # | Fichier | Rôle |
|---|---|---|
| 0001 | `profiles.sql` | Table `profiles` (rôles) + trigger d'auto-création + fonction `is_admin()` |
| 0002 | `rls_business_tables.sql` | Policies RLS des tables métier |
| 0003 | `fix_role_bootstrap.sql` | Fix bootstrap du 1er admin |
| 0004 | `fix_profiles_rls_recursion.sql` | Fix récursion RLS `profiles` |
| 0005 | `portail_foundations.sql` | Portail : rôle `artist`, liaison `artists.user_id`, RLS par-artiste, RIB, dates d'impression |
| 0006 | `enable_rls.sql` | Active RLS sur les tables métier |
| 0007 | `drop_allow_all.sql` | Supprime la policy permissive « Allow all » |
| 0008 | `artist_sales_view.sql` | Vue sécurisée `artist_sales` (ventes artiste sans coûts/clients) |
| 0009 | `files_contracts.sql` | Verrou dépôt fichiers + policies bucket `contracts` |

### Buckets Storage

À créer dans **Supabase → Storage** :

- `artist-assets` — **public** (avatars, visuels d'œuvres)
- `artist-files` — **privé** (fichiers HD déposés par les artistes)
- `contracts` — **privé** (PDF de contrats)

### Rôles

Le champ `profiles.role` vaut `admin` · `marketing` · `creatif` (équipe) ou `artist`.
Pour créer le premier admin, voir `0003_fix_role_bootstrap.sql` (`update … set role = 'admin'`).
Les artistes sont invités depuis le back-office (fiche artiste → **Inviter au portail**), ce qui crée leur compte et le lie à leur fiche.

## Sécurité

- **RLS par-artiste** : chaque artiste n'accède qu'à ses propres données (œuvres, ventes, contrats, paiements, fichiers) ; l'équipe a l'accès complet via `is_team()`.
- Les coûts de production, marges et données clients ne sont **jamais** exposés côté artiste (vue `artist_sales`).
- La clé `service_role` reste côté serveur (Server Actions uniquement).

## Déploiement (Vercel)

1. Importer le repo sur [Vercel](https://vercel.com).
2. Renseigner les 3 variables d'environnement (Project Settings → Environment Variables).
3. Déployer (build : `npm run build`).
4. S'assurer que toutes les migrations et les buckets Supabase sont en place.

---

_Équipe : Louison (admin) · Tom (marketing) · Charley (créatif). Commission artiste : 30 %. Formats : A3 (40 €) · A4 (25 €)._
