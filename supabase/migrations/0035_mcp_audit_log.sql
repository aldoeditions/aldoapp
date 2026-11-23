-- 0035_mcp_audit_log.sql
-- Journal des appels au connecteur MCP (serveur MCP de l'app).
-- Additif, idempotent. À lancer à la main dans le SQL Editor Supabase.
--
-- On n'y stocke JAMAIS de donnée sensible : les paramètres sont nettoyés côté
-- app (lib/mcp/audit.ts) avant insertion. L'écriture se fait via le client
-- service_role (qui contourne la RLS) ; la lecture est réservée aux admins.

create table if not exists public.mcp_audit_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  user_email  text,
  client_id   text,                       -- id du client OAuth (Claude, Claude Code…)
  tool        text not null,              -- nom de l'outil appelé
  params      jsonb not null default '{}'::jsonb,  -- paramètres, sans donnée sensible
  outcome     text not null default 'ok', -- apercu | ok | refus | erreur
  affected    integer not null default 0, -- nombre d'éléments touchés
  message     text                        -- message lisible (fr), sans trace technique
);

create index if not exists mcp_audit_log_created_at_idx on public.mcp_audit_log (created_at desc);
create index if not exists mcp_audit_log_user_idx on public.mcp_audit_log (user_id);
create index if not exists mcp_audit_log_tool_idx on public.mcp_audit_log (tool);

alter table public.mcp_audit_log enable row level security;

-- Lecture réservée aux admins (Louison, Charley). Écriture : service_role only.
drop policy if exists "mcp_audit_select_admin" on public.mcp_audit_log;
create policy "mcp_audit_select_admin"
  on public.mcp_audit_log for select
  using (public.is_admin());
