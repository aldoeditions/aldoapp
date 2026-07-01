-- ============================================================
-- Migration 0003 — Fix bootstrapping du 1er admin
--
-- Le trigger prevent_role_self_escalation (migration 0001) annulait TOUT
-- changement de rôle quand l'auteur n'était pas déjà admin. Via service_role
-- ou SQL editor, auth.uid() est nul → considéré non-admin → aucun premier
-- admin ne pouvait être créé.
--
-- Fix : n'annuler que pour un utilisateur AUTHENTIFIÉ non-admin.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null
       and not exists (
         select 1 from public.profiles p
         where p.id = auth.uid() and p.role = 'admin'
       ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

-- Passer Louison (admin principal) en admin.
update public.profiles set role = 'admin'
where email = 'dupontlouison@gmail.com';
