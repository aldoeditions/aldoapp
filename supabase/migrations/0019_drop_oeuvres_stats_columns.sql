-- ============================================================
-- Migration 0019 — Nettoyage : suppression des colonnes de stats stockées
--
-- oeuvres.nb_ventes et oeuvres.ca_brut ne sont plus utilisées : toutes les
-- statistiques viennent désormais des vues calculées (oeuvre_stats,
-- oeuvre_stats_total, drop_pnl, artists_with_stats — cf. 0018) et l'ancien
-- recalcul manuel (syncOeuvresSales) a été retiré du code.
--
-- ⚠️ À exécuter APRÈS le déploiement du code qui ne référence plus ces colonnes
-- (commit associé). Export conseillé avant.
--
-- Note : oeuvres.drop_id est CONSERVÉE (drop « principal » de l'œuvre) ; la
-- programmation multi-campagnes passe par drop_oeuvres.
-- ============================================================

alter table public.oeuvres drop column if exists nb_ventes;
alter table public.oeuvres drop column if exists ca_brut;
