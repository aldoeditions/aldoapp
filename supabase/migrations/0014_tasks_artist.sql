-- Lien optionnel d'une tâche à un artiste (checklist d'accueil, suivi artiste).
alter table public.tasks
  add column if not exists artist_id uuid references public.artists(id) on delete cascade;

create index if not exists tasks_artist_id_idx on public.tasks (artist_id);
