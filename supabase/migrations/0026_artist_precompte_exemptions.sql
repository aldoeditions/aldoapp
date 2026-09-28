-- ============================================================
-- Migration 0026 — Dispenses de précompte (datées + pièce justificative).
--
-- Un artiste peut fournir une attestation Urssaf le dispensant de précompte
-- sur une période. Quand une dispense est active à la DATE du versement, Aldo
-- ne précompte pas (mais paie toujours sa contribution diffuseur).
-- La pièce justificative va dans le bucket privé `artist-documents` (0028).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create table if not exists public.artist_precompte_exemptions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  motif text not null,
  valid_from date not null,
  valid_to date,                 -- null = sans échéance
  document_path text,            -- chemin dans le bucket privé artist-documents
  created_at timestamptz default now()
);

create index if not exists artist_precompte_exemptions_artist_idx
  on public.artist_precompte_exemptions(artist_id);

alter table public.artist_precompte_exemptions enable row level security;

drop policy if exists ape_team_all on public.artist_precompte_exemptions;
create policy ape_team_all on public.artist_precompte_exemptions
  for all using (public.is_team()) with check (public.is_team());
