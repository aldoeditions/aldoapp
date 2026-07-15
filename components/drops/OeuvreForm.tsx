"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { saveOeuvre, type FormState } from "@/app/(app)/drops/actions";
import { Select, SubmitButton, FormError, inputCls, labelCls } from "@/components/ui/form";
import { Avatar } from "@/components/ui/Avatar";
import {
  OEUVRE_STATUSES,
  FORMATS,
  COMMISSION_PCT,
  type FormatKey,
} from "@/lib/constants";
import { euros } from "@/lib/format";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import type { Oeuvre } from "@/types/database";
import type { CostByFormat } from "@/lib/data/drops";

const initial: FormState = { error: null };

export function OeuvreForm({
  dropId,
  artists,
  costs,
  oeuvre,
  hdFile = null,
  onSuccess,
}: {
  dropId: string;
  artists: { id: string; name: string }[];
  costs: CostByFormat;
  oeuvre?: Oeuvre | null;
  hdFile?: { path: string; filename: string | null } | null;
  onSuccess: () => void;
}) {
  const editing = Boolean(oeuvre);
  const [state, formAction] = useFormState(
    saveOeuvre.bind(null, oeuvre?.id ?? null, dropId),
    initial,
  );

  const initialFormat = (oeuvre?.format as FormatKey) ?? "A3";
  const [format, setFormat] = useState<FormatKey>(initialFormat);
  const [price, setPrice] = useState<string>(
    String(oeuvre?.price ?? costs[initialFormat].prix),
  );
  const [impression, setImpression] = useState<string>(
    String(oeuvre?.cout_impression ?? costs[initialFormat].impression),
  );
  const [packaging, setPackaging] = useState<string>(
    String(oeuvre?.cout_packaging ?? costs[initialFormat].packaging),
  );

  // Changement de format → réinitialise prix + coûts depuis params.
  function onFormatChange(f: FormatKey) {
    setFormat(f);
    setPrice(String(costs[f].prix));
    setImpression(String(costs[f].impression));
    setPackaging(String(costs[f].packaging));
  }

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state, onSuccess]);

  const p = Number(price.replace(",", ".")) || 0;
  const ci = Number(impression.replace(",", ".")) || 0;
  const cp = Number(packaging.replace(",", ".")) || 0;
  const commission = p * COMMISSION_PCT;
  const marge = p - ci - cp - commission;

  return (
    <form action={formAction} className="space-y-4 px-5 py-5">
      {/* Visuel — rempli automatiquement à la validation du fichier de l'artiste */}
      <div className="flex items-center gap-4">
        <Avatar name={oeuvre?.name} src={oeuvre?.file_url ?? null} size="lg" className="rounded-md" />
        <div className="min-w-0">
          <p className={labelCls}>Visuel</p>
          {hdFile ? (
            <>
              <FileDownloadButton
                bucket="artist-files"
                path={hdFile.path}
                label="Télécharger le fichier HD"
              />
              <p className="mt-0.5 text-2xs text-faint">
                Master d&apos;impression déposé par l&apos;artiste.
              </p>
            </>
          ) : (
            <p className="text-2xs text-faint">
              L&apos;aperçu se remplit automatiquement quand le fichier déposé par
              l&apos;artiste est validé.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="name">
          Nom de l&apos;œuvre *
        </label>
        <input id="name" name="name" defaultValue={oeuvre?.name ?? ""} className={inputCls} placeholder="Titre de l'affiche" />
      </div>

      <Select
        label="Artiste *"
        name="artist_id"
        defaultValue={oeuvre?.artist_id}
        placeholder="Sélectionner…"
        options={artists.map((a) => ({ value: a.id, label: a.name }))}
      />

      {/* Format (auto-coûts) */}
      <div>
        <label className={labelCls}>Format</label>
        <div className="flex gap-2">
          {(Object.keys(FORMATS) as FormatKey[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFormatChange(f)}
              className={
                "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                (format === f
                  ? "border-accent bg-accentBg text-accent"
                  : "border-border bg-white text-muted hover:text-text")
              }
            >
              {f} · {euros(FORMATS[f].prix)}
            </button>
          ))}
        </div>
        <input type="hidden" name="format" value={format} />
      </div>

      {/* Prix & coûts (préremplis, éditables) */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="price">Prix €</label>
          <input id="price" name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="cout_impression">Impr. €</label>
          <input id="cout_impression" name="cout_impression" type="number" step="0.01" value={impression} onChange={(e) => setImpression(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="cout_packaging">Pack. €</label>
          <input id="cout_packaging" name="cout_packaging" type="number" step="0.01" value={packaging} onChange={(e) => setPackaging(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Marge estimée */}
      <div className="flex items-center justify-between rounded-md bg-bg px-3 py-2 text-sm">
        <span className="text-muted">
          Marge nette <span className="text-faint">(après commission {Math.round(COMMISSION_PCT * 100)}%)</span>
        </span>
        <span className={"font-semibold " + (marge >= 0 ? "text-success" : "text-danger")}>
          {euros(marge)}
        </span>
      </div>

      <Select label="Statut" name="status" defaultValue={oeuvre?.status ?? "brouillon"} options={OEUVRE_STATUSES} />

      <FormError error={state.error} />
      <SubmitButton label={editing ? "Enregistrer" : "Ajouter l'œuvre"} />
    </form>
  );
}
