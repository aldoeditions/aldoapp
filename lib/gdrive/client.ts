import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getDriveAccessToken } from "./auth";

/**
 * Client bas niveau de l'API Google Drive v3 (REST directe, sans SDK — même
 * esprit que `lib/docuseal/client.ts`). Seules les opérations nécessaires au
 * classement des contrats : lister des sous-dossiers, en créer un, y déposer
 * un fichier. Authentifié par le compte Google connecté (OAuth utilisateur,
 * `admin` sert à lire/rafraîchir le token stocké).
 */

type Db = SupabaseClient<Database>;

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

async function driveRequest<T>(admin: Db, url: string, init: RequestInit = {}): Promise<T> {
  const token = await getDriveAccessToken(admin);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google Drive a répondu ${res.status}${detail ? ` : ${detail.slice(0, 300)}` : ""}.`);
  }
  return (await res.json()) as T;
}

export type DriveFolder = { id: string; name: string };

/** Sous-dossiers directs (non supprimés) d'un dossier Drive. */
export async function listChildFolders(admin: Db, parentId: string): Promise<DriveFolder[]> {
  const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name)",
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const data = await driveRequest<{ files: DriveFolder[] }>(admin, `${API}/files?${params.toString()}`);
  return data.files ?? [];
}

/** Crée un sous-dossier. Ne vérifie pas l'absence de doublon (à l'appelant). */
export async function createFolder(admin: Db, name: string, parentId: string): Promise<DriveFolder> {
  return driveRequest<DriveFolder>(admin, `${API}/files?supportsAllDrives=true&fields=id,name`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
}

/**
 * Dépose un fichier dans un dossier (upload multipart, métadonnées + contenu
 * en une requête). Toujours avec `parents` dès la création.
 */
export async function uploadFile(
  admin: Db,
  args: { name: string; parentId: string; mimeType: string; buffer: Buffer },
): Promise<{ id: string }> {
  const boundary = `aldo_${randomBytes(16).toString("hex")}`;
  const metadata = JSON.stringify({ name: args.name, parents: [args.parentId] });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${args.mimeType}\r\n\r\n`),
    args.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  return driveRequest<{ id: string }>(admin, `${UPLOAD_API}/files?uploadType=multipart&supportsAllDrives=true&fields=id`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}
