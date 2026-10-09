-- ============================================================
-- Migration 0030 — Contenu artiste pour l'onboarding guidé.
--
-- • questionnaire  : réponses aux 10 questions « mieux te connaître »
--                    (remplace le Google Form) — { "q1": "...", ... }.
-- • studio_photos  : photos d'atelier (chemins dans le bucket PUBLIC
--                    artist-assets) réutilisées pour le site et les réseaux —
--                    [ "studio/<artist>/....jpg", ... ].
-- • onboarding_step: étape courante du wizard de première connexion (reprise).
--
-- Colonnes non protégées par protect_artist_columns → l'artiste peut les
-- renseigner lui-même (comme bio/iban/statut social).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.artists
  add column if not exists questionnaire jsonb,
  add column if not exists studio_photos jsonb,
  add column if not exists onboarding_step int;
