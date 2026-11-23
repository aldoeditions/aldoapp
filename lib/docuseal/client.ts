import "server-only";
import { getDocusealConfig } from "./config";

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
  submitters: DocusealSubmitterInput[];
  /** true = envoie l'e-mail de signature ; false = ne notifie pas (test/manuel). */
  sendEmail: boolean;
  /** Sujet / corps de l'e-mail de signature (français). */
  message?: { subject?: string; body?: string };
  /** Adresse en copie à la fin (reçoit le contrat signé). */
  bccCompleted?: string;
  replyTo?: string;
};

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
 * Crée une soumission à partir d'un PDF portant des balises de champ
 * (`{{…;role=Artiste;type=signature}}`). `remove_tags: true` retire les balises
 * du document signé final. `order: "preserved"` : signatures dans l'ordre.
 */
export async function createSubmissionFromPdf(args: CreateFromPdfArgs): Promise<DocusealSubmissionResult> {
  const body = {
    name: args.name,
    order: "preserved",
    send_email: args.sendEmail,
    remove_tags: true,
    bcc_completed: args.bccCompleted,
    reply_to: args.replyTo,
    message: args.message,
    documents: [{ name: args.documentName, file: args.fileBase64 }],
    submitters: args.submitters.map((s, i) => ({
      role: s.role,
      email: s.email,
      name: s.name,
      order: s.order ?? i,
      external_id: s.external_id,
    })),
  };
  return request<DocusealSubmissionResult>("/submissions/pdf", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type DocusealSubmission = {
  id: number;
  status: string | null;
  audit_log_url: string | null;
  combined_document_url: string | null;
  completed_at: string | null;
  documents: { name: string | null; url: string | null }[] | null;
  submitters: { email: string | null; status: string | null; completed_at: string | null }[] | null;
};

/** Récupère une soumission (URLs de documents fraîches — elles expirent ~40 min). */
export async function getSubmission(id: number): Promise<DocusealSubmission> {
  return request<DocusealSubmission>(`/submissions/${id}`, { method: "GET" });
}

/** Télécharge un fichier DocuSeal (URL signée, courte durée) en Buffer. */
export async function fetchFileBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Téléchargement DocuSeal impossible (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}
