-- ============================================================
-- Migration 0005 — Socle du Portail Artiste (auth, liaison, RLS par-artiste)
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

-- 1. Rôle 'artist' autorisé sur profiles (profiles existe déjà)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'marketing', 'creatif', 'artist'));

-- 2. Liaison compte ↔ artiste + RIB
alter table public.artists add column if not exists user_id uuid unique
  references auth.users (id) on delete set null;
alter table public.artists add column if not exists iban text;
alter table public.artists add column if not exists bic text;

-- 3. Dates d'impression sur le drop (calendrier artiste)
alter table public.drops add column if not exists date_impression_1 date;
alter table public.drops add column if not exists date_impression_2 date;

-- 4. Fonctions helper (SECURITY DEFINER → pas de récursion RLS)
create or replace function public.is_team()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'marketing', 'creatif')
  );
$$;

create or replace function public.current_artist_id()
returns uuid language sql security definer set search_path = public stable as $$
  select id from public.artists where user_id = auth.uid();
$$;

-- 5. Refonte RLS par-artiste (remplace la policy "authenticated_all")
-- artists : équipe = tout ; artiste = sa seule ligne (lecture + update)
drop policy if exists "authenticated_all" on public.artists;
drop policy if exists "artists_team" on public.artists;
drop policy if exists "artists_self_select" on public.artists;
drop policy if exists "artists_self_update" on public.artists;
create policy "artists_team" on public.artists for all
  using (public.is_team()) with check (public.is_team());
create policy "artists_self_select" on public.artists for select
  using (user_id = auth.uid());
create policy "artists_self_update" on public.artists for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- oeuvres : équipe = tout ; artiste = lecture de ses œuvres
drop policy if exists "authenticated_all" on public.oeuvres;
drop policy if exists "oeuvres_team" on public.oeuvres;
drop policy if exists "oeuvres_artist_read" on public.oeuvres;
create policy "oeuvres_team" on public.oeuvres for all
  using (public.is_team()) with check (public.is_team());
create policy "oeuvres_artist_read" on public.oeuvres for select
  using (artist_id = public.current_artist_id());

-- payments : équipe = tout ; artiste = lecture de ses paiements
drop policy if exists "authenticated_all" on public.payments;
drop policy if exists "payments_team" on public.payments;
drop policy if exists "payments_artist_read" on public.payments;
create policy "payments_team" on public.payments for all
  using (public.is_team()) with check (public.is_team());
create policy "payments_artist_read" on public.payments for select
  using (artist_id = public.current_artist_id());

-- contracts : équipe = tout ; artiste = lecture de ses contrats
drop policy if exists "authenticated_all" on public.contracts;
drop policy if exists "contracts_team" on public.contracts;
drop policy if exists "contracts_artist_read" on public.contracts;
create policy "contracts_team" on public.contracts for all
  using (public.is_team()) with check (public.is_team());
create policy "contracts_artist_read" on public.contracts for select
  using (artist_id = public.current_artist_id());

-- artist_files : équipe = tout ; artiste = lecture + dépôt (PAS de validation/update)
drop policy if exists "authenticated_all" on public.artist_files;
drop policy if exists "artist_files_team" on public.artist_files;
drop policy if exists "artist_files_artist_read" on public.artist_files;
drop policy if exists "artist_files_artist_insert" on public.artist_files;
create policy "artist_files_team" on public.artist_files for all
  using (public.is_team()) with check (public.is_team());
create policy "artist_files_artist_read" on public.artist_files for select
  using (artist_id = public.current_artist_id());
create policy "artist_files_artist_insert" on public.artist_files for insert
  with check (artist_id = public.current_artist_id());

-- drops : équipe = tout ; artiste = lecture des drops contenant ses œuvres
drop policy if exists "authenticated_all" on public.drops;
drop policy if exists "drops_team" on public.drops;
drop policy if exists "drops_artist_read" on public.drops;
create policy "drops_team" on public.drops for all
  using (public.is_team()) with check (public.is_team());
create policy "drops_artist_read" on public.drops for select
  using (
    exists (
      select 1 from public.oeuvres o
      where o.drop_id = drops.id and o.artist_id = public.current_artist_id()
    )
  );

-- orders / order_items / charges / params : équipe uniquement
drop policy if exists "authenticated_all" on public.orders;
drop policy if exists "orders_team" on public.orders;
create policy "orders_team" on public.orders for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "authenticated_all" on public.order_items;
drop policy if exists "order_items_team" on public.order_items;
create policy "order_items_team" on public.order_items for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "authenticated_all" on public.charges;
drop policy if exists "charges_team" on public.charges;
create policy "charges_team" on public.charges for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "authenticated_all" on public.params;
drop policy if exists "params_team" on public.params;
create policy "params_team" on public.params for all
  using (public.is_team()) with check (public.is_team());

-- 6. Trigger : un artiste ne peut PAS changer ses colonnes sensibles.
-- (auth.uid() nul = service_role/SQL → autorisé, pour l'invitation/liaison.)
create or replace function public.protect_artist_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_team() then
    new.user_id := old.user_id;
    new.commission_pct := old.commission_pct;
    new.phase := old.phase;
    new.pipe_status := old.pipe_status;
    new.contrat_status := old.contrat_status;
    new.type := old.type;
    new.renommee := old.renommee;
    new.contacted_by := old.contacted_by;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_artist_columns on public.artists;
create trigger trg_protect_artist_columns
  before update on public.artists
  for each row execute function public.protect_artist_columns();

-- 7. Storage : bucket privé "artist-files" (créé via API).
-- Équipe = tout ; artiste = lecture + dépôt dans son propre dossier /{artist_id}/
drop policy if exists "artist_files_bucket_team" on storage.objects;
create policy "artist_files_bucket_team" on storage.objects for all
  using (bucket_id = 'artist-files' and public.is_team())
  with check (bucket_id = 'artist-files' and public.is_team());

drop policy if exists "artist_files_bucket_read" on storage.objects;
create policy "artist_files_bucket_read" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'artist-files'
    and (storage.foldername(name))[1] = public.current_artist_id()::text
  );

drop policy if exists "artist_files_bucket_insert" on storage.objects;
create policy "artist_files_bucket_insert" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artist-files'
    and (storage.foldername(name))[1] = public.current_artist_id()::text
  );
