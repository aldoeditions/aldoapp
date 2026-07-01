-- ============================================================
-- Migration 0001 — Table profiles (rôles équipe)
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

-- 1. Table profiles : 1 ligne par utilisateur Auth, porte le rôle.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz default now(),
  email       text not null,
  name        text,
  role        text not null default 'creatif'
              check (role in ('admin', 'marketing', 'creatif')),
  avatar_url  text
);

comment on table public.profiles is 'Profil applicatif lié à auth.users — porte le rôle (admin/marketing/creatif).';

-- 2. Row Level Security
alter table public.profiles enable row level security;

-- Chacun lit son propre profil…
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

-- …et tout admin lit tous les profils.
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Chacun met à jour son nom/avatar (pas son rôle : géré par trigger ci-dessous).
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Empêche un non-admin de modifier son propre rôle.
create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    -- Autorise : service_role / SQL editor (auth.uid() nul) ET les admins.
    -- Bloque uniquement un utilisateur AUTHENTIFIÉ non-admin qui tente de
    -- changer un rôle (évite le blocage de bootstrapping du 1er admin).
    if auth.uid() is not null
       and not exists (
         select 1 from public.profiles p
         where p.id = auth.uid() and p.role = 'admin'
       ) then
      new.role := old.role; -- ignore silencieusement la tentative
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- 3. Auto-création du profil à l'inscription d'un utilisateur Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'creatif')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. Après avoir créé les comptes (Auth > Users) pour Louison,
--    Tom et Charley, assigner les rôles :
--
--   update public.profiles set role = 'admin'     where email = 'louison@...';
--   update public.profiles set role = 'marketing' where email = 'tom@...';
--   update public.profiles set role = 'creatif'   where email = 'charley@...';
-- ============================================================
