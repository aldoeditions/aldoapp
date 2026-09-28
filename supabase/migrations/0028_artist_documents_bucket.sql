-- ============================================================
-- Migration 0028 — Bucket privé `artist-documents` (pièces sensibles).
--
-- Attestations Urssaf, dispenses de précompte, justificatifs d'identité…
-- Bucket PRIVÉ, accessible UNIQUEMENT à l'équipe Aldo (jamais aux artistes,
-- jamais public). Les URLs se génèrent par lien signé côté serveur.
--
-- NB : la contribution diffuseur dans le P&L est calculée côté application
-- (lib/data/finances.ts) à partir du barème daté — pas de vue à réécrire ici.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('artist-documents', 'artist-documents', false)
  on conflict (id) do nothing;

drop policy if exists "artist_documents_team_read" on storage.objects;
create policy "artist_documents_team_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'artist-documents' and public.is_team());

drop policy if exists "artist_documents_team_insert" on storage.objects;
create policy "artist_documents_team_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-documents' and public.is_team());

drop policy if exists "artist_documents_team_update" on storage.objects;
create policy "artist_documents_team_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'artist-documents' and public.is_team());

drop policy if exists "artist_documents_team_delete" on storage.objects;
create policy "artist_documents_team_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'artist-documents' and public.is_team());
