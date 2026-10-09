-- ============================================================
-- Migration 0031 — Événements artistes (pour le post « Agenda » mensuel).
--
-- Chaque artiste peut partager les événements auxquels il participe (expo,
-- sortie de livre, salon, atelier…). L'équipe les agrège le 1er du mois pour
-- le post Agenda (micro-édition + événements de nos artistes).
--
-- RLS : l'équipe voit/édite tout ; l'artiste gère UNIQUEMENT ses propres events.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create table if not exists public.artist_events (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  type text,                               -- expo / sortie / salon / atelier / autre
  event_date date,
  end_date date,
  location text,
  url text,
  note text,
  status text not null default 'proposé'   -- proposé / retenu / passé
    check (status in ('proposé', 'retenu', 'passé')),
  created_at timestamptz default now()
);

create index if not exists artist_events_artist_idx on public.artist_events(artist_id);
create index if not exists artist_events_date_idx on public.artist_events(event_date);

alter table public.artist_events enable row level security;

-- Équipe : accès total.
drop policy if exists artist_events_team_all on public.artist_events;
create policy artist_events_team_all on public.artist_events
  for all using (public.is_team()) with check (public.is_team());

-- Artiste : ses propres événements seulement.
drop policy if exists artist_events_owner_select on public.artist_events;
create policy artist_events_owner_select on public.artist_events
  for select using (artist_id = public.current_artist_id());

drop policy if exists artist_events_owner_insert on public.artist_events;
create policy artist_events_owner_insert on public.artist_events
  for insert with check (artist_id = public.current_artist_id());

drop policy if exists artist_events_owner_update on public.artist_events;
create policy artist_events_owner_update on public.artist_events
  for update using (artist_id = public.current_artist_id())
  with check (artist_id = public.current_artist_id());

drop policy if exists artist_events_owner_delete on public.artist_events;
create policy artist_events_owner_delete on public.artist_events
  for delete using (artist_id = public.current_artist_id());
