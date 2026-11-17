-- ============================================================
-- Migration 0034 — Anti-doublon des lignes de commande.
--
-- Deux webhooks Shopify quasi simultanés (orders/create + orders/paid)
-- pouvaient s'intercaler dans l'ancien delete-then-insert et créer deux
-- lignes identiques pour un même article (même shopify_line_item_id).
-- Conséquence : « 2 pièces » affichées au lieu d'1, et double comptage
-- possible dans les relevés de droits.
--
-- 1. On dédoublonne les lignes existantes (on garde la plus ancienne).
-- 2. On pose une contrainte d'unicité sur shopify_line_item_id : la sync
--    passe désormais par un upsert (onConflict) idempotent.
--
-- NB : les lignes saisies à la main (shopify_line_item_id NULL) ne sont pas
-- concernées — en Postgres, plusieurs NULL restent autorisés par un index
-- unique (NULL distincts).
-- À exécuter dans Supabase > SQL Editor (après 0033).
-- ============================================================

-- 1. Supprime les doublons : pour chaque shopify_line_item_id, ne garder que
--    la ligne au ctid le plus petit (la première physiquement écrite).
delete from public.order_items a
using public.order_items b
where a.shopify_line_item_id is not null
  and a.shopify_line_item_id = b.shopify_line_item_id
  and a.ctid > b.ctid;

-- 2. Unicité de la ligne Shopify (index non partiel : les NULL multiples
--    restent permis, pour les commandes saisies à la main).
create unique index if not exists order_items_shopify_line_item_id_key
  on public.order_items (shopify_line_item_id);
