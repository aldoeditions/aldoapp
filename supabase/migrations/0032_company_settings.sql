-- ============================================================
-- Migration 0032 — Paramètres société (émetteur des documents légaux).
--
-- Infos de l'émetteur pour les relevés de droits d'auteur, certificats, etc.
-- (jamais codées en dur). Table singleton (une seule ligne, id = 1).
-- Source : fiche INSEE/INPI Aldo Éditions. ⚠️ Le siège affiché est l'adresse de
-- correspondance fournie (Saint-Cyr-sur-Loire), à distinguer du siège RNE.
-- Le greffe RCS (`rcs_city`) reste à confirmer → laissé null pour l'instant.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create table if not exists public.company_settings (
  id           int primary key default 1 check (id = 1),
  name         text not null,
  legal_form   text,                 -- SAS
  capital_cents bigint,              -- 1000 = 10,00 €
  siren        text,
  siret        text,
  tva_intra    text,
  ape          text,                 -- 47.91A
  rcs_city     text,                 -- greffe RCS (à confirmer)
  address_line text,
  postal_code  text,
  city         text,
  country      text default 'France',
  email        text,
  updated_at   timestamptz default now()
);

alter table public.company_settings enable row level security;

drop policy if exists company_settings_team_read on public.company_settings;
create policy company_settings_team_read on public.company_settings
  for select using (public.is_team());

drop policy if exists company_settings_team_write on public.company_settings;
create policy company_settings_team_write on public.company_settings
  for all using (public.is_team()) with check (public.is_team());

insert into public.company_settings
  (id, name, legal_form, capital_cents, siren, siret, tva_intra, ape, address_line, postal_code, city, email)
values
  (1, 'Aldo Éditions', 'SAS', 1000, '992745844', '99274584400017', 'FR81992745844', '47.91A',
   '4 rue Henri Lebrun', '37540', 'Saint-Cyr-sur-Loire', 'contact@aldo-editions.com')
on conflict (id) do nothing;
