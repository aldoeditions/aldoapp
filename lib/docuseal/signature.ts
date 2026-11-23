import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CONTRACTS_BUCKET } from "@/lib/contracts/service";
import { campaignNumberFromDropName } from "@/lib/contracts/filename";
import { DOCUSEAL_ROLE_ARTISTE } from "./config";
import { createSubmissionFromPdf, getSubmission, fetchFileBuffer } from "./client";

type Db = SupabaseClient<Database>;

/** Nom légal « Prénom Nom » (repli pseudo), comme dans le contrat. */
function legalName(a: { first_name: string | null; last_name: string | null; name: string }): string {
  return [a.first_name, a.last_name].map((x) => (x ?? "").trim()).filter(Boolean).join(" ").trim() || a.name;
}

/** Télécharge un PDF du bucket privé `contracts` et le renvoie en base64. */
async function downloadPdfBase64(admin: Db, path: string): Promise<string> {
  const { data, error } = await admin.storage.from(CONTRACTS_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "PDF du contrat introuvable dans le Storage.");
  return Buffer.from(await data.arrayBuffer()).toString("base64");
}

async function companyEmail(admin: Db): Promise<string | null> {
  const { data } = await admin.from("company_settings").select("email").limit(1).maybeSingle();
  return data?.email ?? null;
}

/**
 * Envoie en signature le contrat EN BROUILLON `contractId` : crée une
 * soumission DocuSeal (l'Artiste comme signataire) à partir du PDF stocké, puis
 * passe le contrat à « envoyé » avec l'id de soumission. Ne renvoie jamais le
 * PDF ni l'IBAN.
 */
export async function sendContractForSignature(args: {
  supabase: Db;
  admin: Db;
  contractId: string;
}): Promise<{ error?: string; submissionId?: number; email?: string }> {
  const { supabase, admin, contractId } = args;

  const { data: c } = await supabase
    .from("contracts")
    .select("id, artist_id, drop_id, status, pdf_path, docuseal_submission_id")
    .eq("id", contractId)
    .maybeSingle();
  if (!c) return { error: "Contrat introuvable." };
  if (c.status !== "brouillon") return { error: "Seuls les contrats en brouillon peuvent être envoyés en signature." };
  if (!c.pdf_path) return { error: "Aucun PDF à envoyer (contrat non généré)." };

  const [{ data: artist }, { data: drop }] = await Promise.all([
    supabase.from("artists").select("name, first_name, last_name, email").eq("id", c.artist_id).maybeSingle(),
    c.drop_id ? supabase.from("drops").select("name").eq("id", c.drop_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!artist) return { error: "Artiste introuvable." };
  const email = (artist.email ?? "").trim();
  if (!email) return { error: "L'artiste n'a pas d'e-mail : impossible d'envoyer en signature." };

  const fullName = legalName(artist);
  const num = campaignNumberFromDropName(drop?.name);
  const campagne = num ? `C${num}` : drop?.name ?? "";
  const fileBase64 = await downloadPdfBase64(admin, c.pdf_path);
  const bcc = await companyEmail(admin);

  const submission = await createSubmissionFromPdf({
    name: `Contrat ${campagne} — ${fullName}`.trim(),
    documentName: `Contrat ${campagne} ${fullName}`.trim(),
    fileBase64,
    submitters: [{ role: DOCUSEAL_ROLE_ARTISTE, email, name: fullName, order: 0, external_id: contractId }],
    sendEmail: true,
    message: {
      subject: `Votre contrat Aldo Éditions à signer — ${campagne}`,
      body: "Bonjour,\n\nVotre contrat de licence avec Aldo Éditions est prêt. Merci de le relire et de le signer en ligne. Vous en recevrez une copie signée par e-mail.\n\nL'équipe Aldo Éditions.",
    },
    bccCompleted: bcc ?? undefined,
    replyTo: bcc ?? undefined,
  });

  const { error } = await supabase
    .from("contracts")
    .update({
      status: "envoyé",
      sent_at: new Date().toISOString(),
      docuseal_submission_id: submission.id,
    })
    .eq("id", contractId);
  if (error) return { error: error.message };

  return { submissionId: submission.id, email };
}

/**
 * TEST : envoie une soumission à une adresse donnée à partir du PDF d'un
 * contrat existant, SANS modifier le contrat (aucun id stocké → le webhook
 * l'ignore). Sert à valider le circuit avant tout envoi réel.
 */
export async function sendTestSignature(args: {
  admin: Db;
  contractId: string;
  email: string;
  signerName?: string;
}): Promise<{ error?: string; submissionId?: number }> {
  const { admin, contractId, email } = args;
  const { data } = await admin
    .from("contracts")
    .select("pdf_path, artists(name, first_name, last_name)")
    .eq("id", contractId)
    .maybeSingle();
  const c = data as unknown as {
    pdf_path: string | null;
    artists: { name: string; first_name: string | null; last_name: string | null } | null;
  } | null;
  if (!c?.pdf_path) return { error: "Contrat de test introuvable ou sans PDF." };

  const fileBase64 = await downloadPdfBase64(admin, c.pdf_path);
  const name = args.signerName || (c.artists ? legalName(c.artists) : "Test");
  const submission = await createSubmissionFromPdf({
    name: `TEST signature — ${name}`,
    documentName: `TEST Contrat ${name}`,
    fileBase64,
    submitters: [{ role: DOCUSEAL_ROLE_ARTISTE, email, name }],
    sendEmail: true,
    message: {
      subject: "TEST — contrat Aldo Éditions (ne pas transmettre)",
      body: "Ceci est un test du circuit de signature Aldo Éditions. Vous pouvez signer pour vérifier le rendu.",
    },
  });
  return { submissionId: submission.id };
}

/**
 * Traite une soumission terminée : télécharge le PDF signé + le journal d'audit
 * (URLs fraîches, elles expirent vite) et les range dans le bucket `contracts`,
 * puis passe le contrat à « signé ». Idempotent. Utilise le client admin.
 */
export async function ingestCompletedSubmission(args: {
  admin: Db;
  submissionId: number;
}): Promise<{ error?: string; skipped?: boolean }> {
  const { admin, submissionId } = args;

  const { data: c } = await admin
    .from("contracts")
    .select("id, artist_id, status, file_path")
    .eq("docuseal_submission_id", submissionId)
    .maybeSingle();
  if (!c) return { skipped: true }; // soumission de test ou inconnue → ignorer
  if (c.status === "signé" && c.file_path) return { skipped: true }; // déjà traité

  const sub = await getSubmission(submissionId);
  const signedUrl = sub.combined_document_url || sub.documents?.find((d) => d.url)?.url || null;
  if (!signedUrl) return { error: "Aucun document signé disponible pour le moment." };

  const ts = Date.now();
  const signedPath = `${c.artist_id}/signed-${c.id}-${ts}.pdf`;
  const signedBuf = await fetchFileBuffer(signedUrl);
  const upSigned = await admin.storage.from(CONTRACTS_BUCKET).upload(signedPath, signedBuf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upSigned.error) return { error: upSigned.error.message };

  let auditPath: string | null = null;
  if (sub.audit_log_url) {
    try {
      const auditBuf = await fetchFileBuffer(sub.audit_log_url);
      const p = `${c.artist_id}/audit-${c.id}-${ts}.pdf`;
      const upAudit = await admin.storage.from(CONTRACTS_BUCKET).upload(p, auditBuf, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!upAudit.error) auditPath = p;
    } catch {
      /* le journal d'audit est optionnel : on ne bloque pas la signature */
    }
  }

  const { error } = await admin
    .from("contracts")
    .update({
      status: "signé",
      signed_at: sub.completed_at ?? new Date().toISOString(),
      file_path: signedPath,
      audit_log_path: auditPath,
    })
    .eq("id", c.id);
  if (error) return { error: error.message };

  return {};
}
