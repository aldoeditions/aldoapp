-- ============================================================
-- Migration 0025 — Régime social de l'artiste + n° sécurité sociale chiffré.
--
-- `social_regime` pilote le PRÉCOMPTE :
--   • artiste_auteur_precompte → Aldo précompte (cas par défaut)
--   • artiste_auteur_dispense  → dispense de précompte (attestation Urssaf) → 0
--   • bnc_siret                → déclare lui-même (facture, TVA/BNC) → pas de précompte
--   • autre                    → cas particulier, pas de précompte auto
--
-- Le n° de sécurité sociale est stocké CHIFFRÉ (AES-256-GCM côté app), jamais
-- en clair ; on ne garde en clair que les 4 derniers chiffres pour l'affichage
-- masqué. Remplace à terme is_maison_des_artistes / mda_number, CONSERVÉS ici
-- (pas de drop) le temps de basculer l'UI et le contrat.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.artists
  add column if not exists social_regime text not null default 'artiste_auteur_precompte'
    check (social_regime in (
      'artiste_auteur_precompte',
      'artiste_auteur_dispense',
      'bnc_siret',
      'autre'
    )),
  add column if not exists social_security_number_enc text,  -- AES-256-GCM (base64)
  add column if not exists social_security_last4 text;        -- 4 derniers chiffres (masqué)

-- Reprise : les artistes non artiste-auteur avec un SIRET déclarent eux-mêmes.
update public.artists
  set social_regime = 'bnc_siret'
  where social_regime = 'artiste_auteur_precompte'
    and coalesce(is_artiste_auteur, true) = false
    and coalesce(siret, '') <> '';
