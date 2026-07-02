-- ============================================================
-- Migration 0009 — Dépôt de fichiers & contrats (portail)
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

-- 1. Un artiste ne peut déposer un fichier qu'au statut « en attente »
--    (il ne peut jamais s'auto-valider). La validation reste équipe-only.
drop policy if exists "artist_files_artist_insert" on public.artist_files;
create policy "artist_files_artist_insert" on public.artist_files for insert
  to authenticated
  with check (
    artist_id = public.current_artist_id() and status = 'en attente'
  );

-- 2. Storage bucket "contracts" (créé via API) : équipe = tout ;
--    artiste = lecture de son propre dossier /{artist_id}/.
drop policy if exists "contracts_read" on storage.objects;
create policy "contracts_read" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'contracts'
    and (
      public.is_team()
      or (storage.foldername(name))[1] = public.current_artist_id()::text
    )
  );

drop policy if exists "contracts_write" on storage.objects;
create policy "contracts_write" on storage.objects for all
  to authenticated
  using (bucket_id = 'contracts' and public.is_team())
  with check (bucket_id = 'contracts' and public.is_team());
