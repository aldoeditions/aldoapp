-- ============================================================
-- Migration 0006 — ACTIVER RLS sur les tables métier
--
-- Les policies (0002/0005) existaient mais RLS n'était pas ENABLED sur ces
-- tables → elles étaient inertes et tout le monde voyait tout. Cette migration
-- active RLS ; les policies par-artiste / équipe s'appliquent alors vraiment.
-- Idempotent (réactiver une table déjà activée est sans effet).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.artists       enable row level security;
alter table public.oeuvres       enable row level security;
alter table public.drops         enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.params        enable row level security;
alter table public.charges       enable row level security;
alter table public.artist_files  enable row level security;
alter table public.contracts     enable row level security;
alter table public.payments      enable row level security;
-- profiles : déjà activé en 0001
