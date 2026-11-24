import "server-only";
import { getDocusealConfig } from "./config";
import type { DocusealField } from "@/lib/contracts/signature-layout";

/**
 * Client bas niveau de l'API DocuSeal. Aucune donnée sensible n'est journalisée
 * (on ne logue jamais le corps des requêtes : il contient le PDF du contrat).
 */

export type DocusealSubmitterInput = {
  role: string;
  email: string;
  name?: string;
  order?: number;
  external_id?: string;
  /** Message e-mail propre à ce signataire (prioritaire sur le message global). */
  message?: { subject?: string; body?: string };
};

export type DocusealSubmissionResult = {
  id: number;
  submitters: { id: number; email: string | null; role: string | null; slug: string | null; status: string | null }[];
  status: string | null;
};

type CreateFromPdfArgs = {
  /** Nom de la soumission (interne DocuSeal). */
  name: string;
  /** Nom du document (fichier). */
  documentName: string;
  /** PDF encodé en base64 (sans préfixe data:). */
  fileBase64: string;
  /** Champs placés par coordonnées (areas). Reliés au submitter par `role`. */
  fields: DocusealField[];
  submitters: DocusealSubmitterInput[];
  /** true = envoie l'e-mail de signature ; false = ne notifie pas (test/manuel). */
  sendEmail: boolean;
  /** Sujet / corps de l'e-mail de signature (français). Le corps DOIT contenir
   *  le lien {{submitter.link}} (garde-fou). */
  message?: { subject?: string; body?: string };
  /** Adresse en copie à la fin (reçoit le contrat signé). */
  bccCompleted?: string;
  replyTo?: string;
};

/** Variable DocuSeal du lien personnel de signature. */
export const SUBMITTER_LINK = "{{submitter.link}}";

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { apiUrl, apiKey } = getDocusealConfig();
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "X-Auth-Token": apiKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    // On lit le corps pour le message, mais on ne le logue pas (PII).
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    throw new Error(`DocuSeal a répondu ${res.status}${detail ? ` : ${detail}` : ""}`);
  }
  return (await res.json()) as T;
}

/**
 * Crée une soumission à partir d'un PDF, les champs signature étant placés par
 * COORDONNÉES (`documents[].fields[].areas`), reliés aux submitters par `role`.
 * `order: "preserved"` : l'Artiste signe d'abord, Aldo ensuite.
 *
 * Garde-fou : si un e-mail est envoyé, le corps doit contenir le lien de
 * signature {{submitter.link}}, sinon l'envoi est refusé.
 */
export async function createSubmissionFromPdf(args: CreateFromPdfArgs): Promise<DocusealSubmissionResult> {
  // Garde-fou : tout corps d'e-mail personnalisé doit contenir le lien de
  // signature (sinon le signataire n'a aucun moyen de signer).
  if (args.sendEmail) {
    const bodies = [args.message?.body, ...args.submitters.map((s) => s.message?.body)].filter(
      (b): b is string => typeof b === "string" && b.length > 0,
    );
    if (bodies.some((b) => !b.includes(SUBMITTER_LINK))) {
      throw new Error(`Envoi refusé : un corps d'e-mail ne contient pas le lien de signature ${SUBMITTER_LINK}.`);
    }
  }
  const body = {
    name: args.name,
    order: "preserved",
    send_email: args.sendEmail,
    bcc_completed: args.bccCompleted,
    reply_to: args.replyTo,
    message: args.message,
    documents: [{ name: args.documentName, file: args.fileBase64, fields: args.fields }],
    submitters: args.submitters.map((s, i) => ({
      role: s.role,
      email: s.email,
      name: s.name,
      order: s.order ?? i,
      external_id: s.external_id,
      message: s.message,
    })),
  };
  return request<DocusealSubmissionResult>("/submissions/pdf", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Archive une soumission (DELETE /submissions/{id}). Best-effort. */
export async function archiveSubmission(id: number): Promise<void> {
  await request<unknown>(`/submissions/${id}`, { method: "DELETE" });
}

export type DocusealSubmission = {
  id: number;
  status: string | null;
  audit_log_url: string | null;
  combined_document_url: string | null;
  completed_at: string | null;
  documents: { name: string | null; url: string | null }[] | null;
  submitters: { id: number; email: string | null; role: string | null; status: string | null; completed_at: string | null }[] | null;
};

/** Récupère une soumission (URLs de documents fraîches — elles expirent ~40 min). */
export async function getSubmission(id: number): Promise<DocusealSubmission> {
  return request<DocusealSubmission>(`/submissions/${id}`, { method: "GET" });
}

/**
 * Renvoie l'e-mail de signature à un signataire précis (PUT /submitters/{id},
 * `send_email: true` — vérifié dans la doc DocuSeal : pas d'endpoint « resend »
 * dédié, c'est la mise à jour du submitter qui ré-envoie l'e-mail).
 */
export async function resendSubmitterEmail(submitterId: number): Promise<void> {
  await request<unknown>(`/submitters/${submitterId}`, {
    method: "PUT",
    body: JSON.stringify({ send_email: true }),
  });
}

/** Télécharge un fichier DocuSeal (URL signée, courte durée) en Buffer. */
export async function fetchFileBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Téléchargement DocuSeal impossible (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}
