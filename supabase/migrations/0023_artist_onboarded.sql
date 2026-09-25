-- ============================================================
-- Migration 0023 — Onboarding artiste (affiché une seule fois)
--
-- `onboarded_at` : date à laquelle l'artiste a vu et validé son écran d'accueil
-- de bienvenue. Null = première connexion → on l'envoie sur /portail/onboarding.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.artists
  add column if not exists onboarded_at timestamptz;
