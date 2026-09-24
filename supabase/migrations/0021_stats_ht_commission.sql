-- ============================================================
-- Migration 0021 — Commission artiste sur le HT + CA en TTC ET HT
--
-- Le prix de vente (25/40 €) est TTC. La commission artiste (30 %) doit se
-- calculer sur le prix HORS TAXES (÷ 1,20 pour une TVA à 20 %), conformément
-- au contrat. Les vues exposaient la commission sur le TTC → CORRECTION ici.
--
-- On ajoute aussi `ca_ht` à côté de `ca_brut` (TTC) pour afficher les deux, et
-- le résultat net des campagnes est désormais calculé sur le HT.
--
-- ⚠️ 1,20 = 1 + TVA (20 %). Doit rester cohérent avec TVA_PCT côté app.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

-- Ordre de suppression (dépendances) : artists_with_stats → drop_pnl → total → base.
drop view if exists public.artists_with_stats;
drop view if exists public.drop_pnl;
drop view if exists public.oeuvre_stats_total;
drop view if exists public.oeuvre_stats;

-- 1) oeuvre_stats : ca_brut (TTC), ca_ht (HT), commission_due (30 % du HT).
create view public.oeuvre_stats as
select
  oi.oeuvre_id,
  o.drop_id,
  sum(oi.quantity)                                                              as nb_ventes,
  sum(oi.total_price)                                                           as ca_brut,
  sum(oi.total_price / 1.20)                                                    as ca_ht,
  sum((oi.total_price / 1.20) * coalesce(dobj.commission_pct, 30) / 100.0)      as commission_due
from public.order_items oi
join public.orders o on o.id = oi.order_id
left join public.drop_oeuvres dobj
       on dobj.oeuvre_id = oi.oeuvre_id and dobj.drop_id = o.drop_id
where oi.oeuvre_id is not null
  and o.financial_status = 'paid'
group by oi.oeuvre_id, o.drop_id;

-- 2) oeuvre_stats_total : totaux toutes campagnes.
create view public.oeuvre_stats_total as
select
  oeuvre_id,
  sum(nb_ventes)          as nb_ventes,
  sum(ca_brut)            as ca_brut,
  sum(ca_ht)              as ca_ht,
  sum(commission_due)     as commission_due,
  count(distinct drop_id) as nb_campagnes
from public.oeuvre_stats
group by oeuvre_id;

grant select on public.oeuvre_stats       to authenticated;
grant select on public.oeuvre_stats_total to authenticated;

-- 3) drop_pnl : CA TTC + CA HT, commission HT, résultat net sur HT.
create view public.drop_pnl as
select
  d.id,
  d.name,
  d.status,
  d.start_date,
  d.end_date,
  d.objectif_ca,
  coalesce(sum(os.ca_brut), 0)::numeric                              as ca_brut,
  coalesce(sum(os.ca_ht), 0)::numeric                                as ca_ht,
  coalesce(sum(os.nb_ventes), 0)::bigint                             as nb_ventes,
  coalesce(sum(os.commission_due), 0)::numeric                       as total_commissions,
  coalesce(sum(os.nb_ventes * oe.cout_impression), 0)::numeric       as total_impression,
  coalesce(sum(os.nb_ventes * oe.cout_packaging), 0)::numeric        as total_packaging,
  coalesce((select sum(c.montant) from public.charges c where c.drop_id = d.id), 0)::numeric as total_charges,
  (
    coalesce(sum(os.ca_ht), 0)
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

-- 4) artists_with_stats : total_ca (TTC) inchangé, total_remuneration = commission HT.
create view public.artists_with_stats as
select
  a.id, a.created_at, a.updated_at, a.name, a.email, a.phone, a.instagram, a.portfolio_url,
  a.address, a.city, a.country, a.avatar_url, a.bio, a.type, a.style, a.renommee, a.phase,
  a.pipe_status, a.first_contact_date, a.first_contact_info, a.kit_impression, a.visuels,
  a.demande_infos, a.contrat_status, a.commission_pct, a.drive_link, a.dans_le_pipe,
  count(distinct o.id)                          as nb_oeuvres,
  coalesce(sum(st.nb_ventes), 0)::bigint        as total_ventes,
  coalesce(sum(st.ca_brut), 0)::numeric         as total_ca,
  coalesce(sum(st.commission_due), 0)::numeric  as total_remuneration
from public.artists a
left join public.oeuvres o             on o.artist_id  = a.id
left join public.oeuvre_stats_total st on st.oeuvre_id = o.id
group by a.id;

grant select on public.artists_with_stats to authenticated;
