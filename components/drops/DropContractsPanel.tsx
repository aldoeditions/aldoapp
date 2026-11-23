"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/Badge";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import { CONTRACT_DOC_STATUS } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import { generateContract } from "@/app/(app)/artistes/contract-actions";
import { markAllContractsSent, attachSignedContracts } from "@/app/(app)/drops/[id]/contract-actions";
import { matchSignedToArtist } from "@/lib/contracts/filename";
import type { DropContracts, DropContractRow } from "@/lib/data/drop-contracts";

type Candidate = { artist_id: string; full_name: string; contract_id: string; display_name: string };
type FileMatch = { file: File; contractId: string | null };

export function DropContractsPanel({ dropId, data }: { dropId: string; data: DropContracts }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  // --- Génération en lot (progression côté client) -------------------------
  const missing = data.rows.filter((r) => !r.contract);
  const [gen, setGen] = useState<{ running: boolean; done: number; total: number; errors: string[] }>({
    running: false,
    done: 0,
    total: 0,
    errors: [],
  });

  function generateMissing() {
    const targets = missing;
    if (targets.length === 0) return;
    setNotice(null);
    setGen({ running: true, done: 0, total: targets.length, errors: [] });
    start(async () => {
      const errors: string[] = [];
      let done = 0;
      for (const r of targets) {
        const res = await generateContract(r.artist_id, dropId);
        done++;
        if (res.error) errors.push(`${r.display_name} : ${res.error}`);
        setGen({ running: true, done, total: targets.length, errors });
      }
      setGen({ running: false, done, total: targets.length, errors });
      router.refresh();
    });
  }

  // --- Marquer tous comme envoyés ------------------------------------------
  const nbBrouillons = data.rows.filter((r) => r.contract?.status === "brouillon").length;
  function markAllSent() {
    if (!confirm(`Marquer ${nbBrouillons} contrat(s) brouillon comme envoyés ?`)) return;
    setNotice(null);
    start(async () => {
      const res = await markAllContractsSent(dropId);
      setNotice(
        res.errors.length
          ? `${res.count} marqué(s) envoyé(s), ${res.errors.length} en erreur.`
          : `${res.count} contrat(s) marqué(s) comme envoyés.`,
      );
      router.refresh();
    });
  }

  // --- Dépôt en lot des PDF signés -----------------------------------------
  const candidates: Candidate[] = useMemo(
    () =>
      data.rows
        .filter((r) => r.contract)
        .map((r) => ({
          artist_id: r.artist_id,
          full_name: r.full_name,
          contract_id: r.contract!.id,
          display_name: r.display_name,
        })),
    [data.rows],
  );

  const [matches, setMatches] = useState<FileMatch[]>([]);

  function onPickFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).map((file) => {
      const artistId = matchSignedToArtist(file.name, candidates, data.campaign_number);
      const contractId = artistId ? candidates.find((c) => c.artist_id === artistId)?.contract_id ?? null : null;
      return { file, contractId };
    });
    setMatches(list);
    setNotice(null);
  }

  function setMatch(idx: number, contractId: string | null) {
    setMatches((m) => m.map((x, i) => (i === idx ? { ...x, contractId } : x)));
  }

  function saveSigned() {
    const toSave = matches.filter((m) => m.contractId);
    if (toSave.length === 0) {
      setNotice("Aucun fichier rattaché à enregistrer.");
      return;
    }
    const fd = new FormData();
    for (const m of toSave) fd.append(m.contractId!, m.file, m.file.name);
    start(async () => {
      const res = await attachSignedContracts(dropId, fd);
      const ok = res.results.filter((r) => r.ok).length;
      const ko = res.results.length - ok;
      setNotice(ko ? `${ok} enregistré(s), ${ko} en erreur.` : `${ok} contrat(s) signé(s) enregistré(s).`);
      setMatches([]);
      router.refresh();
    });
  }

  const hasDrafts = data.rows.some((r) => r.contract?.status === "brouillon");

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-base text-text">Contrats</h3>
          <p className="text-2xs text-faint">
            {data.rows.length} artiste(s) · {data.rows.filter((r) => r.contract?.status === "signé").length} signé(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={generateMissing}
            disabled={pending || missing.length === 0}
            className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-accentHover disabled:opacity-50"
          >
            Générer les contrats manquants{missing.length > 0 ? ` (${missing.length})` : ""}
          </button>
          {hasDrafts && (
            <a
              href={`/drops/${dropId}/contracts/zip`}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-2xs font-semibold text-text transition-colors hover:bg-bg"
            >
              Télécharger tous les PDF (zip)
            </a>
          )}
          <button
            onClick={markAllSent}
            disabled={pending || nbBrouillons === 0}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-2xs font-semibold text-text transition-colors hover:bg-bg disabled:opacity-50"
          >
            Marquer tous comme envoyés{nbBrouillons > 0 ? ` (${nbBrouillons})` : ""}
          </button>
        </div>
      </div>

      {(gen.running || gen.errors.length > 0 || notice) && (
        <div className="space-y-1 border-b border-border bg-bg px-5 py-3">
          {gen.running && (
            <p className="text-2xs text-muted">Génération… {gen.done}/{gen.total}</p>
          )}
          {!gen.running && gen.total > 0 && gen.errors.length === 0 && gen.done > 0 && (
            <p className="text-2xs text-success">{gen.done} contrat(s) généré(s).</p>
          )}
          {gen.errors.map((e, i) => (
            <p key={i} className="text-2xs text-danger">{e}</p>
          ))}
          {notice && <p className="text-2xs text-muted">{notice}</p>}
        </div>
      )}

      {data.rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-faint">
          Aucun artiste avec une œuvre dans cette campagne.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                <th className="px-5 py-2.5 font-semibold">Artiste</th>
                <th className="px-3 py-2.5 font-semibold">Statut</th>
                <th className="px-3 py-2.5 font-semibold">Généré</th>
                <th className="px-3 py-2.5 font-semibold">Envoyé</th>
                <th className="px-3 py-2.5 font-semibold">Signé</th>
                <th className="px-5 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <ContractLine key={r.artist_id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dépôt en lot des PDF signés */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted">Déposer les PDF signés (en lot)</p>
        <p className="mt-1 text-2xs text-faint">
          Rattachement automatique par nom de fichier (C{data.campaign_number ?? "n"}_Prénom Nom). Vérifie avant d&apos;enregistrer.
        </p>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => onPickFiles(e.target.files)}
          className="mt-2 text-2xs text-muted"
        />

        {matches.length > 0 && (
          <div className="mt-3 space-y-2">
            {matches.map((m, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
              >
                <span className="min-w-0 truncate text-2xs text-text" title={m.file.name}>{m.file.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-2xs text-faint">→</span>
                  <select
                    value={m.contractId ?? ""}
                    onChange={(e) => setMatch(i, e.target.value || null)}
                    className={
                      "rounded-md border bg-white px-2 py-1 text-2xs outline-none focus:border-accent " +
                      (m.contractId ? "border-border text-text" : "border-danger text-danger")
                    }
                  >
                    <option value="">Non reconnu — choisir…</option>
                    {candidates.map((c) => (
                      <option key={c.contract_id} value={c.contract_id}>{c.display_name}</option>
                    ))}
                  </select>
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveSigned}
                disabled={pending || matches.every((m) => !m.contractId)}
                className="rounded-md bg-success px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50"
              >
                Enregistrer les rattachements ({matches.filter((m) => m.contractId).length})
              </button>
              <button onClick={() => setMatches([])} className="text-2xs font-medium text-muted hover:text-text">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractLine({ row }: { row: DropContractRow }) {
  const c = row.contract;
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-2.5">
        <span className="font-medium text-text">{row.display_name}</span>
        {!c && row.missing.length > 0 && (
          <span className="mt-0.5 block text-2xs text-danger">Identité incomplète : {row.missing.join(", ")}</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {c ? (
          <StatusBadge value={c.status} dict={CONTRACT_DOC_STATUS} />
        ) : (
          <span className="rounded-full bg-neutralBg px-2 py-0.5 text-2xs font-medium text-faint">Aucun</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-2xs text-muted">{c?.generated_at ? dateCourte(c.generated_at) : "—"}</td>
      <td className="px-3 py-2.5 text-2xs text-muted">{c?.sent_at ? dateCourte(c.sent_at) : "—"}</td>
      <td className="px-3 py-2.5 text-2xs text-muted">{c?.signed_at ? dateCourte(c.signed_at) : "—"}</td>
      <td className="px-5 py-2.5">
        <div className="flex items-center justify-end gap-3">
          {c?.pdf_path && <FileDownloadButton bucket="contracts" path={c.pdf_path} label="PDF" />}
          {c?.file_path && <FileDownloadButton bucket="contracts" path={c.file_path} label="Signé" />}
        </div>
      </td>
    </tr>
  );
}
