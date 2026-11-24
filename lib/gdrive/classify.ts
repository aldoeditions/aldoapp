import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CONTRACTS_BUCKET } from "@/lib/contracts/service";
import { campaignNumberFromDropName, normalizeName } from "@/lib/contracts/filename";
import { getGoogleDriveConfig } from "./config";
import { listChildFolders, createFolder, uploadFile, type DriveFolder } from "./client";

type Db = SupabaseClient<Database>;

/** Nom légal « Prénom Nom » (repli pseudo), comme dans le contrat. */
function legalName(a: { first_name: string | null; last_name: string | null; name: string }): string {
  return [a.first_name, a.last_name].map((x) => (x ?? "").trim()).filter(Boolean).join(" ").trim() || a.name;
}

/** Trouve un sous-dossier par nom, insensible aux accents/casse. */
function findByNormalizedName(folders: DriveFolder[], target: string): DriveFolder | null {
  const t = normalizeName(target);
  return folders.find((f) => normalizeName(f.name) === t) ?? null;
}

/**
 * Cherche le dossier de campagne de l'artiste (« C{n}_{nom du dossier Drive} »)
 * sous `ALDO/Artistes`. Ne crée RIEN : un dossier introuvable est signalé à
 * l'appelant (le nommage réel des dossiers Drive n'est pas garanti).
 */
async function locateArtistCampaignFolder(admin: Db, n: number, folderName: string): Promise<DriveFolder | null> {
  const { artistesFolderId } = getGoogleDriveConfig();
  const target = `C${n}_${folderName}`;
  const children = await listChildFolders(admin, artistesFolderId);
  return findByNormalizedName(children, target);
}

/** Trouve le sous-dossier « Contrats » d'un dossier de campagne artiste, ou le crée. */
async function locateOrCreateContratsFolder(admin: Db, artistFolderId: string): Promise<DriveFolder> {
  const children = await listChildFolders(admin, artistFolderId);
  const existing = findByNormalizedName(children, "Contrats");
  if (existing) return existing;
  return createFolder(admin, "Contrats", artistFolderId);
}

export type ClassifyResult = {
  error?: string;
  skipped?: boolean; // déjà classé (idempotent)
  folderMissing?: boolean; // dossier artiste introuvable : rien n'a été déposé
};

/**
 * Classe un contrat SIGNÉ dans Drive : retrouve le dossier de campagne de
 * l'artiste sous `ALDO/Artistes`, dépose le PDF signé (+ le journal d'audit
 * s'il existe) dans son sous-dossier « Contrats », et enregistre les id Drive
 * sur le contrat. Idempotent : ne refait rien si `drive_file_id` est déjà
 * posé. Si le dossier artiste est introuvable, ne crée rien et marque
 * `drive_folder_missing` (visible sur la fiche campagne, pour rattrapage
 * manuel après correction du nom du dossier Drive ou de la fiche artiste).
 * Ne lève jamais : toute erreur (y compris Drive non connecté / connexion
 * expirée) revient en `{ error }`, jamais en exception — l'appelant (webhook,
 * action en lot, outil MCP) n'a qu'à lire le résultat.
 */
export async function classifyContractInDrive(args: { admin: Db; contractId: string }): Promise<ClassifyResult> {
  const { admin, contractId } = args;
  try {
    const { data: c } = await admin
      .from("contracts")
      .select("id, artist_id, drop_id, status, file_path, audit_log_path, drive_file_id")
      .eq("id", contractId)
      .maybeSingle();
    if (!c) return { error: "Contrat introuvable." };
    if (c.status !== "signé") return { error: "Seuls les contrats signés peuvent être classés dans Drive." };
    if (c.drive_file_id) return { skipped: true }; // déjà classé
    if (!c.file_path) return { error: "Aucun PDF signé à classer." };
    if (!c.drop_id) return { error: "Contrat sans campagne." };

    const [{ data: artist }, { data: drop }] = await Promise.all([
      admin.from("artists").select("name, first_name, last_name, drive_folder_name").eq("id", c.artist_id).maybeSingle(),
      admin.from("drops").select("name").eq("id", c.drop_id).maybeSingle(),
    ]);
    if (!artist) return { error: "Artiste introuvable." };
    const n = campaignNumberFromDropName(drop?.name);
    if (n == null) return { error: "Numéro de campagne introuvable (nom du drop)." };
    const folderName = (artist.drive_folder_name ?? artist.name).trim();
    const fullName = legalName(artist);

    const artistFolder = await locateArtistCampaignFolder(admin, n, folderName);
    if (!artistFolder) {
      await admin.from("contracts").update({ drive_folder_missing: true }).eq("id", contractId);
      return { folderMissing: true };
    }
    const contratsFolder = await locateOrCreateContratsFolder(admin, artistFolder.id);

    const { data: pdfBlob, error: dlErr } = await admin.storage.from(CONTRACTS_BUCKET).download(c.file_path);
    if (dlErr || !pdfBlob) return { error: dlErr?.message ?? "PDF signé introuvable dans le Storage." };
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    const pdfUpload = await uploadFile(admin, {
      name: `C${n}_${fullName}_Contrat_signé.pdf`,
      parentId: contratsFolder.id,
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    let auditFileId: string | null = null;
    if (c.audit_log_path) {
      const { data: auditBlob } = await admin.storage.from(CONTRACTS_BUCKET).download(c.audit_log_path);
      if (auditBlob) {
        const auditBuffer = Buffer.from(await auditBlob.arrayBuffer());
        const auditUpload = await uploadFile(admin, {
          name: `C${n}_${fullName}_Journal_audit.pdf`,
          parentId: contratsFolder.id,
          mimeType: "application/pdf",
          buffer: auditBuffer,
        });
        auditFileId = auditUpload.id;
      }
    }

    const { error } = await admin
      .from("contracts")
      .update({
        drive_file_id: pdfUpload.id,
        drive_audit_file_id: auditFileId,
        drive_classed_at: new Date().toISOString(),
        drive_folder_missing: false,
      })
      .eq("id", contractId);
    if (error) return { error: error.message };

    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur Drive inattendue." };
  }
}

export type FolderPreview = {
  artist_id: string;
  drop_id: string;
  campaign_number: number | null;
  target_folder: string;
  found: boolean;
};

/**
 * Aperçu SANS rien déposer : le dossier de campagne de l'artiste existe-t-il ?
 * Sert à l'aperçu de l'action « Classer dans Drive » (app + MCP). Peut lever
 * (Drive non connecté/expiré) : à l'appelant de l'attraper si besoin — un
 * aperçu sans connexion Drive n'a pas de sens de toute façon.
 */
export async function previewArtistCampaignFolder(args: {
  admin: Db;
  artistId: string;
  dropId: string;
}): Promise<FolderPreview> {
  const { admin, artistId, dropId } = args;
  const [{ data: artist }, { data: drop }] = await Promise.all([
    admin.from("artists").select("name, drive_folder_name").eq("id", artistId).maybeSingle(),
    admin.from("drops").select("name").eq("id", dropId).maybeSingle(),
  ]);
  const n = campaignNumberFromDropName(drop?.name);
  const folderName = (artist?.drive_folder_name ?? artist?.name ?? "").trim();
  const target = n != null ? `C${n}_${folderName}` : folderName;
  const found = n != null && folderName ? Boolean(await locateArtistCampaignFolder(admin, n, folderName)) : false;
  return { artist_id: artistId, drop_id: dropId, campaign_number: n, target_folder: target, found };
}
