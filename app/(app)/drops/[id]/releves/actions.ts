"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getCampaignRoyalties, getStatementForPdf, type CampaignRoyaltyRow } from "@/lib/data/royalties";
import { renderStatementPdf } from "@/lib/royalties/generateStatementPdf";
import type { TablesInsert, TablesUpdate } from "@/types/database";

const PDF_BUCKET = "royalty-statements";

/** Génère + stocke le PDF d'un relevé émis. Non bloquant. */
async function generateAndStorePdf(statementId: string, artistId: string): Promise<string | null> {
  const data = await getStatementForPdf(statementId);
  if (!data) return null;
  const pdf = await renderStatementPdf(data);
  const path = `${artistId}/${statementId}.pdf`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(PDF_BUCKET).upload(path, new Uint8Array(pdf), {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "finances")) throw new Error("Accès refusé : droits insuffisants.");
  return user;
}

/** Snapshot (brouillon) depuis le calcul live d'une ligne de campagne. */
function snapshot(row: CampaignRoyaltyRow, rateId: string | null): Partial<TablesInsert<"royalty_statements">> {
  const c = row.computed!;
  return {
    total_ht_cents: c.total_ht_cents,
    commission_pct: row.commission_pct,
    brut_cents: c.brut_cents,
    precompte_cents: c.precompte ? c.precompte.total_cents : 0,
    net_cents: c.net_cents,
    contribution_diffuseur_cents: c.contribution_diffuseur_cents,
    exempt: c.exempt,
    social_rate_id: rateId,
    lines: c.lines as unknown as TablesInsert<"royalty_statements">["lines"],
    breakdown: (c.precompte?.breakdown ?? null) as unknown as TablesInsert<"royalty_statements">["breakdown"],
    non_resident: row.non_resident,
  };
}

/** Génère / met à jour les brouillons de tous les artistes avec des ventes. */
export async function generateDrafts(dropId: string): Promise<{ created: number; updated: number; error?: string }> {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { rows, rate } = await getCampaignRoyalties(dropId);

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    if (!row.computed || row.computed.brut_cents <= 0) continue; // 0 € : optionnel, non généré d'office
    const snap = snapshot(row, rate?.id ?? null);
    if (row.statement) {
      if (row.statement.status !== "brouillon") continue; // émis/payé : jamais écrasé
      const { error } = await supabase.from("royalty_statements").update(snap).eq("id", row.statement.id);
      if (error) return { created, updated, error: error.message };
      updated++;
    } else {
      const { error } = await supabase.from("royalty_statements").insert({
        artist_id: row.artist_id,
        drop_id: dropId,
        status: "brouillon",
        created_by: user.id,
        ...snap,
      } as TablesInsert<"royalty_statements">);
      if (error) return { created, updated, error: error.message };
      created++;
    }
  }
  revalidatePath(`/drops/${dropId}/releves`);
  return { created, updated };
}

/** Émet un relevé : numéro séquentiel, figement, statut « émis ». */
export async function emitStatement(statementId: string, dropId: string): Promise<{ error?: string }> {
  const user = await assertCanEdit();
  const supabase = createClient();

  const { data: st } = await supabase
    .from("royalty_statements")
    .select("id, status, non_resident, non_resident_treatment, artist_id")
    .eq("id", statementId)
    .maybeSingle();
  if (!st) return { error: "Relevé introuvable." };
  if (st.status !== "brouillon") return { error: "Seul un brouillon peut être émis." };
  if (st.non_resident && !st.non_resident_treatment) {
    return { error: "Artiste non-résident : choisis d'abord le traitement avant d'émettre." };
  }

  const year = new Date().getFullYear();
  // next_royalty_seq non déclarée dans le type Functions (type maintenu à la main) → cast.
  const { data: seq, error: seqErr } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: number | null; error: { message: string } | null }>)("next_royalty_seq", { p_year: year });
  if (seqErr || seq == null) return { error: seqErr?.message ?? "Numérotation impossible." };

  const number = `RDA-${year}-${String(seq).padStart(4, "0")}`;
  const update: TablesUpdate<"royalty_statements"> = {
    status: "émis",
    number,
    year,
    seq: seq as number,
    issued_at: new Date().toISOString(),
    issued_by: user.id,
  };
  const { error } = await supabase.from("royalty_statements").update(update).eq("id", statementId);
  if (error) return { error: error.message };

  // Génère et stocke le PDF (non bloquant : le relevé reste émis même si échec).
  try {
    const path = await generateAndStorePdf(statementId, st.artist_id);
    if (path) await supabase.from("royalty_statements").update({ pdf_path: path }).eq("id", statementId);
  } catch {
    /* PDF régénérable ultérieurement */
  }

  revalidatePath(`/drops/${dropId}/releves`);
  return {};
}

/** Émet tous les brouillons émittables de la campagne (ignore les bloqués). */
export async function emitAll(dropId: string): Promise<{ emitted: number; skipped: number; error?: string }> {
  await assertCanEdit();
  const supabase = createClient();
  const { data: drafts } = await supabase
    .from("royalty_statements")
    .select("id, non_resident, non_resident_treatment")
    .eq("drop_id", dropId)
    .eq("status", "brouillon");

  let emitted = 0;
  let skipped = 0;
  for (const d of drafts ?? []) {
    if (d.non_resident && !d.non_resident_treatment) {
      skipped++;
      continue;
    }
    const r = await emitStatement(d.id, dropId);
    if (r.error) skipped++;
    else emitted++;
  }
  revalidatePath(`/drops/${dropId}/releves`);
  return { emitted, skipped };
}

export async function deleteDraft(statementId: string, dropId: string): Promise<void> {
  await assertCanEdit();
  const supabase = createClient();
  await supabase.from("royalty_statements").delete().eq("id", statementId).eq("status", "brouillon");
  revalidatePath(`/drops/${dropId}/releves`);
}

export async function setNonResidentTreatment(statementId: string, dropId: string, treatment: string): Promise<void> {
  await assertCanEdit();
  const supabase = createClient();
  await supabase
    .from("royalty_statements")
    .update({ non_resident_treatment: treatment || null })
    .eq("id", statementId)
    .eq("status", "brouillon");
  revalidatePath(`/drops/${dropId}/releves`);
}
