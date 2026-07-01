-- ============================================================
-- Migration 0002 — Verrouillage RLS des tables métier
--
-- Contexte : RLS est actuellement DÉSACTIVÉ sur les tables métier.
-- Conséquence : la clé anon (publique, embarquée côté navigateur)
-- permet de lire/écrire toute la base sans être connecté.
--
-- Cette migration active RLS et réserve l'accès aux utilisateurs
-- AUTHENTIFIÉS (session valide). L'app back-office utilise la session
-- authentifiée → elle continue de fonctionner. La clé anon seule est
-- verrouillée.
--
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

do $$
declare
  t text;
  tables text[] := array[
    'artists', 'drops', 'oeuvres', 'orders', 'order_items',
    'params', 'charges', 'artist_files', 'contracts', 'payments'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "authenticated_all" on public.%I;', t);
    execute format(
      'create policy "authenticated_all" on public.%I
         for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;

-- ============================================================
-- Storage — bucket « artist-assets »
-- Lecture publique (bucket public) + écriture réservée aux authentifiés.
-- (L'app uploade côté serveur via la clé service_role, mais ces policies
--  gardent le bucket propre pour tout accès direct.)
-- ============================================================

drop policy if exists "artist_assets_read" on storage.objects;
create policy "artist_assets_read"
  on storage.objects for select
  using (bucket_id = 'artist-assets');

drop policy if exists "artist_assets_write" on storage.objects;
create policy "artist_assets_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-assets');

drop policy if exists "artist_assets_update" on storage.objects;
create policy "artist_assets_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'artist-assets');

drop policy if exists "artist_assets_delete" on storage.objects;
create policy "artist_assets_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'artist-assets');
