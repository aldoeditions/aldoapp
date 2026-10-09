import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getArtistDetail, getArtistRow } from "@/lib/data/artists";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { ArtistFormButton } from "@/components/artists/ArtistFormButton";
import { DeleteArtistButton } from "@/components/artists/DeleteArtistButton";
import { InviteButton } from "@/components/artists/InviteButton";
import { SuiviEditor } from "@/components/artists/SuiviEditor";
import { FilesReview } from "@/components/artists/FilesReview";
import { PaymentFormButton } from "@/components/artists/PaymentFormButton";
import { ExemptionsManager } from "@/components/artists/ExemptionsManager";
import { ContractPanel } from "@/components/contracts/ContractPanel";
import { OeuvrePreview } from "@/components/oeuvres/OeuvrePreview";
import { PhotoDownloadButton } from "@/components/artists/PhotoDownloadButton";
import { OnboardingButton } from "@/components/tasks/OnboardingButton";
import { getTasks } from "@/lib/data/tasks";
import { getContractContext } from "@/lib/data/contracts";
import { getDropsForSelect } from "@/lib/data/drops";
import {
  getCurrentRate,
  getPriorYearGrossCents,
  hasActiveExemption,
  getArtistExemptions,
  listArtistDocuments,
} from "@/lib/data/social-rates";
import type { PendingFile } from "@/lib/data/artists";
import {
  ARTIST_PHASE,
  OEUVRE_STATUS,
  FILE_STATUS,
  PAYMENT_STATUS,
  TASK_STATUS,
  SOCIAL_REGIME,
  PRECOMPTE_REGIMES,
  ARTIST_QUESTIONS,
} from "@/lib/constants";
import { euros, euros0, eurosCents, nombre, dateCourte, pourcent } from "@/lib/format";

function igUrl(handle: string): string {
  const h = handle.replace(/^@/, "");
  return `https://instagram.com/${h}`;
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-2xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="truncate text-accent hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="truncate text-text">{value}</span>
      )}
    </div>
  );
}

export default async function ArtistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireModule("artistes");
  const editable = canEdit(user.role, "artistes");

  const [detail, row, contractCtx, artistTasks] = await Promise.all([
    getArtistDetail(params.id),
    getArtistRow(params.id),
    getContractContext(params.id),
    getTasks({ artist: params.id }),
  ]);
  if (!detail || !row) notFound();

  const { artist, oeuvres, payments, files } = detail;

  // Contexte social (barème, dispense, cumul annuel) pour le versement.
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const regime = row.social_regime ?? "artiste_auteur_precompte";
  const [rate, exemptByRow, priorYearGrossCents, drops, exemptions, statusDocs] = await Promise.all([
    getCurrentRate(),
    hasActiveExemption(row.id, today),
    getPriorYearGrossCents(row.id, year),
    getDropsForSelect(),
    getArtistExemptions(row.id),
    listArtistDocuments(row.id),
  ]);
  const exempt = !PRECOMPTE_REGIMES.has(regime) || exemptByRow;

  // Totaux versements (en centimes) + suggestion de rému restant à verser.
  const paidGrossCents = payments.reduce((s, p) => s + (p.gross_cents ?? 0), 0);
  const totalNetCents = payments.reduce((s, p) => s + (p.net_cents ?? 0), 0);
  const totalPrecompteCents = payments.reduce((s, p) => s + (p.precompte_cents ?? 0), 0);
  const remEarnedCents = Math.round((artist.total_remuneration ?? 0) * 100);
  const suggestedGross = Math.max(0, remEarnedCents - paidGrossCents) / 100;

  // Fichiers déposés en attente → mêmes actions Valider/Refuser que le Dashboard.
  const pendingFiles: PendingFile[] = editable
    ? files
        .filter((f) => f.status === "en attente")
        .map((f) => ({
          ...f,
          artist_name: artist.name,
          oeuvre_name: oeuvres.find((o) => o.id === f.oeuvre_id)?.name ?? null,
        }))
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/artistes"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Tous les artistes
      </Link>

      {/* En-tête */}
      <div className="card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={artist.name} src={artist.avatar_url} size="lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl tracking-tight text-text">
                  {artist.name}
                </h1>
                <StatusBadge value={artist.phase} dict={ARTIST_PHASE} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {[artist.type, artist.style, artist.renommee]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              <p className="mt-1 text-2xs text-faint">
                Commission {pourcent((artist.commission_pct ?? 30) / 100)}
                {artist.city ? ` · ${artist.city}` : ""}
                {artist.country ? `, ${artist.country}` : ""}
              </p>
            </div>
          </div>

          {editable && (
            <div className="flex flex-wrap items-center gap-2">
              <InviteButton
                artistId={row.id}
                hasEmail={Boolean(row.email)}
                alreadyLinked={Boolean(row.user_id)}
              />
              <ArtistFormButton artist={row} iban={contractCtx.iban} variant="secondary" label="Modifier" />
              <DeleteArtistButton id={artist.id ?? ""} name={artist.name ?? ""} />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Œuvres" value={nombre(artist.nb_oeuvres)} />
        <StatCard label="Ventes" value={nombre(artist.total_ventes)} />
        <StatCard label="CA généré" value={euros0(artist.total_ca)} accent />
        <StatCard label="Rémunération" value={euros0(artist.total_remuneration)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tâches (checklist d'accueil & suivi) */}
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="font-serif text-base text-text">Tâches</h3>
                <p className="text-2xs text-faint">{artistTasks.length} tâche(s)</p>
              </div>
              {editable && <OnboardingButton artistId={artist.id ?? ""} />}
            </div>
            {artistTasks.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-faint">
                Aucune tâche. Utilise « Checklist d&apos;accueil » pour générer le suivi
                (contrat, bio/photo, visuels, signature…).
              </p>
            ) : (
              <ul>
                {artistTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 border-b border-border px-5 py-2.5 last:border-0"
                  >
                    <span className="min-w-0">
                      <span
                        className={
                          "block truncate text-sm " +
                          (t.status === "terminé" ? "text-faint line-through" : "text-text")
                        }
                      >
                        {t.title.endsWith(` — ${artist.name}`)
                          ? t.title.slice(0, -(` — ${artist.name}`).length)
                          : t.title}
                      </span>
                      {t.assignee?.display_name && (
                        <span className="text-2xs text-faint">{t.assignee.display_name}</span>
                      )}
                    </span>
                    <StatusBadge value={t.status} dict={TASK_STATUS} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Œuvres */}
          <Card>
            <CardHeader title="Œuvres" subtitle={`${oeuvres.length} œuvre(s)`} />
            <CardBody className="p-0">
              {oeuvres.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-faint">
                  Aucune œuvre. Elles apparaîtront ici une fois le module Drops
                  &amp; Œuvres en place.
                </p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                      <th className="px-5 py-2.5 font-semibold">Œuvre</th>
                      <th className="px-5 py-2.5 font-semibold">Drop</th>
                      <th className="px-5 py-2.5 font-semibold">Format</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Prix</th>
                      <th className="px-5 py-2.5 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oeuvres.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <OeuvrePreview name={o.name} src={o.file_url} />
                            <span className="font-medium text-text">{o.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-muted">{o.drop_name ?? "—"}</td>
                        <td className="px-5 py-2.5 text-muted">{o.format}</td>
                        <td className="px-5 py-2.5 text-right text-text">{euros(o.price)}</td>
                        <td className="px-5 py-2.5">
                          <StatusBadge value={o.status} dict={OEUVRE_STATUS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
            </CardBody>
          </Card>

          {/* Portrait de l'artiste (questionnaire + atelier) */}
          {(() => {
            const answers =
              row.questionnaire && typeof row.questionnaire === "object" && !Array.isArray(row.questionnaire)
                ? (row.questionnaire as Record<string, string>)
                : {};
            const photos = Array.isArray(row.studio_photos) ? (row.studio_photos as string[]) : [];
            const answered = ARTIST_QUESTIONS.filter((q) => answers[q.id]?.trim());
            if (answered.length === 0 && photos.length === 0) return null;
            return (
              <Card>
                <CardHeader
                  title="Portrait de l'artiste"
                  subtitle={`Questionnaire ${answered.length}/${ARTIST_QUESTIONS.length} · ${photos.length} photo(s) d'atelier`}
                />
                <CardBody className="space-y-4">
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {photos.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg border border-border bg-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Atelier" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {answered.map((q) => (
                    <div key={q.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                      <p className="text-2xs font-medium text-faint">{q.label}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-text">{answers[q.id]}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            );
          })()}

          {/* Paiements */}
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="font-serif text-base text-text">Versements</h3>
                <p className="text-2xs text-faint">
                  {payments.length} versement(s)
                  {totalPrecompteCents > 0 && ` · ${eurosCents(totalPrecompteCents)} précomptés`}
                </p>
              </div>
              {editable && (
                <div className="flex items-center gap-2">
                  {payments.length > 0 && (
                    <a
                      href={`/artistes/${artist.id}/releve?year=${year}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-bg"
                    >
                      Relevé {year}
                    </a>
                  )}
                  <PaymentFormButton
                    artistId={artist.id ?? ""}
                    rate={rate}
                    exempt={exempt}
                    priorYearGrossCents={priorYearGrossCents}
                    drops={drops}
                    suggestedGross={suggestedGross}
                  />
                </div>
              )}
            </div>
            <CardBody className="p-0">
              {payments.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-faint">
                  Aucun versement enregistré.
                </p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                      <th className="px-5 py-2.5 font-semibold">Drop</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Brut</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Précompte</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Net</th>
                      <th className="px-5 py-2.5 font-semibold">Payé le</th>
                      <th className="px-5 py-2.5 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 text-muted">{p.drop_name ?? "—"}</td>
                        <td className="px-5 py-2.5 text-right text-text">
                          {eurosCents(p.gross_cents ?? Math.round((p.amount ?? 0) * 100))}
                        </td>
                        <td className="px-5 py-2.5 text-right text-muted">
                          {p.precompte_cents ? `− ${eurosCents(p.precompte_cents)}` : "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-text">
                          {eurosCents(p.net_cents ?? Math.round((p.amount ?? 0) * 100))}
                        </td>
                        <td className="px-5 py-2.5 text-muted">{dateCourte(p.paid_at)}</td>
                        <td className="px-5 py-2.5">
                          <StatusBadge value={p.status} dict={PAYMENT_STATUS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border text-2xs">
                      <td colSpan={3} className="px-5 py-2.5 font-semibold uppercase tracking-wide text-faint">Total net versé</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-text">{eurosCents(totalNetCents)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table></div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Contact */}
          <Card>
            <CardHeader title="Contact" />
            <CardBody className="py-2">
              <div className="divide-y divide-border">
                <ContactRow label="Email" value={artist.email} href={artist.email ? `mailto:${artist.email}` : undefined} />
                <ContactRow label="Téléphone" value={artist.phone} href={artist.phone ? `tel:${artist.phone}` : undefined} />
                <ContactRow label="Instagram" value={artist.instagram} href={artist.instagram ? igUrl(artist.instagram) : undefined} />
                <ContactRow label="Portfolio" value={artist.portfolio_url} href={artist.portfolio_url ?? undefined} />
                <ContactRow label="Drive" value={artist.drive_link} href={artist.drive_link ?? undefined} />
                <ContactRow label="Adresse" value={artist.address} />
              </div>
              {!artist.email &&
                !artist.phone &&
                !artist.instagram &&
                !artist.portfolio_url &&
                !artist.drive_link &&
                !artist.address && (
                  <p className="py-6 text-center text-sm text-faint">
                    Aucune coordonnée renseignée.
                  </p>
                )}
            </CardBody>
          </Card>

          {/* Statut social (précompte) */}
          <Card>
            <CardHeader title="Statut social" subtitle="Pilote le précompte" />
            <CardBody className="py-2">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-2xs font-semibold uppercase tracking-wide text-faint">Régime</span>
                  <StatusBadge value={regime} dict={SOCIAL_REGIME} />
                </div>
                <ContactRow label="SIRET" value={row.siret} />
                <div className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-2xs font-semibold uppercase tracking-wide text-faint">N° sécu</span>
                  <span className="truncate text-text">
                    {row.social_security_last4 ? `•••• •••• ••• ${row.social_security_last4}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-2xs font-semibold uppercase tracking-wide text-faint">Précompte</span>
                  <span className={exempt ? "text-muted" : "font-medium text-text"}>
                    {exempt ? "Non (dispense / SIRET)" : "Oui, retenu par Aldo"}
                  </span>
                </div>
                {statusDocs.length > 0 && (
                  <div className="py-2">
                    <span className="text-2xs font-semibold uppercase tracking-wide text-faint">Justificatifs de l&apos;artiste</span>
                    <ul className="mt-1.5 space-y-1">
                      {statusDocs.map((d) => (
                        <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-text">{d.name}</span>
                          <a href={d.url} target="_blank" rel="noreferrer" className="shrink-0 text-2xs text-accent hover:underline">
                            Voir
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Dispenses de précompte */}
          {editable && (
            <Card>
              <ExemptionsManager artistId={artist.id ?? ""} exemptions={exemptions} />
            </Card>
          )}

          {/* Photo & bio */}
          <Card>
            <CardHeader title="Photo & bio" subtitle="Fournies par l'artiste" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <OeuvrePreview name={artist.name} src={artist.avatar_url} size="lg" />
                <div className="min-w-0">
                  {artist.avatar_url ? (
                    <PhotoDownloadButton
                      url={artist.avatar_url}
                      filename={`photo-${(artist.name ?? "artiste").replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`}
                    />
                  ) : (
                    <p className="text-2xs text-faint">
                      Aucune photo — ajoute-la via « Modifier ».
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="eyebrow mb-1.5">Biographie</p>
                {artist.bio ? (
                  <p className="whitespace-pre-wrap text-sm text-muted">{artist.bio}</p>
                ) : (
                  <p className="text-2xs text-faint">Aucune biographie renseignée.</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Suivi de lancement */}
          <Card>
            <CardHeader title="Suivi de lancement" />
            <CardBody className="py-2">
              <SuiviEditor
                id={artist.id ?? ""}
                editable={editable}
                values={{
                  kit_impression: artist.kit_impression,
                  visuels: artist.visuels,
                  demande_infos: artist.demande_infos,
                  contrat_status: artist.contrat_status,
                }}
              />
            </CardBody>
          </Card>

          {/* Contrat (génération PDF + statuts) */}
          {editable && (
            <Card>
              <ContractPanel artistId={artist.id ?? ""} ctx={contractCtx} />
            </Card>
          )}

          {/* Fichiers en attente de validation (actionnable) */}
          {pendingFiles.length > 0 && (
            <Card>
              <CardHeader
                title="Fichiers en attente"
                subtitle="Fichiers déposés par l'artiste, à valider avant impression."
                action={
                  <span className="rounded-full bg-warningBg px-2.5 py-0.5 text-2xs font-semibold text-warning">
                    {nombre(pendingFiles.length)} à traiter
                  </span>
                }
              />
              <CardBody className="p-0">
                <FilesReview files={pendingFiles} />
              </CardBody>
            </Card>
          )}

          {/* Fichiers (historique complet) */}
          <Card>
            <CardHeader title="Fichiers" subtitle={`${files.length}`} />
            <CardBody className="p-0">
              {files.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-faint">
                  Aucun fichier déposé.
                </p>
              ) : (
                <ul>
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm last:border-0">
                      <span className="truncate text-text">{f.filename}</span>
                      <StatusBadge value={f.status} dict={FILE_STATUS} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
