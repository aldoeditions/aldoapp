-- ============================================================
-- Migration 0018 — Statistiques basées sur les VRAIES ventes
--
-- Réécrit les 3 vues métier pour qu'elles calculent depuis les commandes
-- réelles (order_items → orders, payées) au lieu des colonnes stockées
-- oeuvres.nb_ventes / ca_brut. C'est le chaînon qui fait remonter les ventes
-- Shopify dans les Finances.
--
-- ✅ SANS danger : aucune colonne n'est supprimée, les colonnes de sortie des
-- vues sont identiques → toutes les pages continuent de fonctionner, avec des
-- chiffres désormais réels. La suppression des colonnes obsolètes
-- (oeuvres.drop_id / nb_ventes / ca_brut) et le passage à drop_oeuvres feront
-- l'objet d'une migration 0019 séparée, après bascule du code.
--
-- À exécuter dans Supabase > SQL Editor. Export conseillé avant.
-- ============================================================

-- 1) artist_sales : la seule dépendance à oeuvres.drop_id devient orders.drop_id
--    (le drop de la COMMANDE est la bonne source). Colonnes inchangées.
create or replace view public.artist_sales as
select
  oi.id,
  o.created_at as sold_at,
  o.wave,
  oe.name  as oeuvre_name,
  oe.format,
  o.drop_id,
  oi.quantity,
  oi.unit_price,
  oi.total_price
from public.order_items oi
join public.orders  o  on o.id  = oi.order_id
join public.oeuvres oe on oe.id = oi.oeuvre_id
where oe.artist_id = public.current_artist_id();

grant select on public.artist_sales to authenticated;

-- 2) drop_pnl : ventes réelles agrégées par campagne (via le drop de la commande),
--    commission FIGÉE (oeuvre_stats.commission_due), coûts depuis oeuvres.
--    DROP + CREATE car le type de nb_ventes change (bigint).
drop view if exists public.drop_pnl;
create view public.drop_pnl as
select
  d.id,
  d.name,
  d.status,
  d.start_date,
  d.end_date,
  d.objectif_ca,
  coalesce(sum(os.ca_brut), 0)::numeric                              as ca_brut,
  coalesce(sum(os.nb_ventes), 0)::bigint                             as nb_ventes,
  coalesce(sum(os.commission_due), 0)::numeric                       as total_commissions,
  coalesce(sum(os.nb_ventes * oe.cout_impression), 0)::numeric       as total_impression,
  coalesce(sum(os.nb_ventes * oe.cout_packaging), 0)::numeric        as total_packaging,
  coalesce((select sum(c.montant) from public.charges c where c.drop_id = d.id), 0)::numeric as total_charges,
  (
    coalesce(sum(os.ca_brut), 0)
    - coalesce(sum(os.commission_due), 0)
    - coalesce(sum(os.nb_ventes * oe.cout_impression), 0)
    - coalesce(sum(os.nb_ventes * oe.cout_packaging), 0)
    - coalesce((select sum(c.montant) from public.charges c where c.drop_id = d.id), 0)
  )::numeric                                                          as resultat_net
from public.drops d
left join public.oeuvre_stats os on os.drop_id = d.id
left join public.oeuvres oe      on oe.id = os.oeuvre_id
group by d.id, d.name, d.status, d.start_date, d.end_date, d.objectif_ca;

grant select on public.drop_pnl to authenticated;

-- 3) artists_with_stats : mêmes colonnes de sortie, ventes depuis oeuvre_stats_total.
--    total_remuneration = commission figée cumulée (au lieu de ca × commission_pct).
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
  count(distinct o.id)                          as nb_oeuvres,
  coalesce(sum(st.nb_ventes), 0)::bigint        as total_ventes,
  coalesce(sum(st.ca_brut), 0)::numeric         as total_ca,
  coalesce(sum(st.commission_due), 0)::numeric  as total_remuneration
from public.artists a
left join public.oeuvres o             on o.artist_id  = a.id
left join public.oeuvre_stats_total st on st.oeuvre_id = o.id
group by a.id;

grant select on public.artists_with_stats to authenticated;
