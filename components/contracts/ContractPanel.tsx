"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/Badge";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import { CONTRACT_DOC_STATUS } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import {
  generateContract,
  markContractSent,
  markContractSigned,
  deleteContract,
} from "@/app/(app)/artistes/contract-actions";
import type { ContractContext } from "@/lib/data/contracts";

export function ContractPanel({
  artistId,
  ctx,
}: {
  artistId: string;
  ctx: ContractContext;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="font-serif text-base text-text">Contrat</h3>
          <p className="text-2xs text-faint">{ctx.contracts.length} document(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-accentHover"
        >
          Générer le contrat
        </button>
      </div>

      {ctx.contracts.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-faint">Aucun contrat généré.</p>
      ) : (
        <ul>
          {ctx.contracts.map((c) => (
            <ContractRow key={c.id} artistId={artistId} contract={c} />
          ))}
        </ul>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Générer le contrat">
        {open && (
          <GenerateForm
            artistId={artistId}
            ctx={ctx}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        )}
      </Drawer>
    </>
  );
}

/* ------------------------- Ligne contrat + actions ------------------------- */

function ContractRow({
  artistId,
  contract,
}: {
  artistId: string;
  contract: ContractContext["contracts"][number];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError(null);
      await fn();
      router.refresh();
    });

  return (
    <li className="border-b border-border px-5 py-3 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">
            {contract.drop_name ?? "Campagne —"}
          </p>
          <p className="text-2xs text-faint">
            Généré le {dateCourte(contract.generated_at ?? contract.created_at)} · commission {contract.commission_pct ?? 30} %
          </p>
        </div>
        <StatusBadge value={contract.status} dict={CONTRACT_DOC_STATUS} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {contract.pdf_path && (
          <FileDownloadButton bucket="contracts" path={contract.pdf_path} label="Télécharger" />
        )}
        {contract.file_path && (
          <FileDownloadButton bucket="contracts" path={contract.file_path} label="PDF signé" />
        )}
        {contract.status === "brouillon" && (
          <button
            disabled={pending}
            onClick={() => run(() => markContractSent(artistId, contract.id))}
            className="text-2xs font-medium text-accent hover:underline disabled:opacity-60"
          >
            Marquer comme envoyé
          </button>
        )}
        {contract.status !== "signé" && (
          <button
            disabled={pending}
            onClick={() => setSigning((s) => !s)}
            className="text-2xs font-medium text-success hover:underline disabled:opacity-60"
          >
            Marquer comme signé
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Supprimer ce contrat ?")) run(() => deleteContract(artistId, contract.id));
          }}
          className="text-2xs font-medium text-danger hover:underline disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>

      {signing && (
        <form
          className="mt-2 flex flex-col gap-2 rounded-md bg-bg p-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              setError(null);
              const res = await markContractSigned(artistId, contract.id, fd);
              if (res.error) setError(res.error);
              else {
                setSigning(false);
                router.refresh();
              }
            });
          }}
        >
          <input type="file" name="signed" accept="application/pdf" className="flex-1 text-2xs text-muted" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-success px-3 py-1.5 text-2xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "…" : "Confirmer signé"}
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-2xs text-danger">{error}</p>}
    </li>
  );
}

/* --------------------------- Modal de génération --------------------------- */

function GenerateForm({
  artistId,
  ctx,
  onDone,
}: {
  artistId: string;
  ctx: ContractContext;
  onDone: () => void;
}) {
  const [dropId, setDropId] = useState(ctx.drops[0]?.id ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const a = ctx.artist;
  const blocked = ctx.missing.length > 0;

  const Line = ({ k, v, warn }: { k: string; v: string; warn?: boolean }) => (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-2xs font-semibold uppercase tracking-wide text-faint">{k}</span>
      <span className={"truncate " + (warn ? "text-danger" : "text-text")}>{v}</span>
    </div>
  );

  return (
    <div className="space-y-4 px-5 py-5">
      {ctx.drops.length === 0 ? (
        <p className="rounded-md bg-warningBg px-3 py-2 text-sm text-warning">
          Aucune campagne « à venir » ou « en cours ». Crée un drop d&apos;abord.
        </p>
      ) : (
        <div>
          <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-muted">
            Campagne liée
          </label>
          <select
            value={dropId}
            onChange={(e) => setDropId(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            {ctx.drops.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.status})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-muted">
          Données injectées
        </div>
        <div className="px-4 py-2">
          <Line k="Nom" v={a?.name ?? "—"} />
          <Line k="Naissance" v={a?.birth_date ? `${a.birth_date}${a.birth_place ? " · " + a.birth_place : ""}` : "manquante"} warn={!a?.birth_date} />
          <Line k="MDA" v={a?.mda_number || "en cours d'inscription"} />
          <Line k="Adresse" v={(a?.address ?? "").trim() || "manquante"} warn={!(a?.address ?? "").trim()} />
          <Line k="Email" v={(a?.email ?? "").trim() || "manquant"} warn={!(a?.email ?? "").trim()} />
          <Line k="IBAN" v={ctx.ibanMasked} warn={!ctx.iban} />
          <Line k="Taux" v={`${ctx.commissionPct} %`} />
        </div>
      </div>

      {blocked && (
        <div className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">
          Données obligatoires manquantes : {ctx.missing.join(", ")}.
          <br />
          Complète la fiche artiste (bouton « Modifier » en haut) avant de générer.
        </div>
      )}
      {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">{error}</p>}

      <button
        disabled={pending || blocked || !dropId}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await generateContract(artistId, dropId);
            if (res.error) setError(res.error);
            else onDone();
          })
        }
        className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
      >
        {pending ? "Génération…" : "Générer le PDF"}
      </button>
    </div>
  );
}
