"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArtist } from "@/lib/auth/session";
import type { TablesInsert, TablesUpdate } from "@/types/database";

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

  revalidatePath("/portail/fichiers");
  return {};
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
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

  revalidatePath("/portail/profil");
  revalidatePath("/portail");
  return { error: null, ok: true };
}
