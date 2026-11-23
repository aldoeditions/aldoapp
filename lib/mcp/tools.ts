import "server-only";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { sessionFromCtx, type ToolCtx } from "@/lib/mcp/context";
import { assertNoSensitive } from "@/lib/mcp/redact";
import { logMcpCall } from "@/lib/mcp/audit";
import { campaignNumberFromDropName } from "@/lib/contracts/filename";
import { getDropContracts } from "@/lib/data/drop-contracts";
import { getProgrammedOeuvres } from "@/lib/data/drop-oeuvres";
import { generateContractInto, markContractSentInto } from "@/lib/contracts/service";

/** Dernière migration connue du code (cf. supabase/migrations). */
const LATEST_MIGRATION = "0035_mcp_audit_log";

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function ok(tool: string, payload: unknown): ToolResult {
  assertNoSensitive(payload, tool);
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

function euros(n: number | null | undefined): number {
  return Math.round(((n ?? 0) as number) * 100) / 100;
}

/**
 * Enregistre les outils du connecteur Aldo (Phase 1). Lecture + deux écritures
 * (génération et envoi des contrats), chacune réutilisant la logique existante.
 */
export function registerAldoTools(server: McpServer): void {
  // --------------------------------------------------------------- LECTURE ---

  server.registerTool(
    "lister_campagnes",
    {
      title: "Lister les campagnes",
      description:
        "Liste les campagnes (drops) : numéro, nom, dates, statut, nombre d'œuvres et d'artistes.",
      inputSchema: z.object({}),
    },
    async (_args: unknown, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        const [dropsRes, progRes] = await Promise.all([
          s.supabase.from("drops").select("id, name, status, start_date, end_date").order("start_date", { ascending: true }),
          s.supabase.from("drop_oeuvres").select("drop_id, oeuvre_id, oeuvres(artist_id)"),
        ]);
        const prog = (progRes.data ?? []) as unknown as {
          drop_id: string | null;
          oeuvre_id: string | null;
          oeuvres: { artist_id: string | null } | null;
        }[];
        const campagnes = (dropsRes.data ?? []).map((d) => {
          const rows = prog.filter((p) => p.drop_id === d.id);
          const artistes = new Set(rows.map((r) => r.oeuvres?.artist_id).filter(Boolean));
          return {
            numero: campaignNumberFromDropName(d.name),
            id: d.id,
            nom: d.name,
            statut: d.status,
            debut: d.start_date,
            fin: d.end_date,
            nb_oeuvres: rows.length,
            nb_artistes: artistes.size,
          };
        });
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "lister_campagnes", outcome: "ok", affected: campagnes.length });
        return ok("lister_campagnes", { campagnes });
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );

  server.registerTool(
    "etat_campagne",
    {
      title: "État d'une campagne",
      description:
        "Pour une campagne : artistes (nom affiché, prénom et nom du contrat, e-mail pro, fiche identité complète ou non), œuvres, et statut de chaque contrat avec ses dates.",
      inputSchema: z.object({ drop_id: z.string().describe("Identifiant du drop") }),
    },
    async (args: { drop_id: string }, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        const dc = await getDropContracts(args.drop_id, { supabase: s.supabase, admin: s.admin });
        if (!dc.drop) return fail("Campagne introuvable.");

        const artistIds = dc.rows.map((r) => r.artist_id);
        const [oeuvres, emailsRes] = await Promise.all([
          // Œuvres programmées (drop_oeuvres) → gère les rééditions.
          getProgrammedOeuvres(args.drop_id, s.supabase),
          artistIds.length
            ? s.supabase.from("artists").select("id, email").in("id", artistIds)
            : Promise.resolve({ data: [] as { id: string; email: string | null }[] }),
        ]);
        const emailById = new Map((emailsRes.data ?? []).map((a) => [a.id, a.email]));

        const artistes = dc.rows.map((r) => ({
          artist_id: r.artist_id,
          nom_affiche: r.display_name,
          nom_contrat: r.full_name,
          email_pro: emailById.get(r.artist_id) ?? null,
          identite_complete: r.missing.length === 0,
          champs_manquants: r.missing,
          oeuvres: (oeuvres ?? []).filter((o) => o.artist_id === r.artist_id).map((o) => ({ id: o.id, titre: o.name, format: o.format })),
          contrat: r.contract
            ? {
                statut: r.contract.status,
                genere_le: r.contract.generated_at,
                envoye_le: r.contract.sent_at,
                signe_le: r.contract.signed_at,
              }
            : null,
        }));

        const payload = {
          campagne: { id: dc.drop.id, nom: dc.drop.name, numero: dc.campaign_number },
          artistes,
        };
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "etat_campagne", params: { drop_id: args.drop_id }, outcome: "ok", affected: artistes.length });
        return ok("etat_campagne", payload);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );

  server.registerTool(
    "lister_contrats",
    {
      title: "Lister les contrats",
      description: "Liste les contrats, filtrables par campagne et par statut (brouillon, envoyé, signé).",
      inputSchema: z.object({
        drop_id: z.string().optional(),
        statut: z.enum(["brouillon", "envoyé", "signé"]).optional(),
      }),
    },
    async (args: { drop_id?: string; statut?: string }, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        let q = s.supabase
          .from("contracts")
          .select("id, status, generated_at, sent_at, signed_at, drops(name), artists(name)")
          .order("generated_at", { ascending: false });
        if (args.drop_id) q = q.eq("drop_id", args.drop_id);
        if (args.statut) q = q.eq("status", args.statut);
        const { data, error } = await q.returns<{
          id: string;
          status: string;
          generated_at: string | null;
          sent_at: string | null;
          signed_at: string | null;
          drops: { name: string | null } | null;
          artists: { name: string | null } | null;
        }[]>();
        if (error) return fail(error.message);
        const contrats = (data ?? []).map((c) => ({
          id: c.id,
          campagne: c.drops?.name ?? null,
          artiste: c.artists?.name ?? null,
          statut: c.status,
          genere_le: c.generated_at,
          envoye_le: c.sent_at,
          signe_le: c.signed_at,
        }));
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "lister_contrats", params: { drop_id: args.drop_id, statut: args.statut }, outcome: "ok", affected: contrats.length });
        return ok("lister_contrats", { contrats });
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );

  server.registerTool(
    "ventes_campagne",
    {
      title: "Ventes d'une campagne",
      description:
        "Chiffre d'affaires TTC et HT, nombre d'exemplaires et commissions dues, par œuvre et par artiste. Aucune donnée client, aucun coût.",
      inputSchema: z.object({ drop_id: z.string() }),
    },
    async (args: { drop_id: string }, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        const { data: stats } = await s.supabase
          .from("oeuvre_stats")
          .select("oeuvre_id, nb_ventes, ca_brut, ca_ht, commission_due")
          .eq("drop_id", args.drop_id);
        const rows = stats ?? [];
        const oeuvreIds = rows.map((r) => r.oeuvre_id).filter((x): x is string => Boolean(x));
        const { data: oeuvres } = oeuvreIds.length
          ? await s.supabase.from("oeuvres").select("id, name, artist_id").in("id", oeuvreIds)
          : { data: [] as { id: string; name: string; artist_id: string | null }[] };
        const artistIds = Array.from(new Set((oeuvres ?? []).map((o) => o.artist_id).filter((x): x is string => Boolean(x))));
        const { data: artists } = artistIds.length
          ? await s.supabase.from("artists").select("id, name").in("id", artistIds)
          : { data: [] as { id: string; name: string }[] };
        const oeuvreById = new Map((oeuvres ?? []).map((o) => [o.id, o]));
        const artistById = new Map((artists ?? []).map((a) => [a.id, a.name]));

        const parOeuvre = rows.map((r) => {
          const o = r.oeuvre_id ? oeuvreById.get(r.oeuvre_id) : undefined;
          return {
            oeuvre: o?.name ?? null,
            artiste: o?.artist_id ? artistById.get(o.artist_id) ?? null : null,
            exemplaires: r.nb_ventes ?? 0,
            ca_ttc: euros(r.ca_brut),
            ca_ht: euros(r.ca_ht),
            commission_due: euros(r.commission_due),
          };
        });

        const byArtist = new Map<string, { artiste: string; exemplaires: number; ca_ttc: number; ca_ht: number; commission_due: number }>();
        for (const r of rows) {
          const o = r.oeuvre_id ? oeuvreById.get(r.oeuvre_id) : undefined;
          const name = o?.artist_id ? artistById.get(o.artist_id) ?? "—" : "—";
          const cur = byArtist.get(name) ?? { artiste: name, exemplaires: 0, ca_ttc: 0, ca_ht: 0, commission_due: 0 };
          cur.exemplaires += r.nb_ventes ?? 0;
          cur.ca_ttc = euros(cur.ca_ttc + (r.ca_brut ?? 0));
          cur.ca_ht = euros(cur.ca_ht + (r.ca_ht ?? 0));
          cur.commission_due = euros(cur.commission_due + (r.commission_due ?? 0));
          byArtist.set(name, cur);
        }

        const totaux = {
          exemplaires: parOeuvre.reduce((a, b) => a + b.exemplaires, 0),
          ca_ttc: euros(parOeuvre.reduce((a, b) => a + b.ca_ttc, 0)),
          ca_ht: euros(parOeuvre.reduce((a, b) => a + b.ca_ht, 0)),
          commission_due: euros(parOeuvre.reduce((a, b) => a + b.commission_due, 0)),
        };
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "ventes_campagne", params: { drop_id: args.drop_id }, outcome: "ok", affected: parOeuvre.length });
        return ok("ventes_campagne", { par_oeuvre: parOeuvre, par_artiste: Array.from(byArtist.values()), totaux });
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );

  server.registerTool(
    "etat_app",
    {
      title: "État de l'app",
      description: "Version, dernier déploiement (commit Vercel) et dernière migration attendue.",
      inputSchema: z.object({}),
    },
    async (_args: unknown, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        const payload = {
          environnement: process.env.VERCEL_ENV ?? "local",
          commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
          commit_message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
          derniere_migration: LATEST_MIGRATION,
          note: "L'application des migrations Supabase est manuelle (SQL Editor).",
        };
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "etat_app", outcome: "ok", affected: 0 });
        return ok("etat_app", payload);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );

  // --------------------------------------------------------------- ÉCRITURE ---

  server.registerTool(
    "generer_contrats_manquants",
    {
      title: "Générer les contrats manquants",
      description:
        "Génère les contrats (brouillons) des artistes d'une campagne qui n'en ont pas encore. Les fiches identité incomplètes et les artistes sans œuvre programmée sont ignorés et signalés. L'aperçu détaille l'annexe (œuvres) de chaque contrat. Sans confirm=true, renvoie seulement un aperçu.",
      inputSchema: z.object({
        drop_id: z.string(),
        artist_ids: z.array(z.string()).optional().describe("Restreindre à ces artistes"),
        confirm: z.boolean().default(false).describe("false = aperçu ; true = exécute"),
      }),
    },
    async (args: { drop_id: string; artist_ids?: string[]; confirm?: boolean }, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        const [dc, programmes] = await Promise.all([
          getDropContracts(args.drop_id, { supabase: s.supabase, admin: s.admin }),
          getProgrammedOeuvres(args.drop_id, s.supabase),
        ]);
        if (!dc.drop) return fail("Campagne introuvable.");

        // Annexe (œuvres programmées) par artiste, via drop_oeuvres → rééditions.
        const oeuvresByArtist = new Map<string, { titre: string; format: string | null }[]>();
        for (const o of programmes) {
          if (!o.artist_id) continue;
          const arr = oeuvresByArtist.get(o.artist_id) ?? [];
          arr.push({ titre: o.name, format: o.format });
          oeuvresByArtist.set(o.artist_id, arr);
        }
        const annexe = (id: string) => oeuvresByArtist.get(id) ?? [];

        const idSet = args.artist_ids?.length ? new Set(args.artist_ids) : null;
        const rows = idSet ? dc.rows.filter((r) => idSet.has(r.artist_id)) : dc.rows;

        const sansContrat = rows.filter((r) => !r.contract);
        const incomplets = sansContrat.filter((r) => r.missing.length > 0);
        const sansOeuvre = sansContrat.filter((r) => r.missing.length === 0 && annexe(r.artist_id).length === 0);
        const aGenerer = sansContrat.filter((r) => r.missing.length === 0 && annexe(r.artist_id).length > 0);
        const dejaFaits = rows.filter((r) => r.contract);

        if (!args.confirm) {
          const payload = {
            apercu: true,
            campagne: dc.drop.name,
            a_generer: aGenerer.map((r) => ({ artiste: r.display_name, oeuvres: annexe(r.artist_id) })),
            ignores_identite_incomplete: incomplets.map((r) => ({ artiste: r.display_name, champs_manquants: r.missing })),
            ignores_aucune_oeuvre: sansOeuvre.map((r) => r.display_name),
            deja_generes: dejaFaits.map((r) => r.display_name),
            message: `Aperçu : ${aGenerer.length} contrat(s) seraient générés. Rappelle avec confirm=true pour exécuter.`,
          };
          await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "generer_contrats_manquants", params: { drop_id: args.drop_id, confirm: false }, outcome: "apercu", affected: aGenerer.length });
          return ok("generer_contrats_manquants", payload);
        }

        const crees: string[] = [];
        const erreurs: { artiste: string; erreur: string }[] = [];
        for (const r of aGenerer) {
          const res = await generateContractInto({ supabase: s.supabase, admin: s.admin, artistId: r.artist_id, dropId: args.drop_id });
          if (res.error) erreurs.push({ artiste: r.display_name, erreur: res.error });
          else crees.push(r.display_name);
        }
        const payload = {
          apercu: false,
          campagne: dc.drop.name,
          generes: crees,
          erreurs,
          ignores_identite_incomplete: incomplets.map((r) => ({ artiste: r.display_name, champs_manquants: r.missing })),
          ignores_aucune_oeuvre: sansOeuvre.map((r) => r.display_name),
          message: `${crees.length} contrat(s) généré(s)${erreurs.length ? `, ${erreurs.length} erreur(s)` : ""}.`,
        };
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "generer_contrats_manquants", params: { drop_id: args.drop_id, confirm: true }, outcome: erreurs.length ? "erreur" : "ok", affected: crees.length, message: payload.message });
        return ok("generer_contrats_manquants", payload);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );

  server.registerTool(
    "marquer_contrats_envoyes",
    {
      title: "Marquer des contrats comme envoyés",
      description:
        "Passe à « envoyé » les contrats au statut brouillon d'une campagne (ou d'une liste d'artistes). N'affecte jamais les contrats déjà envoyés ou signés. Sans confirm=true, renvoie seulement un aperçu.",
      inputSchema: z.object({
        drop_id: z.string(),
        artist_ids: z.array(z.string()).optional().describe("Restreindre à ces artistes"),
        confirm: z.boolean().default(false),
      }),
    },
    async (args: { drop_id: string; artist_ids?: string[]; confirm?: boolean }, ctx: ToolCtx) => {
      try {
        const s = sessionFromCtx(ctx);
        let q = s.supabase
          .from("contracts")
          .select("id, artist_id, status, artists(name)")
          .eq("drop_id", args.drop_id)
          .eq("status", "brouillon");
        if (args.artist_ids?.length) q = q.in("artist_id", args.artist_ids);
        const { data, error } = await q.returns<{ id: string; artist_id: string | null; status: string; artists: { name: string | null } | null }[]>();
        if (error) return fail(error.message);
        const brouillons = data ?? [];

        if (!args.confirm) {
          const payload = {
            apercu: true,
            a_envoyer: brouillons.map((c) => c.artists?.name ?? c.artist_id),
            message: `Aperçu : ${brouillons.length} contrat(s) passeraient à « envoyé ». Rappelle avec confirm=true pour exécuter.`,
          };
          await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "marquer_contrats_envoyes", params: { drop_id: args.drop_id, confirm: false }, outcome: "apercu", affected: brouillons.length });
          return ok("marquer_contrats_envoyes", payload);
        }

        let count = 0;
        const erreurs: string[] = [];
        for (const c of brouillons) {
          const res = await markContractSentInto({ supabase: s.supabase, id: c.id });
          if (res.error) erreurs.push(`${c.artists?.name ?? c.artist_id} : ${res.error}`);
          else count++;
        }
        const payload = { apercu: false, envoyes: count, erreurs, message: `${count} contrat(s) marqué(s) comme envoyés${erreurs.length ? `, ${erreurs.length} erreur(s)` : ""}.` };
        await logMcpCall({ principal: s.principal, clientId: s.clientId, tool: "marquer_contrats_envoyes", params: { drop_id: args.drop_id, confirm: true }, outcome: erreurs.length ? "erreur" : "ok", affected: count, message: payload.message });
        return ok("marquer_contrats_envoyes", payload);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    },
  );
}
