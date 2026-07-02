-- ============================================================
-- Migration 0008 — Vue sécurisée des ventes de l'artiste
--
-- L'artiste doit voir l'historique de SES ventes (date, œuvre, format,
-- montant) SANS accéder aux tables orders/order_items (réservées à l'équipe)
-- ni aux coûts/marges ni aux données clients.
--
-- Cette vue est en SECURITY DEFINER (par défaut) : elle contourne la RLS des
-- tables sous-jacentes MAIS filtre sur current_artist_id() → chaque artiste
-- ne récupère que ses propres lignes de vente, et uniquement des colonnes
-- non sensibles (aucune info client, aucun coût).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create or replace view public.artist_sales as
select
  oi.id,
  o.created_at as sold_at,
  o.wave,
  oe.name  as oeuvre_name,
  oe.format,
  oe.drop_id,
  oi.quantity,
  oi.unit_price,
  oi.total_price
from public.order_items oi
join public.orders  o  on o.id  = oi.order_id
join public.oeuvres oe on oe.id = oi.oeuvre_id
where oe.artist_id = public.current_artist_id();

grant select on public.artist_sales to authenticated;
