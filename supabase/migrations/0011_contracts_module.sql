-- Module « Génération de contrats PDF ».
-- Données nécessaires au contrat + table IBAN sécurisée + champs contrats.

/* ------------------------------------------------------------------ */
/* 1. artists : identité civile requise par le contrat                 */
/* ------------------------------------------------------------------ */
alter table public.artists
  add column if not exists civility    text,
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists birth_date  date,
  add column if not exists birth_place text,
  add column if not exists mda_number  text;

-- Civilité contrainte (null autorisé → on affiche juste le nom).
alter table public.artists drop constraint if exists artists_civility_check;
alter table public.artists add constraint artists_civility_check
  check (civility is null or civility in ('Madame', 'Monsieur'));

-- Backfill prénom / nom depuis `name` (1er mot = prénom, reste = nom).
-- `name` est conservé (affichage partout). Corrigeable ensuite via le formulaire.
update public.artists
set first_name = split_part(name, ' ', 1),
    last_name  = nullif(btrim(regexp_replace(name, '^\S+\s*', '')), '')
where (first_name is null and last_name is null) and name is not null;

/* ------------------------------------------------------------------ */
/* 2. artist_banking : IBAN/BIC (donnée sensible, table séparée)       */
/* ------------------------------------------------------------------ */
create table if not exists public.artist_banking (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null unique references public.artists(id) on delete cascade,
  iban       text not null,
  bic        text,
  updated_at timestamptz not null default now()
);

alter table public.artist_banking enable row level security;

-- Lecture/écriture : admin (profiles.role='admin') OU l'artiste lui-même.
drop policy if exists "artist_banking_admin" on public.artist_banking;
create policy "artist_banking_admin" on public.artist_banking
  for all
  using (public.is_admin() or artist_id = public.current_artist_id())
  with check (public.is_admin() or artist_id = public.current_artist_id());

/* ------------------------------------------------------------------ */
/* 3. contracts : lien campagne + métadonnées de génération            */
/* ------------------------------------------------------------------ */
alter table public.contracts
  add column if not exists drop_id      uuid references public.drops(id),
  add column if not exists generated_at timestamptz,
  add column if not exists pdf_path     text;

-- commission_pct existe déjà : on fixe le défaut à 30.
alter table public.contracts alter column commission_pct set default 30;

-- Statut du document contrat : brouillon → envoyé → signé.
update public.contracts set status = 'brouillon'
  where status is null or status not in ('brouillon', 'envoyé', 'signé');
alter table public.contracts drop constraint if exists contracts_status_check;
alter table public.contracts add constraint contracts_status_check
  check (status in ('brouillon', 'envoyé', 'signé'));

-- Le bucket Storage « contracts » existe déjà (migration 0009).
