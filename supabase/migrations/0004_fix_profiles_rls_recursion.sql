-- ============================================================
-- Migration 0004 — Fix récursion infinie RLS sur profiles
--
-- La policy "profiles_select_admin" (migration 0001) faisait un
-- `select ... from profiles` À L'INTÉRIEUR d'une policy sur profiles →
-- récursion infinie (42P17). Conséquence : TOUTE lecture de profil par un
-- utilisateur authentifié échouait, et l'app retombait sur le rôle par
-- défaut « creatif » — quel que soit le vrai rôle en base.
--
-- Fix : utiliser une fonction is_admin() en SECURITY DEFINER (contourne la
-- RLS, donc pas de récursion).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());
