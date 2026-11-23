import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDocusealWebhookSecret, DOCUSEAL_EVENTS } from "@/lib/docuseal/config";
import { ingestCompletedSubmission, recordFormCompleted } from "@/lib/docuseal/signature";
import type { Json } from "@/types/database";

// Node runtime (crypto + service_role), jamais mis en cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vérifie la signature HMAC-SHA256 de DocuSeal.
 * En-tête `X-Docuseal-Signature` = `timestamp.signature` ; contenu signé =
 * `timestamp.corps_brut` ; tolérance de 5 minutes ; comparaison à temps constant.
 */
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const dot = header.indexOf(".");
  if (dot <= 0) return false;
  const timestamp = header.slice(0, dot);
  const signature = header.slice(dot + 1);

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 300) return false; // rejette un envoi trop ancien/futur

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Payload = {
  event_type?: string;
  data?: { id?: number; role?: string; completed_at?: string; submission?: { id?: number } };
};

export async function POST(req: NextRequest) {
  const secret = getDocusealWebhookSecret();
  if (!secret) {
    console.error("[docuseal webhook] DOCUSEAL_WEBHOOK_SECRET manquant");
    return new NextResponse("Config manquante", { status: 500 });
  }

  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-docuseal-signature"), secret)) {
    return new NextResponse("Signature invalide", { status: 401 });
  }

  let payload: Payload = {};
  try {
    payload = JSON.parse(raw) as Payload;
  } catch {
    /* corps illisible : archivé quand même */
  }

  const eventType = payload.event_type ?? null;
  const submissionId = payload.data?.submission?.id ?? payload.data?.id ?? null;
  const admin = createAdminClient();

  // Trace de l'événement (aucune donnée bancaire côté DocuSeal).
  const { data: event } = await admin
    .from("docuseal_events")
    .insert({ event_type: eventType, submission_id: submissionId, processed: false, payload: payload as unknown as Json })
    .select("id")
    .single();

  // form.completed → une partie a signé (horodatage du rôle, pas de statut).
  // submission.completed → les deux ont signé → PDF signé rangé + statut « signé ».
  try {
    let res: { error?: string; skipped?: boolean } | null = null;
    if (submissionId && eventType === DOCUSEAL_EVENTS.formCompleted) {
      res = await recordFormCompleted({
        admin,
        submissionId,
        role: payload.data?.role ?? null,
        completedAt: payload.data?.completed_at ?? null,
      });
    } else if (submissionId && eventType === DOCUSEAL_EVENTS.submissionCompleted) {
      res = await ingestCompletedSubmission({ admin, submissionId });
    }
    if (event?.id) {
      await admin
        .from("docuseal_events")
        .update({ processed: !res?.error, error: res?.error ?? null })
        .eq("id", event.id);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inattendue.";
    if (event?.id) await admin.from("docuseal_events").update({ processed: false, error: msg }).eq("id", event.id);
    console.error("[docuseal webhook]", msg);
    // 200 quand même : l'événement est archivé et DocuSeal réessaiera.
  }

  return NextResponse.json({ ok: true });
}
