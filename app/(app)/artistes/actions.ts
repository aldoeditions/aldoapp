"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { syncOeuvreVisuel } from "@/lib/files/visuel";
import { encryptSensitive, last4 } from "@/lib/crypto";
import { computeVersement } from "@/lib/fiscal";
import { PRECOMPTE_REGIMES } from "@/lib/constants";
import {
  getRateForDate,
  getPriorYearGrossCents,
  hasActiveExemption,
} from "@/lib/data/social-rates";
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
    postal_code: str(fd, "postal_code"),
    country: str(fd, "country"),
    bio: str(fd, "bio"),
    type: str(fd, "type"),
    style: str(fd, "style"),
    renommee: str(fd, "renommee"),
    civility: str(fd, "civility"),
    first_name: str(fd, "first_name"),
    last_name: str(fd, "last_name"),
    birth_date: str(fd, "birth_date"),
    birth_place: str(fd, "birth_place"),
    sku_code: str(fd, "sku_code")?.toUpperCase() ?? null,
    siret: str(fd, "siret"),
    social_regime: str(fd, "social_regime") ?? "artiste_auteur_precompte",
    // Cohérence contrat : is_artiste_auteur dérivé du régime (les deux régimes AA).
    is_artiste_auteur: (str(fd, "social_regime") ?? "artiste_auteur_precompte").startsWith("artiste_auteur"),
    bic: str(fd, "bic"),
    phase: (str(fd, "phase") ?? "prospect") as ArtistPhase,
    pipe_status: str(fd, "pipe_status"),
    contrat_status: str(fd, "contrat_status"),
    commission_pct: num(fd, "commission_pct"),
    drive_link: str(fd, "drive_link"),
    dans_le_pipe: fd.get("dans_le_pipe") === "on", // « pour les prochains drop »
    first_contact_date: str(fd, "first_contact_date"),
    kit_impression: str(fd, "kit_impression"),
    visuels: str(fd, "visuels"),
    demande_infos: str(fd, "demande_infos"),
  };
}

/** Upsert de l'IBAN dans artist_banking (table séparée, donnée sensible). */
async function saveBanking(
  supabase: ReturnType<typeof createClient>,
  artistId: string,
  fd: FormData,
) {
  const iban = str(fd, "iban");
  if (!iban) return; // pas d'IBAN saisi → on ne touche pas
  const bic = str(fd, "bic");
  await supabase
    .from("artist_banking")
    .upsert({ artist_id: artistId, iban, bic, updated_at: new Date().toISOString() }, { onConflict: "artist_id" });
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

    // N° de sécurité sociale : chiffré au repos. Vide = on ne change rien.
    const ssnRaw = str(fd, "social_security_number");
    const ssnFields: Pick<TablesUpdate<"artists">, "social_security_number_enc" | "social_security_last4"> =
      ssnRaw
        ? { social_security_number_enc: encryptSensitive(ssnRaw), social_security_last4: last4(ssnRaw) }
        : {};

    if (targetId) {
      const update: TablesUpdate<"artists"> = { ...fields, ...ssnFields };
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
        .insert({ ...fields, ...ssnFields } as TablesInsert<"artists">)
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

    await saveBanking(supabase, targetId, fd);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "23505") return { error: "Ce code SKU est déjà attribué à un autre artiste." };
    if (code === "23514") return { error: "Code SKU invalide : 2 à 4 lettres majuscules ou chiffres." };
    const msg = e instanceof Error ? e.message : "Erreur inattendue.";
    return { error: msg };
  }

  // Redirection : /prospection à la création d'un prospect, sinon fiche artiste.
  const rawRedirect = str(fd, "redirect_to");
  const redirectTo = rawRedirect?.startsWith("/") ? rawRedirect : `/artistes/${targetId}`;
  revalidatePath("/artistes");
  revalidatePath(`/artistes/${targetId}`);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function deleteArtist(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("artists").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/artistes");
  redirect("/artistes");
}

/* ------------------------------------------------------------------ */
/* Versements artiste (précompte / net / contribution diffuseur)       */
/* ------------------------------------------------------------------ */

export type PaymentFormState = { error: string | null; ok?: boolean };

/**
 * Enregistre un versement à un artiste. On saisit la RÉMUNÉRATION BRUTE (30 %
 * du HT, en euros) ; le précompte, le net et la contribution diffuseur sont
 * calculés au barème en vigueur à la date du versement. Tous les montants sont
 * stockés en centimes ; `amount` (euros) est conservé pour compatibilité.
 */
export async function recordPayment(
  artistId: string,
  _prev: PaymentFormState,
  fd: FormData,
): Promise<PaymentFormState> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const grossEuros = num(fd, "gross");
    if (grossEuros === null || grossEuros <= 0) {
      return { error: "Saisis une rémunération brute valide." };
    }
    const grossCents = Math.round(grossEuros * 100);
    const dropId = str(fd, "drop_id");
    const status = str(fd, "status") ?? "a_payer";
    const paidAtInput = str(fd, "paid_at");
    const dateRef = paidAtInput ?? new Date().toISOString().slice(0, 10);

    const rate = await getRateForDate(dateRef);
    if (!rate) return { error: "Aucun barème social n'est défini pour cette date." };

    const { data: artist } = await supabase
      .from("artists")
      .select("social_regime")
      .eq("id", artistId)
      .single();
    const regime = artist?.social_regime ?? "artiste_auteur_precompte";
    const year = new Date(dateRef).getFullYear();
    const exempt =
      !PRECOMPTE_REGIMES.has(regime) || (await hasActiveExemption(artistId, dateRef));
    const prior = await getPriorYearGrossCents(artistId, year);

    const v = computeVersement(grossCents, rate, { exempt, priorYearGrossCents: prior });

    const { error } = await supabase.from("payments").insert({
      artist_id: artistId,
      drop_id: dropId,
      status,
      paid_at: status === "paye" ? paidAtInput ?? new Date().toISOString() : paidAtInput,
      amount: v.gross_cents / 100,
      gross_cents: v.gross_cents,
      precompte_cents: v.precompte_cents,
      contribution_diffuseur_cents: v.contribution_diffuseur_cents,
      net_cents: v.net_cents,
      social_rate_id: rate.id,
      period_year: year,
      notes: str(fd, "notes"),
    });
    if (error) throw error;

    revalidatePath(`/artistes/${artistId}`);
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/* ------------------------------------------------------------------ */
/* Dispenses de précompte (bucket privé artist-documents)              */
/* ------------------------------------------------------------------ */

const DOCS_BUCKET = "artist-documents";

export async function createExemption(
  artistId: string,
  _prev: PaymentFormState,
  fd: FormData,
): Promise<PaymentFormState> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const motif = str(fd, "motif");
    const valid_from = str(fd, "valid_from");
    if (!motif || !valid_from) return { error: "Motif et date de début obligatoires." };
    const valid_to = str(fd, "valid_to");

    let document_path: string | null = null;
    const file = fd.get("document");
    if (file instanceof File && file.size > 0) {
      const admin = createAdminClient();
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const path = `${artistId}/exemption-${Date.now()}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const up = await admin.storage
        .from(DOCS_BUCKET)
        .upload(path, bytes, { contentType: file.type, upsert: true });
      if (up.error) return { error: up.error.message };
      document_path = path;
    }

    const { error } = await supabase.from("artist_precompte_exemptions").insert({
      artist_id: artistId,
      motif,
      valid_from,
      valid_to,
      document_path,
    });
    if (error) throw error;

    revalidatePath(`/artistes/${artistId}`);
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function deleteExemption(id: string, artistId: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("artist_precompte_exemptions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/artistes/${artistId}`);
}

export async function deletePayment(paymentId: string, artistId: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) throw error;
  revalidatePath(`/artistes/${artistId}`);
}

/** Marque un versement comme payé (statut + date). */
export async function markPaymentPaid(paymentId: string, artistId: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "paye", paid_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) throw error;
  revalidatePath(`/artistes/${artistId}`);
}

/**
 * Valide un fichier déposé (équipe). Le statut « Fichier » d'une œuvre est
 * DÉRIVÉ de ses fichiers déposés (cf. getDropDetail).
 *
 * Bonus : si le dépôt est une image, on la recopie dans le bucket public et on
 * l'utilise comme VISUEL d'aperçu de l'œuvre (le master HD, lui, reste privé).
 */
export async function validateFile(id: string) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { data: file, error } = await supabase
    .from("artist_files")
    .update({
      status: "validé",
      review_note: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.profile?.name ?? user.email,
    })
    .eq("id", id)
    .select("oeuvre_id, file_path, filename, mime_type")
    .single();
  if (error) throw error;

  if (file?.oeuvre_id) {
    await syncOeuvreVisuel(file.oeuvre_id, file.file_path, file.filename, file.mime_type);
  }

  revalidatePath("/");
  revalidatePath("/artistes");
  revalidatePath("/drops");
}

/** Refuse un fichier déposé avec une note (équipe). */
export async function rejectFile(id: string, note: string) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("artist_files")
    .update({
      status: "refusé",
      review_note: note || "Fichier à redéposer.",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.profile?.name ?? user.email,
    })
    .eq("id", id);
  if (error) throw error;

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
