import "server-only";
import { PDFDocument } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CONTRACTS_BUCKET } from "@/lib/contracts/service";
import { campaignNumberFromDropName } from "@/lib/contracts/filename";
import { signatureFields } from "@/lib/contracts/signature-layout";
import { DOCUSEAL_ROLE_ARTISTE, DOCUSEAL_ROLE_ALDO } from "./config";
import { createSubmissionFromPdf, getSubmission, fetchFileBuffer, archiveSubmission, SUBMITTER_LINK } from "./client";

type Db = SupabaseClient<Database>;

/** Nombre de pages du PDF (base64) → la page de signature est la dernière. */
async function pdfPageCount(base64: string): Promise<number> {
  const doc = await PDFDocument.load(Buffer.from(base64, "base64"));
  return doc.getPageCount();
}

/**
 * Gabarit UNIQUE des e-mails (réel ET test), pour que le test reflète l'envoi
 * réel. Corps en texte brut (la doc DocuSeal ne garantit ni Markdown ni HTML) :
 * le lien de signature est seul sur sa ligne. `n` = numéro de campagne,
 * `artistFullName` = « Prénom Nom » de l'artiste.
 */
export function buildSignatureMessages(artistFullName: string, n: string): {
  artiste: { subject: string; body: string };
  aldo: { subject: string; body: string };
} {
  const artisteBody =
    `Hello !\n\n` +
    `Voici ton contrat pour la prochaine campagne d'Aldo. Tu trouveras tout le récap des infos utiles dont on a déjà parlé ensemble :)\n\n` +
    `Signer le contrat :\n${SUBMITTER_LINK}\n\n` +
    `Si quelque chose ne te semble pas juste, envoie-moi un message avant de signer.\n\n` +
    `Merci, et à très vite,\nLouison`;
  return {
    artiste: { subject: `Ton contrat Aldo Éditions — campagne ${n}`, body: artisteBody },
    aldo: {
      subject: `À contresigner — contrat C${n} ${artistFullName}`,
      body: `${artistFullName} a signé son contrat. À toi de contresigner :\n${SUBMITTER_LINK}`,
    },
  };
}

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
 * soumission DocuSeal à deux signataires — l'Artiste (ordre 0) PUIS Aldo
 * (contre-signature, ordre 1) — à partir du PDF stocké, puis passe le contrat à
 * « envoyé ». Le contrat ne deviendra « signé » qu'à `submission.completed`,
 * c.-à-d. quand les deux ont signé. Ne renvoie jamais le PDF ni l'IBAN.
 *
 * La contre-signature Aldo part TOUJOURS vers `company_settings.email`
 * (contact@aldo-editions.com), quel que soit l'appelant (bouton app ou MCP).
 */
export async function sendContractForSignature(args: {
  supabase: Db;
  admin: Db;
  contractId: string;
}): Promise<{ error?: string; submissionId?: number; email?: string }> {
  const { supabase, admin, contractId } = args;
  const countersignEmail = ((await companyEmail(admin)) ?? "").trim();
  const countersignName = "Louison Dupont";
  if (!countersignEmail) {
    return { error: "Contre-signature impossible : l'e-mail de la société (company_settings.email) est vide." };
  }

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
  const n = num != null ? String(num) : drop?.name ?? "";
  const fileBase64 = await downloadPdfBase64(admin, c.pdf_path);
  const fields = signatureFields(await pdfPageCount(fileBase64)); // page signature = dernière page
  const bcc = countersignEmail; // = company_settings.email
  const msgs = buildSignatureMessages(fullName, n);

  const submission = await createSubmissionFromPdf({
    name: `Contrat C${n} — ${fullName}`.trim(),
    documentName: `Contrat C${n} ${fullName}`.trim(),
    fileBase64,
    fields,
    submitters: [
      { role: DOCUSEAL_ROLE_ARTISTE, email, name: fullName, order: 0, external_id: contractId, message: msgs.artiste },
      { role: DOCUSEAL_ROLE_ALDO, email: countersignEmail, name: countersignName, order: 1, external_id: contractId, message: msgs.aldo },
    ],
    sendEmail: true,
    message: msgs.artiste, // repli global (= message de l'Artiste)
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
}): Promise<{ error?: string; submissionId?: number; verification?: string }> {
  const { admin, contractId, email } = args;
  const { data: c } = await admin
    .from("contracts")
    .select("pdf_path, drop_id")
    .eq("id", contractId)
    .maybeSingle();
  if (!c?.pdf_path) return { error: "Contrat de test introuvable ou sans PDF." };
  const { data: drop } = c.drop_id
    ? await admin.from("drops").select("name").eq("id", c.drop_id).maybeSingle()
    : { data: null };
  const num = campaignNumberFromDropName(drop?.name);
  const n = num != null ? String(num) : drop?.name ?? "";

  // Archive le test précédent (trace dans docuseal_events) pour ne pas accumuler.
  const { data: prior } = await admin
    .from("docuseal_events")
    .select("submission_id")
    .eq("event_type", "test.created")
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prior?.submission_id) {
    try {
      await archiveSubmission(prior.submission_id);
    } catch {
      /* best-effort */
    }
  }

  const fileBase64 = await downloadPdfBase64(admin, c.pdf_path);
  const fields = signatureFields(await pdfPageCount(fileBase64));
  // Faux artiste « Test Aldo » + gabarit EXACTEMENT identique à l'envoi réel,
  // les deux rôles allant à ta propre adresse.
  const fakeArtist = "Test Aldo";
  const msgs = buildSignatureMessages(fakeArtist, n);
  const submission = await createSubmissionFromPdf({
    name: `TEST signature — ${fakeArtist}`,
    documentName: `TEST Contrat ${fakeArtist}`,
    fileBase64,
    fields,
    submitters: [
      { role: DOCUSEAL_ROLE_ARTISTE, email, name: fakeArtist, order: 0, message: msgs.artiste },
      { role: DOCUSEAL_ROLE_ALDO, email, name: "Louison Dupont", order: 1, message: msgs.aldo },
    ],
    sendEmail: true,
    message: msgs.artiste,
  });

  await admin.from("docuseal_events").insert({ event_type: "test.created", submission_id: submission.id, processed: true });

  // Vérification via l'API : relit la soumission et contrôle les 2 rôles.
  let verification = "";
  try {
    const sub = await getSubmission(submission.id);
    const roles = (sub.submitters ?? []).map((x) => x.role).filter(Boolean);
    const hasArtiste = roles.includes(DOCUSEAL_ROLE_ARTISTE);
    const hasAldo = roles.includes(DOCUSEAL_ROLE_ALDO);
    verification = `soumission #${submission.id} — ${roles.length} signataire(s) : ${roles.join(", ")}.` +
      (hasArtiste && hasAldo ? " ✓ rôles Artiste + Aldo présents." : " ⚠ rôles attendus manquants !");
  } catch {
    verification = `soumission #${submission.id} créée (relecture API indisponible).`;
  }

  return { submissionId: submission.id, verification };
}

/**
 * Enregistre une signature PARTIELLE (événement `form.completed`) : horodate le
 * rôle qui vient de signer (Artiste ou Aldo) sans changer le statut ni
 * télécharger. Le passage à « signé » se fait à `submission.completed`.
 * Idempotent. Utilise le client admin.
 */
export async function recordFormCompleted(args: {
  admin: Db;
  submissionId: number;
  role: string | null;
  completedAt: string | null;
}): Promise<{ error?: string; skipped?: boolean }> {
  const { admin, submissionId, role } = args;
  const { data: c } = await admin
    .from("contracts")
    .select("id, status, artist_signed_at, aldo_signed_at")
    .eq("docuseal_submission_id", submissionId)
    .maybeSingle();
  if (!c) return { skipped: true };

  const when = args.completedAt ?? new Date().toISOString();
  const patch: { artist_signed_at?: string; aldo_signed_at?: string } = {};
  if (role === DOCUSEAL_ROLE_ALDO) {
    if (!c.aldo_signed_at) patch.aldo_signed_at = when;
  } else if (!c.artist_signed_at) {
    patch.artist_signed_at = when; // rôle par défaut = Artiste
  }
  if (Object.keys(patch).length === 0) return { skipped: true };

  const { error } = await admin.from("contracts").update(patch).eq("id", c.id);
  return error ? { error: error.message } : {};
}

/**
 * Traite une soumission TERMINÉE (les deux parties ont signé) : télécharge le
 * PDF signé + le journal d'audit (URLs fraîches, elles expirent vite) et les
 * range dans le bucket `contracts`, puis passe le contrat à « signé ».
 * Idempotent. Utilise le client admin.
 */
export async function ingestCompletedSubmission(args: {
  admin: Db;
  submissionId: number;
}): Promise<{ error?: string; skipped?: boolean }> {
  const { admin, submissionId } = args;

  const { data: c } = await admin
    .from("contracts")
    .select("id, artist_id, status, file_path, artist_signed_at, aldo_signed_at")
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

  const done = sub.completed_at ?? new Date().toISOString();
  const { error } = await admin
    .from("contracts")
    .update({
      status: "signé",
      signed_at: done,
      file_path: signedPath,
      audit_log_path: auditPath,
      artist_signed_at: c.artist_signed_at ?? done,
      aldo_signed_at: c.aldo_signed_at ?? done,
    })
    .eq("id", c.id);
  if (error) return { error: error.message };

  return {};
}
