-- ============================================================
-- Migration 0020 — Module Réseaux sociaux (calendrier des posts Instagram)
--
-- Un post = un contenu planifié à une date, lié à une campagne, avec un lien
-- Drive vers les ressources. À la création d'un post, une tâche « Créer le
-- visuel du post » est générée automatiquement (échéance = date − 7 j).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create table if not exists public.social_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  caption       text,
  post_date     date not null,
  status        text not null default 'en préparation'
                check (status in ('en préparation', 'prêt à poster', 'posté')),
  format        text check (format in ('post', 'carrousel', 'reel', 'story')),
  drive_link    text,
  drop_id       uuid references public.drops(id) on delete set null,
  created_by_id uuid references public.profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists social_posts_post_date_idx on public.social_posts (post_date);
create index if not exists social_posts_drop_id_idx   on public.social_posts (drop_id);

-- Lien tâche → post (la tâche « Créer le visuel » est supprimée avec le post).
alter table public.tasks
  add column if not exists social_post_id uuid references public.social_posts(id) on delete cascade;
create index if not exists tasks_social_post_id_idx on public.tasks (social_post_id);

-- RLS : équipe uniquement.
alter table public.social_posts enable row level security;
drop policy if exists "social_posts_team" on public.social_posts;
create policy "social_posts_team" on public.social_posts for all
  using (public.is_team()) with check (public.is_team());
