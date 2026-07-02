-- ============================================================
-- Migration 0007 — Supprimer la policy permissive « Allow all »
--
-- Une policy "Allow all" (for all to public using true) traînait sur les
-- tables (créée via l'assistant Supabase au début du projet). Comme les
-- policies se combinent en OR, ce `true` donnait accès à TOUT le monde et
-- annulait la RLS par-artiste. On la supprime partout.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

drop policy if exists "Allow all" on public.artists;
drop policy if exists "Allow all" on public.oeuvres;
drop policy if exists "Allow all" on public.drops;
drop policy if exists "Allow all" on public.orders;
drop policy if exists "Allow all" on public.order_items;
drop policy if exists "Allow all" on public.params;
drop policy if exists "Allow all" on public.charges;
drop policy if exists "Allow all" on public.artist_files;
drop policy if exists "Allow all" on public.contracts;
drop policy if exists "Allow all" on public.payments;
drop policy if exists "Allow all" on public.profiles;
