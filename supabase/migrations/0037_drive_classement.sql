-- 0037_drive_classement.sql
-- Classement automatique des contrats signés dans Google Drive (Phase 3 du
-- connecteur Aldo). Additif, idempotent. À lancer à la main dans le SQL Editor
-- Supabase.

-- 1. Nom de dossier Drive de l'artiste (les dossiers existants ne suivent pas
--    tous la convention « C{n}_{Nom affiché} » : ce champ permet de corriger
--    le nom recherché sans renommer la fiche). Vide par défaut ; l'UI
--    pré-remplit avec le nom affiché, mais ne force rien en base.
alter table public.artists
  add column if not exists drive_folder_name text;

-- 2. Suivi du classement Drive sur les contrats.
alter table public.contracts
  add column if not exists drive_file_id        text,                     -- PDF signé déposé dans Drive
  add column if not exists drive_audit_file_id   text,                     -- journal d'audit déposé dans Drive
  add column if not exists drive_classed_at      timestamptz,              -- date de classement
  add column if not exists drive_folder_missing  boolean not null default false; -- dossier artiste introuvable à la dernière tentative
