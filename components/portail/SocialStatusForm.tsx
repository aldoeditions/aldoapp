"use client";

import { useFormState } from "react-dom";
import { updateMySocialStatus, type ProfileState } from "@/app/portail/(shell)/actions";
import { Field, SubmitButton, FormError, inputCls, labelCls } from "@/components/ui/form";
import { SOCIAL_REGIMES } from "@/lib/constants";
import type { Artist } from "@/types/database";

const initial: ProfileState = { error: null };

type ArtistDoc = { name: string; url: string };

export function SocialStatusForm({
  artist,
  documents,
}: {
  artist: Artist;
  documents: ArtistDoc[];
}) {
  const [state, formAction] = useFormState(updateMySocialStatus, initial);

  return (
    <form action={formAction} className="space-y-5">
      {state.ok && (
        <p className="rounded-lg bg-successBg px-4 py-3 text-sm font-medium text-success">
          ✓ Statut social enregistré.
        </p>
      )}

      <p className="text-sm text-muted">
        Ces informations servent à te verser tes droits d&apos;auteur dans les règles (précompte
        Urssaf). Elles sont confidentielles : visibles uniquement par toi et l&apos;équipe Aldo.
      </p>

      <div>
        <label className={labelCls} htmlFor="social_regime">Mon statut</label>
        <select
          id="social_regime"
          name="social_regime"
          defaultValue={artist.social_regime ?? "artiste_auteur_precompte"}
          className={inputCls}
        >
          {SOCIAL_REGIMES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="mt-1 text-2xs text-faint">
          Artiste-auteur (précompté) : Aldo retient et reverse tes cotisations. Dispense / SIRET :
          tu déclares toi-même, aucune retenue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="social_security_number">N° sécurité sociale</label>
          <input
            id="social_security_number"
            name="social_security_number"
            className={inputCls}
            placeholder={
              artist.social_security_last4
                ? `•••• •••• ••• ${artist.social_security_last4} — laisser vide pour conserver`
                : "1 85 12 33 123 456 78"
            }
          />
          <p className="mt-1 text-2xs text-faint">Chiffré au repos. Laisse vide pour ne pas modifier.</p>
        </div>
        <Field label="N° SIRET (si tu factures)" name="siret" defaultValue={artist.siret} placeholder="optionnel" />
      </div>

      <div className="rounded-xl border border-border bg-bg/60 p-4">
        <p className="eyebrow mb-1">Mes justificatifs</p>
        <p className="mb-3 text-2xs text-faint">
          Ajoute ton attestation Urssaf, ta dispense de précompte ou tout justificatif de statut (PDF ou image).
        </p>
        {documents.length > 0 && (
          <ul className="mb-3 space-y-1">
            {documents.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-text">{d.name}</span>
                <a href={d.url} target="_blank" rel="noreferrer" className="shrink-0 text-2xs text-accent hover:underline">
                  Voir
                </a>
              </li>
            ))}
          </ul>
        )}
        <input
          id="document"
          name="document"
          type="file"
          accept="application/pdf,image/*"
          className="text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accentBg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
        />
      </div>

      <FormError error={state.error} />
      <SubmitButton label="Enregistrer mon statut" />
    </form>
  );
}
