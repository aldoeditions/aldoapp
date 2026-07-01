"use server";

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
