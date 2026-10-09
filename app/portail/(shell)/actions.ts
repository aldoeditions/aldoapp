"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArtist } from "@/lib/auth/session";
import {
  createFileReviewTask,
  notifyArtistProfileChange,
  notifyArtistEvent,
} from "@/app/(app)/projet/actions";
import { encryptSensitive, last4 } from "@/lib/crypto";
import { ARTIST_QUESTIONS } from "@/lib/constants";
import type { TablesInsert, TablesUpdate } from "@/types/database";

const DOCS_BUCKET = "artist-documents";
const ASSETS_BUCKET = "artist-assets";

/** Enregistre en base un fichier déjà uploadé sur le Storage (statut en attente). */
export async function registerFile(input: {
  path: string;
  filename: string;
  size: number;
  mime: string;
  oeuvreId?: string | null;
}): Promise<{ error?: string }> {
  const user = await requireArtist();
  const supabase = createClient();

  const row: TablesInsert<"artist_files"> = {
    artist_id: user.artistId,
    oeuvre_id: input.oeuvreId || null,
    filename: input.filename,
    file_path: input.path,
    file_size: input.size,
    mime_type: input.mime,
    status: "en attente",
  };
  const { error } = await supabase.from("artist_files").insert(row);
  if (error) return { error: error.message };

  // Automatisation : tâche « Valider le fichier de X » côté équipe (non bloquant).
  try {
    await createFileReviewTask({ artistId: user.artistId, filename: input.filename });
  } catch {
    /* le dépôt reste valide même si la tâche de validation échoue */
  }

  revalidatePath("/portail/fichiers");
  return {};
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

/** Marque l'onboarding comme vu (une seule fois). */
export async function completeOnboarding(): Promise<{ error?: string }> {
  const user = await requireArtist();
  const supabase = createClient();
  const { error } = await supabase
    .from("artists")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.artistId);
  if (error) return { error: error.message };
  revalidatePath("/portail");
  return {};
}

/** Mémorise l'étape courante du wizard d'onboarding (pour reprise). Non bloquant. */
export async function setOnboardingStep(step: number): Promise<void> {
  const user = await requireArtist();
  const supabase = createClient();
  await supabase.from("artists").update({ onboarding_step: step }).eq("id", user.artistId);
}

/**
 * L'artiste soumet/modifie la description d'UNE de ses œuvres → passe en
 * « à valider » (relecture équipe). Écriture via client admin (l'artiste n'a
 * pas le droit d'UPDATE oeuvres en RLS), après vérification de propriété.
 */
export async function submitOeuvreDescription(
  oeuvreId: string,
  description: string,
): Promise<{ error?: string }> {
  const user = await requireArtist();
  const admin = createAdminClient();

  const { data: oeuvre } = await admin
    .from("oeuvres")
    .select("id, artist_id")
    .eq("id", oeuvreId)
    .maybeSingle();
  if (!oeuvre || oeuvre.artist_id !== user.artistId) {
    return { error: "Œuvre introuvable." };
  }

  const text = description.trim();
  if (!text) return { error: "La description est vide." };

  const { error } = await admin
    .from("oeuvres")
    .update({ description: text, description_status: "à valider" })
    .eq("id", oeuvreId);
  if (error) return { error: error.message };

  revalidatePath("/portail/oeuvres");
  revalidatePath("/portail");
  return {};
}

export type ProfileState = { error: string | null; ok?: boolean };

/** Met à jour le profil de l'artiste connecté (+ avatar optionnel). */
export async function updateMyProfile(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const user = await requireArtist();
  const supabase = createClient();

  const update: TablesUpdate<"artists"> = {
    bio: str(fd, "bio"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    instagram: str(fd, "instagram"),
    portfolio_url: str(fd, "portfolio_url"),
    address: str(fd, "address"),
    city: str(fd, "city"),
    country: str(fd, "country"),
    iban: str(fd, "iban"),
    bic: str(fd, "bic"),
  };

  // Avatar (upload via client admin → bucket public artist-assets)
  const avatar = fd.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    try {
      const admin = createAdminClient();
      const ext = (avatar.name.split(".").pop() || "png").toLowerCase();
      const path = `avatars/${user.artistId}/${Date.now()}.${ext}`;
      const bytes = new Uint8Array(await avatar.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from("artist-assets")
        .upload(path, bytes, { contentType: avatar.type, upsert: true });
      if (upErr) throw upErr;
      update.avatar_url = admin.storage.from("artist-assets").getPublicUrl(path).data.publicUrl;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Échec de l'upload de la photo." };
    }
  }

  const { error } = await supabase
    .from("artists")
    .update(update)
    .eq("id", user.artistId);
  if (error) return { error: error.message };

  // Prévient l'équipe (tâche à vérifier), sans bloquer l'enregistrement.
  try {
    await notifyArtistProfileChange(user.artistId);
  } catch {
    /* non bloquant */
  }

  revalidatePath("/portail/profil");
  revalidatePath("/portail");
  return { error: null, ok: true };
}

/**
 * Statut social (Urssaf) déclaré par l'artiste : régime, n° sécu (chiffré),
 * SIRET, + justificatif optionnel déposé dans le bucket privé artist-documents
 * (via client admin car l'artiste n'y a pas accès en RLS).
 */
export async function updateMySocialStatus(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const user = await requireArtist();
  const supabase = createClient();

  const regime = str(fd, "social_regime") ?? "artiste_auteur_precompte";
  const update: TablesUpdate<"artists"> = {
    social_regime: regime,
    is_artiste_auteur: regime.startsWith("artiste_auteur"),
    siret: str(fd, "siret"),
  };
  // Chiffrement du n° de sécu — si la clé serveur est indisponible, on ne bloque
  // pas l'enregistrement du reste ; on prévient l'artiste.
  let ssnError = false;
  const ssn = str(fd, "social_security_number");
  if (ssn) {
    try {
      update.social_security_number_enc = encryptSensitive(ssn);
      update.social_security_last4 = last4(ssn);
    } catch {
      ssnError = true;
    }
  }

  // Justificatif optionnel → bucket privé (admin-only).
  const doc = fd.get("document");
  if (doc instanceof File && doc.size > 0) {
    try {
      const admin = createAdminClient();
      const ext = (doc.name.split(".").pop() || "pdf").toLowerCase();
      const safe = doc.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.artistId}/statut-${Date.now()}-${safe}`.replace(/\.[^.]*$/, `.${ext}`);
      const bytes = new Uint8Array(await doc.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from(DOCS_BUCKET)
        .upload(path, bytes, { contentType: doc.type, upsert: true });
      if (upErr) throw upErr;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Échec de l'envoi du justificatif." };
    }
  }

  const { error } = await supabase
    .from("artists")
    .update(update)
    .eq("id", user.artistId);
  if (error) return { error: error.message };

  try {
    await notifyArtistProfileChange(user.artistId);
  } catch {
    /* non bloquant */
  }

  revalidatePath("/portail/profil");
  if (ssnError) {
    return {
      error:
        "Tes autres infos sont enregistrées, mais ton n° de sécurité sociale n'a pas pu être sauvegardé (indisponibilité technique côté Aldo). L'équipe est prévenue et va corriger.",
    };
  }
  return { error: null, ok: true };
}

/* --------------------- Questionnaire « mieux te connaître » --------------------- */

export async function updateMyQuestionnaire(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const user = await requireArtist();
  const supabase = createClient();

  const answers: Record<string, string> = {};
  for (const q of ARTIST_QUESTIONS) {
    const v = str(fd, q.id);
    if (v) answers[q.id] = v;
  }

  const { error } = await supabase
    .from("artists")
    .update({ questionnaire: answers })
    .eq("id", user.artistId);
  if (error) return { error: error.message };

  try {
    await notifyArtistProfileChange(user.artistId);
  } catch {
    /* non bloquant */
  }
  revalidatePath("/portail/profil");
  return { error: null, ok: true };
}

/* --------------------- Photos d'atelier (bucket public) --------------------- */

export async function addStudioPhoto(fd: FormData): Promise<{ error?: string; url?: string }> {
  const user = await requireArtist();
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucun fichier." };
  if (file.size > 8 * 1024 * 1024) return { error: "Photo trop lourde (8 Mo max)." };

  try {
    const admin = createAdminClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `studio/${user.artistId}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(ASSETS_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (upErr) throw upErr;
    const url = admin.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;

    const supabase = createClient();
    const { data: artist } = await supabase
      .from("artists")
      .select("studio_photos")
      .eq("id", user.artistId)
      .maybeSingle();
    const current = Array.isArray(artist?.studio_photos)
      ? (artist!.studio_photos as string[])
      : [];
    const { error } = await supabase
      .from("artists")
      .update({ studio_photos: [...current, url] })
      .eq("id", user.artistId);
    if (error) throw error;

    revalidatePath("/portail/profil");
    return { url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de l'envoi de la photo." };
  }
}

export async function removeStudioPhoto(url: string): Promise<{ error?: string }> {
  const user = await requireArtist();
  const supabase = createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("studio_photos")
    .eq("id", user.artistId)
    .maybeSingle();
  const current = Array.isArray(artist?.studio_photos)
    ? (artist!.studio_photos as string[])
    : [];
  const next = current.filter((u) => u !== url);

  const { error } = await supabase
    .from("artists")
    .update({ studio_photos: next })
    .eq("id", user.artistId);
  if (error) return { error: error.message };

  // Suppression du fichier dans le Storage (non bloquant).
  try {
    const admin = createAdminClient();
    const marker = `/${ASSETS_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) await admin.storage.from(ASSETS_BUCKET).remove([url.slice(idx + marker.length)]);
  } catch {
    /* non bloquant */
  }
  revalidatePath("/portail/profil");
  return {};
}

/* --------------------- Événements (Agenda) --------------------- */

/**
 * Crée (id=null) ou met à jour un événement de l'artiste connecté.
 * L'artiste n'édite que SES événements (garanti par RLS owner + le filtre id).
 */
export async function saveEvent(
  id: string | null,
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const user = await requireArtist();
  const supabase = createClient();

  const title = str(fd, "title");
  if (!title) return { error: "Donne un titre à ton événement." };

  const row = {
    title,
    type: str(fd, "type"),
    event_date: str(fd, "event_date"),
    end_date: str(fd, "end_date"),
    location: str(fd, "location"),
    url: str(fd, "url"),
    note: str(fd, "note"),
  };

  let error;
  if (id) {
    ({ error } = await supabase
      .from("artist_events")
      .update(row)
      .eq("id", id)
      .eq("artist_id", user.artistId));
  } else {
    ({ error } = await supabase
      .from("artist_events")
      .insert({ ...row, artist_id: user.artistId }));
  }
  if (error) return { error: error.message };

  // Nouvel événement → on prévient l'équipe (non bloquant, seulement à la création).
  if (!id) {
    try {
      await notifyArtistEvent(user.artistId);
    } catch {
      /* non bloquant */
    }
  }

  revalidatePath("/portail/evenements");
  return { error: null, ok: true };
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  const user = await requireArtist();
  const supabase = createClient();
  const { error } = await supabase
    .from("artist_events")
    .delete()
    .eq("id", id)
    .eq("artist_id", user.artistId);
  if (error) return { error: error.message };
  revalidatePath("/portail/evenements");
  return {};
}
