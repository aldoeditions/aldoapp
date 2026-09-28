-- ============================================================
-- Migration 0024 — Barème social artiste-auteur (diffuseur), DATÉ.
--
-- Quand Aldo verse des droits d'auteur à un artiste, elle agit comme
-- « diffuseur » : elle doit (1) PRÉCOMPTER les cotisations sociales de
-- l'artiste (part artiste, retenue sur la rémunération) et les reverser à
-- l'Urssaf, et (2) payer sa propre CONTRIBUTION DIFFUSEUR (coût Aldo).
--
-- Les taux changent chaque année → on ne les code JAMAIS en dur côté app.
-- On applique la ligne dont `effective_from` est la plus récente <= date du
-- versement. Assiette = rémunération BRUTE artiste (les 30 % du prix HT).
--
-- Source : Urssaf « Vos cotisations et contributions sociales en tant que
-- diffuseur » (page mise à jour le 23/03/2026).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create table if not exists public.social_rates (
  id uuid primary key default gen_random_uuid(),
  effective_from date not null unique,
  label text,

  -- Précompte — part ARTISTE (retenue par le diffuseur). Taux et assiette en %.
  vieillesse_plaf_taux       numeric(6,4) not null,               -- ex. 6.1500
  vieillesse_plaf_assiette   numeric(6,4) not null default 100,   -- 100 %
  plafond_ss_annuel_cents    bigint       not null,               -- 4806000 = 48 060 €
  vieillesse_deplaf_taux     numeric(6,4) not null default 0,     -- 0 % (pris en charge État)
  vieillesse_deplaf_assiette numeric(6,4) not null default 100,
  csg_taux                   numeric(6,4) not null,               -- 9.2000
  csg_assiette               numeric(6,4) not null default 98.25,
  crds_taux                  numeric(6,4) not null,               -- 0.5000
  crds_assiette              numeric(6,4) not null default 98.25,
  cfp_taux                   numeric(6,4) not null default 0.35,
  cfp_assiette               numeric(6,4) not null default 100,

  -- Contribution DIFFUSEUR (coût Aldo, NON retenue à l'artiste).
  contribution_diffuseur_taux numeric(6,4) not null default 1.10, -- 1 % + 0,10 % formation

  created_at timestamptz default now()
);

alter table public.social_rates enable row level security;

drop policy if exists social_rates_team_read on public.social_rates;
create policy social_rates_team_read on public.social_rates
  for select using (public.is_team());

drop policy if exists social_rates_team_write on public.social_rates;
create policy social_rates_team_write on public.social_rates
  for all using (public.is_team()) with check (public.is_team());

-- Barème 2026 (taux vérifiés sur urssaf.fr, MàJ 23/03/2026). Précompte ≈ 16,03 %.
insert into public.social_rates (
  effective_from, label,
  vieillesse_plaf_taux, plafond_ss_annuel_cents,
  csg_taux, crds_taux, cfp_taux,
  contribution_diffuseur_taux
) values (
  '2026-01-01', 'Taux 2026 (Urssaf, MàJ 23/03/2026)',
  6.15, 4806000,
  9.20, 0.50, 0.35,
  1.10
) on conflict (effective_from) do nothing;
