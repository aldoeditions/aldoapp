-- Code postal séparé de la ville (adresse du contrat).
alter table public.artists
  add column if not exists postal_code text;
