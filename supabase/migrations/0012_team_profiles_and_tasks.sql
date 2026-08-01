-- Équipe admin liée à de vrais profils + module de gestion de tâches.

/* ------------------------------------------------------------------ */
/* 1. profiles : display_name + avatar_initials                        */
/* ------------------------------------------------------------------ */
alter table public.profiles
  add column if not exists display_name    text,
  add column if not exists avatar_initials text;

update public.profiles
set display_name = coalesce(display_name, name, split_part(email, '@', 1))
where display_name is null;

update public.profiles
set avatar_initials = upper(
  left(split_part(display_name, ' ', 1), 1) ||
  coalesce(left(nullif(split_part(display_name, ' ', 2), ''), 1), '')
)
where avatar_initials is null and display_name is not null;

-- role accepte déjà admin/marketing/creatif/artist (cf. 0005). Rien à changer.

/* ------------------------------------------------------------------ */
/* 2. Liaison des comptes EXISTANTS (les users existent déjà)          */
/* ------------------------------------------------------------------ */
insert into public.profiles (id, email, role, name, display_name, avatar_initials)
select id, email, 'admin', 'Louison', 'Louison', 'LD' from auth.users
  where email = 'dupontlouison@gmail.com'
on conflict (id) do update
  set role = 'admin', display_name = 'Louison', avatar_initials = 'LD';

insert into public.profiles (id, email, role, name, display_name, avatar_initials)
select id, email, 'admin', 'Charley', 'Charley', 'CD' from auth.users
  where email = 'chly.dpnt@gmail.com'
on conflict (id) do update
  set role = 'admin', display_name = 'Charley', avatar_initials = 'CD';

/* ------------------------------------------------------------------ */
/* 3. Nettoyage contacted_by (plus utile — une seule personne prospecte)*/
/*    ⚠️ Le trigger protect_artist_columns le référence → le recréer    */
/*    SANS cette ligne AVANT de supprimer la colonne.                   */
/* ------------------------------------------------------------------ */
create or replace function public.protect_artist_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_team() then
    new.user_id := old.user_id;
    new.commission_pct := old.commission_pct;
    new.phase := old.phase;
    new.pipe_status := old.pipe_status;
    new.contrat_status := old.contrat_status;
    new.type := old.type;
    new.renommee := old.renommee;
  end if;
  return new;
end;
$$;

alter table public.artists drop column if exists contacted_by;

/* ------------------------------------------------------------------ */
/* 4. tasks                                                            */
/* ------------------------------------------------------------------ */
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  status        text not null default 'à faire'
                check (status in ('à faire', 'en cours', 'terminé')),
  priority      text check (priority in ('basse', 'normale', 'haute')),
  assignee_id   uuid references public.profiles(id) on delete set null,
  created_by_id uuid references public.profiles(id) on delete set null,
  drop_id       uuid references public.drops(id) on delete set null,
  due_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.tasks enable row level security;
drop policy if exists "tasks_team" on public.tasks;
create policy "tasks_team" on public.tasks for all
  using (public.is_team()) with check (public.is_team());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

/* ------------------------------------------------------------------ */
/* 5. task_comments                                                   */
/* ------------------------------------------------------------------ */
create table if not exists public.task_comments (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  author_id     uuid references public.profiles(id) on delete set null,
  author_legacy text,
  body          text not null,
  created_at    timestamptz not null default now()
);
alter table public.task_comments enable row level security;
drop policy if exists "task_comments_team" on public.task_comments;
create policy "task_comments_team" on public.task_comments for all
  using (public.is_team()) with check (public.is_team());
