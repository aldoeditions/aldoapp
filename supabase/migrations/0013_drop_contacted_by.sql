-- Suppression de la colonne artists.contacted_by (devenue inutile).
-- La vue artists_with_stats en dépend (elle sélectionne a.contacted_by) : on la
-- recrée à l'identique SANS cette colonne, puis on supprime la colonne.

drop view if exists public.artists_with_stats;

create view public.artists_with_stats as
  select
    a.id,
    a.created_at,
    a.updated_at,
    a.name,
    a.email,
    a.phone,
    a.instagram,
    a.portfolio_url,
    a.address,
    a.city,
    a.country,
    a.avatar_url,
    a.bio,
    a.type,
    a.style,
    a.renommee,
    a.phase,
    a.pipe_status,
    a.first_contact_date,
    a.first_contact_info,
    a.kit_impression,
    a.visuels,
    a.demande_infos,
    a.contrat_status,
    a.commission_pct,
    a.drive_link,
    a.dans_le_pipe,
    count(distinct o.id) as nb_oeuvres,
    coalesce(sum(o.nb_ventes), 0::bigint) as total_ventes,
    coalesce(sum(o.ca_brut), 0::numeric) as total_ca,
    coalesce(sum(o.ca_brut) * a.commission_pct / 100::numeric, 0::numeric) as total_remuneration
  from public.artists a
  left join public.oeuvres o on o.artist_id = a.id
  group by a.id;

-- Restaure l'accès API (drop/create view réinitialise les droits).
grant select on public.artists_with_stats to anon, authenticated, service_role;

-- Enfin, la colonne peut être supprimée.
alter table public.artists drop column if exists contacted_by;
