"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { saveArtist, type ArtistFormState } from "@/app/(app)/artistes/actions";
import { Avatar } from "@/components/ui/Avatar";
import {
  ARTIST_PHASES,
  PIPE_STATUSES,
  CONTRACT_STATUSES,
  ARTIST_TYPES,
  KIT_STATUSES,
  VISUELS_STATUSES,
  DEMANDE_STATUSES,
  TEAM,
} from "@/lib/constants";
import type { Artist } from "@/types/database";

const initial: ArtistFormState = { error: null };

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";
const labelCls = "mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
    >
      {pending
        ? "Enregistrement…"
        : editing
          ? "Enregistrer les modifications"
          : "Créer l'artiste"}
    </button>
  );
}

export function ArtistForm({ artist }: { artist?: Artist | null }) {
  const editing = Boolean(artist);
  const [state, formAction] = useFormState(
    saveArtist.bind(null, artist?.id ?? null),
    initial,
  );
  const [preview, setPreview] = useState<string | null>(artist?.avatar_url ?? null);

  return (
    <form action={formAction} className="space-y-5 px-5 py-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar name={artist?.name} src={preview} size="lg" />
        <div>
          <label className={labelCls} htmlFor="avatar">
            Photo / logo
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : (artist?.avatar_url ?? null));
            }}
            className="text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accentBg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
          />
        </div>
      </div>

      <Field label="Nom *" name="name" defaultValue={artist?.name} placeholder="Nom de l'artiste" />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Phase" name="phase" defaultValue={artist?.phase ?? "prospect"} options={ARTIST_PHASES} />
        <Select label="Statut pipeline" name="pipe_status" defaultValue={artist?.pipe_status} options={PIPE_STATUSES} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          name="type"
          defaultValue={artist?.type ?? "Artiste"}
          options={ARTIST_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <Field label="Style" name="style" defaultValue={artist?.style} placeholder="Abstrait, Line art…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Renommée" name="renommee" defaultValue={artist?.renommee} placeholder="Émergent, Confirmé…" />
        <Field label="Commission %" name="commission_pct" type="number" defaultValue={artist?.commission_pct ?? 30} />
      </div>

      <div className="border-t border-border pt-4">
        <p className="eyebrow mb-3">Contact</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" name="email" type="email" defaultValue={artist?.email} />
            <Field label="Téléphone" name="phone" defaultValue={artist?.phone} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instagram" name="instagram" defaultValue={artist?.instagram} placeholder="@handle" />
            <Field label="Portfolio" name="portfolio_url" defaultValue={artist?.portfolio_url} placeholder="https://" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="eyebrow mb-3">Localisation & liens</p>
        <div className="space-y-3">
          <Field label="Adresse" name="address" defaultValue={artist?.address} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville" name="city" defaultValue={artist?.city} />
            <Field label="Pays" name="country" defaultValue={artist?.country ?? "France"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Contrat" name="contrat_status" defaultValue={artist?.contrat_status} options={CONTRACT_STATUSES} />
            <Field label="Lien Drive" name="drive_link" defaultValue={artist?.drive_link} placeholder="https://" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="eyebrow mb-3">Prospection & suivi</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Contacté par"
              name="contacted_by"
              defaultValue={artist?.contacted_by}
              options={TEAM.map((t) => ({ value: t, label: t }))}
            />
            <Field
              label="1er contact"
              name="first_contact_date"
              type="date"
              defaultValue={artist?.first_contact_date}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Kit impr." name="kit_impression" defaultValue={artist?.kit_impression} options={KIT_STATUSES} />
            <Select label="Visuels" name="visuels" defaultValue={artist?.visuels} options={VISUELS_STATUSES} />
            <Select label="Infos" name="demande_infos" defaultValue={artist?.demande_infos} options={DEMANDE_STATUSES} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="bio">
          Bio / notes
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={artist?.bio ?? ""}
          className={inputCls}
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-dangerBg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton editing={editing} />
    </form>
  );
}
