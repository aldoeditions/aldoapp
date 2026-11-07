-- ============================================================
-- Migration 0033 — Relevés de droits d'auteur (RDA).
--
-- Un relevé par artiste et par campagne : brouillon (recalculable) → émis
-- (numéroté RDA-YYYY-NNNN, montants figés en snapshot, PDF) → payé (rattaché à
-- un versement). Jamais de modification d'un relevé émis : on émet un
-- rectificatif qui référence l'original. Montants en CENTIMES.
-- À exécuter dans Supabase > SQL Editor (après 0032).
-- ============================================================

-- Assujettissement TVA (cas rare) — avertissement, pas de gestion auto en v1.
alter table public.artists
  add column if not exists tva_assujetti boolean not null default false;

/* ------------------------------------------------------------------ */
/* 1. Numérotation séquentielle, continue et gap-free, par année       */
/* ------------------------------------------------------------------ */
create table if not exists public.royalty_sequence (
  year     int primary key,
  last_seq int not null default 0
);
alter table public.royalty_sequence enable row level security;
drop policy if exists royalty_sequence_team on public.royalty_sequence;
create policy royalty_sequence_team on public.royalty_sequence
  for all using (public.is_team()) with check (public.is_team());

-- Incrément atomique → sûr même en génération concurrente.
create or replace function public.next_royalty_seq(p_year int)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into public.royalty_sequence(year, last_seq) values (p_year, 1)
  on conflict (year) do update set last_seq = public.royalty_sequence.last_seq + 1
  returning last_seq into v;
  return v;
end;
$$;

/* ------------------------------------------------------------------ */
/* 2. Table des relevés                                                */
/* ------------------------------------------------------------------ */
create table if not exists public.royalty_statements (
  id           uuid primary key default gen_random_uuid(),
  number       text,                 -- RDA-2026-0001 (null tant que brouillon)
  year         int,                  -- année d'émission (séquence)
  seq          int,                  -- rang dans l'année
  artist_id    uuid not null references public.artists(id) on delete restrict,
  drop_id      uuid not null references public.drops(id) on delete restrict,
  status       text not null default 'brouillon'
               check (status in ('brouillon', 'émis', 'payé', 'annulé')),

  -- Snapshot FIGÉ à l'émission (null tant que brouillon → recalcul à la volée).
  total_ht_cents               bigint,
  commission_pct               numeric(6,3),
  brut_cents                   bigint,
  precompte_cents              bigint,
  net_cents                    bigint,
  contribution_diffuseur_cents bigint,
  exempt                       boolean,
  social_rate_id               uuid references public.social_rates(id),
  lines                        jsonb,   -- lignes de vente (snapshot)
  breakdown                    jsonb,   -- détail précompte par cotisation

  -- Non-résident / TVA : l'émission est bloquée tant que le traitement n'est
  -- pas choisi par l'admin (géré côté application).
  non_resident           boolean not null default false,
  non_resident_treatment text,
  tva_assujetti_snapshot boolean,

  -- Cycle de vie / journalisation (qui, quand).
  note         text,
  created_at   timestamptz default now(),
  created_by   uuid references public.profiles(id),
  issued_at    timestamptz,
  issued_by    uuid references public.profiles(id),
  payment_id   uuid references public.payments(id),
  paid_at      timestamptz,
  rectifies_id uuid references public.royalty_statements(id), -- rectificatif → original
  pdf_path     text
);

create index if not exists royalty_statements_artist_idx on public.royalty_statements(artist_id);
create index if not exists royalty_statements_drop_idx on public.royalty_statements(drop_id);
create index if not exists royalty_statements_status_idx on public.royalty_statements(status);

-- Un seul relevé PRIMAIRE (non rectificatif, non annulé) par artiste/campagne.
create unique index if not exists royalty_statements_primary_uniq
  on public.royalty_statements (artist_id, drop_id)
  where rectifies_id is null and status <> 'annulé';
-- Numéro et rang uniques (continuité, anti-concurrence).
create unique index if not exists royalty_statements_number_uniq
  on public.royalty_statements (number) where number is not null;
create unique index if not exists royalty_statements_seq_uniq
  on public.royalty_statements (year, seq) where seq is not null;

alter table public.royalty_statements enable row level security;

-- Équipe : tout. Artiste : lecture de SES relevés ÉMIS/PAYÉS uniquement.
drop policy if exists royalty_statements_team on public.royalty_statements;
create policy royalty_statements_team on public.royalty_statements
  for all using (public.is_team()) with check (public.is_team());

drop policy if exists royalty_statements_artist_read on public.royalty_statements;
create policy royalty_statements_artist_read on public.royalty_statements
  for select using (
    artist_id = public.current_artist_id() and status in ('émis', 'payé')
  );

/* ------------------------------------------------------------------ */
/* 3. Bucket privé des PDF (chemin = {artist_id}/{id}.pdf)             */
/* ------------------------------------------------------------------ */
insert into storage.buckets (id, name, public)
  values ('royalty-statements', 'royalty-statements', false)
  on conflict (id) do nothing;

drop policy if exists "royalty_read" on storage.objects;
create policy "royalty_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'royalty-statements'
    and (public.is_team() or (storage.foldername(name))[1] = public.current_artist_id()::text)
  );

drop policy if exists "royalty_write" on storage.objects;
create policy "royalty_write" on storage.objects for all to authenticated
  using (bucket_id = 'royalty-statements' and public.is_team())
  with check (bucket_id = 'royalty-statements' and public.is_team());
