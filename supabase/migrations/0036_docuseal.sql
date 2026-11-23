-- 0036_docuseal.sql
-- Signature électronique via DocuSeal (Phase 2 du connecteur Aldo).
-- Additif, idempotent. À lancer à la main dans le SQL Editor Supabase.
--
-- Le contrat PDF (qui contient l'IBAN) ne circule qu'entre l'app, DocuSeal et
-- le Storage. Le connecteur MCP ne voit jamais le PDF ni l'IBAN.

-- 1. Suivi DocuSeal sur les contrats.
alter table public.contracts
  add column if not exists docuseal_submission_id bigint,   -- id de la soumission DocuSeal
  add column if not exists audit_log_path          text,    -- PDF d'audit signé (bucket contracts)
  add column if not exists artist_signed_at        timestamptz,  -- signature de l'Artiste
  add column if not exists aldo_signed_at          timestamptz;  -- contre-signature Aldo

create index if not exists contracts_docuseal_submission_idx
  on public.contracts (docuseal_submission_id);

-- 2. Journal des webhooks DocuSeal (trace + idempotence). Écriture service_role.
create table if not exists public.docuseal_events (
  id             uuid primary key default gen_random_uuid(),
  received_at    timestamptz not null default now(),
  event_type     text,                                 -- form.completed | submission.completed | …
  submission_id  bigint,                               -- id de la soumission DocuSeal concernée
  processed      boolean not null default false,
  error          text,
  payload        jsonb                                 -- payload brut (aucune donnée bancaire côté DocuSeal)
);

create index if not exists docuseal_events_submission_idx on public.docuseal_events (submission_id);
create index if not exists docuseal_events_received_idx on public.docuseal_events (received_at desc);

alter table public.docuseal_events enable row level security;

-- Lecture réservée aux admins ; écriture via service_role uniquement.
drop policy if exists "docuseal_events_select_admin" on public.docuseal_events;
create policy "docuseal_events_select_admin"
  on public.docuseal_events for select
  using (public.is_admin());
