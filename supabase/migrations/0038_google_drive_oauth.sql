-- 0038_google_drive_oauth.sql
-- Connexion Google Drive par OAuth UTILISATEUR (contact@aldo-editions.com),
-- au lieu d'un compte de service (création de clés bloquée par Google, et un
-- compte de service n'a pas de quota pour écrire dans un « Mon Drive »).
-- Additif, idempotent. À lancer à la main dans le SQL Editor Supabase.
--
-- Le refresh token est stocké CHIFFRÉ (lib/crypto.ts, clé ARTIST_DATA_KEY),
-- jamais en clair, jamais exposé au MCP (cf. lib/mcp/redact.ts).

alter table public.company_settings
  add column if not exists google_drive_refresh_token_enc text,       -- refresh token chiffré (AES-256-GCM)
  add column if not exists google_drive_connected_email    text,      -- compte Google connecté (affichage)
  add column if not exists google_drive_connected_at       timestamptz; -- date de la dernière connexion
