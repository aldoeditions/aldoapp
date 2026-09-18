-- ============================================================
-- Migration 0017 — Sync Shopify / refonte œuvres : PHASE EXPAND
--
-- Ajoute tout le nouveau modèle SANS rien supprimer ni toucher aux vues
-- existantes (drop_pnl, artists_with_stats, artist_sales). L'app continue de
-- fonctionner sur oeuvres.drop_id / nb_ventes / ca_brut pendant la bascule.
--
-- La suppression des colonnes, les contraintes NOT NULL/UNIQUE définitives sur
-- oeuvres.sku/numero et la réécriture des vues seront faites en 0018 (CONTRACT),
-- une fois le code basculé et l'import de rattrapage passé.
--
-- À exécuter dans Supabase > SQL Editor. Faire un export de la base avant.
-- ============================================================

-- ─────────────────────────────────────────
-- 1a. artists.sku_code  ("DC", "MO", "DCM"…)
-- ─────────────────────────────────────────
alter table public.artists add column if not exists sku_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'artists_sku_code_format'
  ) then
    alter table public.artists
      add constraint artists_sku_code_format
      check (sku_code is null or sku_code ~ '^[A-Z0-9]{2,4}$');
  end if;
end $$;

create unique index if not exists artists_sku_code_key
  on public.artists (sku_code) where sku_code is not null;

-- ─────────────────────────────────────────
-- 1b. oeuvres : numero + sku (nullable pour l'instant)
--     numero : backfill séquentiel PAR ARTISTE (ordre de création).
--     sku    : laissé null — dépend de artists.sku_code (saisi à la main),
--              généré ensuite côté app / migration 0018.
-- ─────────────────────────────────────────
alter table public.oeuvres add column if not exists numero integer;
alter table public.oeuvres add column if not exists sku text;

with seq as (
  select id,
         row_number() over (
           partition by artist_id order by created_at nulls first, id
         ) as rn
  from public.oeuvres
)
update public.oeuvres o
set numero = seq.rn
from seq
where seq.id = o.id and o.numero is null;

create unique index if not exists oeuvres_sku_key
  on public.oeuvres (sku) where sku is not null;

-- Unicité (artist_id, numero, format) — garantit la nomenclature.
create unique index if not exists oeuvres_artist_numero_format_key
  on public.oeuvres (artist_id, numero, format) where numero is not null;

-- ─────────────────────────────────────────
-- 1c. drop_oeuvres — la PROGRAMMATION (œuvre en vente sur une campagne)
-- ─────────────────────────────────────────
create table if not exists public.drop_oeuvres (
  id             uuid primary key default gen_random_uuid(),
  drop_id        uuid not null references public.drops(id)   on delete cascade,
  oeuvre_id      uuid not null references public.oeuvres(id) on delete cascade,
  price          numeric(10,2) not null,
  commission_pct numeric(5,2)  not null,
  created_at     timestamptz default now(),
  unique (drop_id, oeuvre_id)
);
create index if not exists drop_oeuvres_drop_idx   on public.drop_oeuvres (drop_id);
create index if not exists drop_oeuvres_oeuvre_idx on public.drop_oeuvres (oeuvre_id);

-- Backfill depuis oeuvres.drop_id : prix de l'œuvre + commission de l'artiste.
insert into public.drop_oeuvres (drop_id, oeuvre_id, price, commission_pct)
select o.drop_id, o.id, o.price, coalesce(a.commission_pct, 30)
from public.oeuvres o
join public.artists a on a.id = o.artist_id
where o.drop_id is not null
on conflict (drop_id, oeuvre_id) do nothing;

-- ─────────────────────────────────────────
-- 1g. Compléments orders / order_items (Shopify)
-- ─────────────────────────────────────────
alter table public.orders add column if not exists financial_status   text;
alter table public.orders add column if not exists fulfillment_status text;
alter table public.orders add column if not exists subtotal_amount    numeric(10,2);
alter table public.orders add column if not exists shipping_amount    numeric(10,2);
alter table public.orders add column if not exists raw_payload        jsonb;
alter table public.orders add column if not exists synced_at          timestamptz;

-- Unicité de la commande Shopify (partielle : les commandes manuelles restent null).
create unique index if not exists orders_shopify_order_id_key
  on public.orders (shopify_order_id) where shopify_order_id is not null;

alter table public.order_items add column if not exists shopify_line_item_id text;
alter table public.order_items add column if not exists sku            text;
alter table public.order_items add column if not exists title_snapshot text;
-- Un SKU inconnu ne doit jamais bloquer : la ligne existe sans œuvre résolue.
alter table public.order_items alter column oeuvre_id drop not null;

-- ─────────────────────────────────────────
-- 1f. Tables de synchronisation
-- ─────────────────────────────────────────
create table if not exists public.webhook_events (
  id                 uuid primary key default gen_random_uuid(),
  shopify_webhook_id text unique,
  topic              text,
  payload            jsonb,
  processed          boolean default false,
  error              text,
  received_at        timestamptz default now()
);

create table if not exists public.sync_log (
  id              uuid primary key default gen_random_uuid(),
  type            text,
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  orders_imported integer default 0,
  errors          integer default 0,
  status          text
);

-- ─────────────────────────────────────────
-- 1d. Statistiques CALCULÉES (remplaceront oeuvres.nb_ventes/ca_brut)
--     Source : ventes réelles (order_items → orders), commandes payées.
--     commission_due : taux FIGÉ dans drop_oeuvres pour ce couple (œuvre, drop).
-- ─────────────────────────────────────────
create or replace view public.oeuvre_stats as
select
  oi.oeuvre_id,
  o.drop_id,
  sum(oi.quantity)                                                   as nb_ventes,
  sum(oi.total_price)                                                as ca_brut,
  sum(oi.total_price * coalesce(dobj.commission_pct, 30) / 100.0)    as commission_due
from public.order_items oi
join public.orders o on o.id = oi.order_id
left join public.drop_oeuvres dobj
       on dobj.oeuvre_id = oi.oeuvre_id and dobj.drop_id = o.drop_id
where oi.oeuvre_id is not null
  and o.financial_status = 'paid'
group by oi.oeuvre_id, o.drop_id;

-- Totaux toutes campagnes confondues (meilleures ventes historiques).
create or replace view public.oeuvre_stats_total as
select
  oeuvre_id,
  sum(nb_ventes)          as nb_ventes,
  sum(ca_brut)            as ca_brut,
  sum(commission_due)     as commission_due,
  count(distinct drop_id) as nb_campagnes
from public.oeuvre_stats
group by oeuvre_id;

grant select on public.oeuvre_stats       to authenticated;
grant select on public.oeuvre_stats_total to authenticated;

-- ─────────────────────────────────────────
-- RLS : nouvelles tables = équipe uniquement (le webhook passe en service_role,
-- qui contourne la RLS).
-- ─────────────────────────────────────────
alter table public.drop_oeuvres   enable row level security;
alter table public.webhook_events enable row level security;
alter table public.sync_log       enable row level security;

drop policy if exists "drop_oeuvres_team" on public.drop_oeuvres;
create policy "drop_oeuvres_team" on public.drop_oeuvres for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "webhook_events_team" on public.webhook_events;
create policy "webhook_events_team" on public.webhook_events for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "sync_log_team" on public.sync_log;
create policy "sync_log_team" on public.sync_log for all
  using (public.is_team()) with check (public.is_team());

-- ============================================================
-- FIN 0017 (EXPAND). Rien n'a été supprimé. Vérifs conseillées :
--   select count(*) from public.drop_oeuvres;          -- ≈ nb œuvres avec drop_id
--   select id, name, numero from public.oeuvres order by artist_id, numero;
-- ============================================================
