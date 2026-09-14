-- Statut administratif de l'artiste (contrat) + pseudo.
-- La plupart des artistes sont autoentrepreneurs (SIRET) et pas inscrits à la
-- Maison des Artistes ; certains n'ont pas le statut artiste-auteur.
alter table public.artists
  add column if not exists pseudo text,
  add column if not exists siret text,
  add column if not exists is_maison_des_artistes boolean not null default false,
  add column if not exists is_artiste_auteur boolean not null default true;
