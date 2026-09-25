-- ============================================================
-- Migration 0022 — Description d'œuvre par l'artiste (+ validation admin)
--
-- L'artiste rédige la description de ses œuvres depuis son portail. Flux :
--   'à écrire'  → l'artiste doit la rédiger (rappel dans son portail)
--   'à valider' → soumise par l'artiste, en attente de relecture admin
--   'validée'   → validée par l'équipe (utilisable sur la boutique)
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.oeuvres
  add column if not exists description text,
  add column if not exists description_status text not null default 'à écrire'
    check (description_status in ('à écrire', 'à valider', 'validée'));

create index if not exists oeuvres_description_status_idx
  on public.oeuvres (description_status);
