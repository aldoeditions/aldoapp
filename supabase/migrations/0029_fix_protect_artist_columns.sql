-- ============================================================
-- Migration 0029 — Corrige protect_artist_columns (colonne fantôme).
--
-- La version LIVE de la fonction référençait encore `new.contacted_by`, une
-- colonne supprimée depuis. Comme le trigger ne s'exécute que pour les comptes
-- NON équipe, toute mise à jour d'un artiste sur SON profil échouait avec
-- « record "new" has no field "contacted_by" » (les admins n'étaient pas
-- affectés). On recrée la fonction sans cette colonne.
--
-- Colonnes protégées (non modifiables par l'artiste) : identité de compte,
-- commission, phase et statuts pilotés par l'équipe. Le régime social, le n° de
-- sécu et le SIRET NE SONT PAS protégés : l'artiste peut les renseigner.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

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
