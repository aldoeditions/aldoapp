"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { updateMyProfile, type ProfileState } from "@/app/portail/(shell)/actions";
import { Field, Select, SubmitButton, FormError, inputCls, labelCls } from "@/components/ui/form";
import { Avatar } from "@/components/ui/Avatar";
import { CIVILITIES } from "@/lib/constants";
import type { Artist } from "@/types/database";

const initial: ProfileState = { error: null };

export function ProfileForm({ artist }: { artist: Artist }) {
  const [state, formAction] = useFormState(updateMyProfile, initial);
  const [preview, setPreview] = useState<string | null>(artist.avatar_url ?? null);

  return (
    <form action={formAction} className="space-y-6">
      {state.ok && (
        <p className="rounded-lg bg-successBg px-4 py-3 text-sm font-medium text-success">
          ✓ Profil enregistré.
        </p>
      )}

      {/* Photo + identité */}
      <div className="flex items-center gap-4">
        <Avatar name={artist.name} src={preview} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{artist.name}</p>
          <label className={labelCls + " mt-1"} htmlFor="avatar">Changer la photo</label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : artist.avatar_url ?? null); }}
            className="w-full max-w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accentBg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={4} defaultValue={artist.bio ?? ""} className={inputCls} placeholder="Présente ton univers en quelques lignes…" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" defaultValue={artist.email} />
        <Field label="Téléphone" name="phone" defaultValue={artist.phone} />
        <Field label="Instagram" name="instagram" defaultValue={artist.instagram} placeholder="@handle" />
        <Field label="Portfolio" name="portfolio_url" defaultValue={artist.portfolio_url} placeholder="https://" />
      </div>

      {/* Identité (pour ton contrat) */}
      <div className="rounded-xl border border-border bg-bg/60 p-4">
        <p className="eyebrow mb-1">Mon identité</p>
        <p className="mb-3 text-2xs text-faint">
          Ton nom, prénom et ta naissance servent à établir ton contrat (jamais ton pseudo).
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Civilité" name="civility" defaultValue={artist.civility} options={CIVILITIES} placeholder="—" />
            <Field label="Prénom" name="first_name" defaultValue={artist.first_name} />
            <Field label="Nom" name="last_name" defaultValue={artist.last_name} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date de naissance" name="birth_date" type="date" defaultValue={artist.birth_date} />
            <Field label="Lieu de naissance" name="birth_place" defaultValue={artist.birth_place} placeholder="Ville" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="eyebrow">Mon adresse</p>
        <Field label="N° et rue" name="address" defaultValue={artist.address} placeholder="12 rue des Arts" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Code postal" name="postal_code" defaultValue={artist.postal_code} placeholder="33000" />
          <Field label="Ville" name="city" defaultValue={artist.city} />
          <Field label="Pays" name="country" defaultValue={artist.country} />
        </div>
      </div>

      {/* RIB */}
      <div className="rounded-xl border border-border bg-bg/60 p-4">
        <p className="eyebrow mb-1">Mes informations bancaires</p>
        <p className="mb-3 text-2xs text-faint">
          Nécessaires pour te verser tes commissions. Visibles uniquement par toi et l&apos;équipe Aldo.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="IBAN" name="iban" defaultValue={artist.iban} placeholder="FR76 …" />
          </div>
          <Field label="BIC" name="bic" defaultValue={artist.bic} />
        </div>
      </div>

      <FormError error={state.error} />
      <SubmitButton label="Enregistrer mon profil" />
    </form>
  );
}
