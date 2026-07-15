"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import type { TablesInsert, TablesUpdate, ArtistPhase } from "@/types/database";

const BUCKET = "artist-assets";

export type ArtistFormState = { error: string | null };

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "artistes")) {
    throw new Error("Accès refusé : droits insuffisants.");
  }
  return user;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function artistFieldsFrom(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    instagram: str(fd, "instagram"),
    portfolio_url: str(fd, "portfolio_url"),
    address: str(fd, "address"),
    city: str(fd, "city"),
    country: str(fd, "country"),
    bio: str(fd, "bio"),
    type: str(fd, "type"),
    style: str(fd, "style"),
    renommee: str(fd, "renommee"),
    phase: (str(fd, "phase") ?? "prospect") as ArtistPhase,
    pipe_status: str(fd, "pipe_status"),
    contrat_status: str(fd, "contrat_status"),
    commission_pct: num(fd, "commission_pct"),
    drive_link: str(fd, "drive_link"),
    contacted_by: str(fd, "contacted_by"),
    first_contact_date: str(fd, "first_contact_date"),
    kit_impression: str(fd, "kit_impression"),
    visuels: str(fd, "visuels"),
    demande_infos: str(fd, "demande_infos"),
  };
}

async function uploadAvatar(artistId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${artistId}/avatar-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) throw error;

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Crée (id=null) ou met à jour un artiste. Signature compatible useFormState :
 * lier `id` avec `.bind(null, id)`.
 */
export async function saveArtist(
  id: string | null,
  _prev: ArtistFormState,
  fd: FormData,
): Promise<ArtistFormState> {
  let targetId = id;
  try {
    await assertCanEdit();
    const supabase = createClient();

    const fields = artistFieldsFrom(fd);
    if (!fields.name) return { error: "Le nom est obligatoire." };

    if (targetId) {
      const update: TablesUpdate<"artists"> = { ...fields };
      const avatar = fd.get("avatar");
      if (avatar instanceof File && avatar.size > 0) {
        const url = await uploadAvatar(targetId, avatar);
        if (url) update.avatar_url = url;
      }
      const { error } = await supabase
        .from("artists")
        .update(update)
        .eq("id", targetId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("artists")
        .insert(fields as TablesInsert<"artists">)
        .select("id")
        .single();
      if (error) throw error;
      targetId = data.id;

      const avatar = fd.get("avatar");
      if (avatar instanceof File && avatar.size > 0) {
        const url = await uploadAvatar(targetId, avatar);
        if (url) {
          await supabase
            .from("artists")
            .update({ avatar_url: url })
            .eq("id", targetId);
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inattendue.";
    return { error: msg };
  }

  revalidatePath("/artistes");
  revalidatePath(`/artistes/${targetId}`);
  redirect(`/artistes/${targetId}`);
}

export async function deleteArtist(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("artists").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/artistes");
  redirect("/artistes");
}

/** Valide un fichier déposé (équipe) + répercute sur l'œuvre liée. */
export async function validateFile(id: string) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("artist_files")
    .update({
      status: "validé",
      review_note: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.profile?.name ?? user.email,
    })
    .eq("id", id)
    .select("oeuvre_id")
    .single();
  if (error) throw error;

  // Le fichier validé fait passer le statut « Fichier » de l'œuvre liée à « validé ».
  if (data?.oeuvre_id) {
    await supabase
      .from("oeuvres")
      .update({ file_status: "validé" })
      .eq("id", data.oeuvre_id);
  }

  revalidatePath("/");
  revalidatePath("/artistes");
}

/** Refuse un fichier déposé avec une note (équipe) + remet l'œuvre « en attente ». */
export async function rejectFile(id: string, note: string) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("artist_files")
    .update({
      status: "refusé",
      review_note: note || "Fichier à redéposer.",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.profile?.name ?? user.email,
    })
    .eq("id", id)
    .select("oeuvre_id")
    .single();
  if (error) throw error;

  if (data?.oeuvre_id) {
    await supabase
      .from("oeuvres")
      .update({ file_status: "en attente" })
      .eq("id", data.oeuvre_id);
  }

  revalidatePath("/");
  revalidatePath("/artistes");
}

export type InviteResult = {
  error?: string;
  password?: string;
  email?: string;
  info?: string;
};

/**
 * Invite un artiste au portail : crée son compte Auth (rôle artist) avec un
 * mot de passe temporaire, et le lie à sa fiche (`artists.user_id`).
 * Renvoie le mot de passe temporaire à communiquer à l'artiste.
 */
export async function inviteArtist(artistId: string): Promise<InviteResult> {
  await assertCanEdit();
  const supabase = createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, email, user_id")
    .eq("id", artistId)
    .maybeSingle();

  if (!artist) return { error: "Artiste introuvable." };
  if (!artist.email)
    return { error: "Ajoute d'abord un email sur la fiche de l'artiste." };
  if (artist.user_id)
    return { error: "Cet artiste a déjà un compte relié au portail." };

  const admin = createAdminClient();
  const password = "Aldo-" + randomUUID().replace(/-/g, "").slice(0, 10);

  const { data: created, error } = await admin.auth.admin.createUser({
    email: artist.email,
    password,
    email_confirm: true,
    user_metadata: { name: artist.name, role: "artist" },
  });

  let userId = created?.user?.id;
  let tempPassword: string | undefined = password;

  if (error) {
    // Email déjà utilisé → on relie le compte existant.
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === artist.email!.toLowerCase(),
    );
    if (!existing) return { error: error.message };
    userId = existing.id;
    tempPassword = undefined;
    await admin.from("profiles").update({ role: "artist" }).eq("id", userId);
  }

  if (!userId) return { error: "Création du compte impossible." };

  // Liaison (session équipe → passe le trigger de protection des colonnes).
  const { error: linkErr } = await supabase
    .from("artists")
    .update({ user_id: userId })
    .eq("id", artistId);
  if (linkErr) return { error: linkErr.message };

  revalidatePath(`/artistes/${artistId}`);
  return {
    email: artist.email,
    password: tempPassword,
    info: tempPassword ? undefined : "Compte existant relié au portail.",
  };
}
