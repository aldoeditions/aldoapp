-- ============================================================
-- Migration 0027 — Versements en CENTIMES + décomposition précompte/net.
--
-- Un versement = la rémunération BRUTE artiste (les 30 % du prix HT), moins le
-- précompte retenu, = le NET versé. La contribution diffuseur est stockée pour
-- mémoire (coût Aldo, jamais retenu à l'artiste, jamais montré au portail).
-- On fige le barème appliqué (social_rate_id) pour la traçabilité et on garde
-- l'année de rattachement (period_year) pour le plafond annuel de vieillesse.
--
-- Montants en CENTIMES ENTIERS (bigint) : plus d'arrondis flottants.
-- L'ancienne colonne `amount` (euros) est CONSERVÉE et reprise en centimes.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.payments
  add column if not exists gross_cents bigint,                          -- rémunération brute artiste
  add column if not exists precompte_cents bigint not null default 0,   -- retenu à l'artiste
  add column if not exists contribution_diffuseur_cents bigint not null default 0, -- coût Aldo
  add column if not exists net_cents bigint,                            -- net versé = gross - precompte
  add column if not exists social_rate_id uuid references public.social_rates(id),
  add column if not exists period_year int;

-- Reprise de l'existant : `amount` en euros → centimes. Les anciens versements
-- n'avaient pas de précompte, donc net = brut et précompte = 0.
update public.payments
  set gross_cents = round(coalesce(amount, 0) * 100)::bigint,
      net_cents   = round(coalesce(amount, 0) * 100)::bigint,
      period_year = coalesce(period_year, extract(year from coalesce(paid_at, created_at, now()))::int)
  where gross_cents is null;
