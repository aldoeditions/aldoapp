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
import { SuiviEditor } from "@/components/artists/SuiviEditor";
import {
  ARTIST_PHASE,
  OEUVRE_STATUS,
  FILE_STATUS,
  CONTRACT_STATUS,
  PAYMENT_STATUS,
} from "@/lib/constants";
import { euros, euros0, nombre, dateCourte, pourcent } from "@/lib/format";

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

  const [detail, row] = await Promise.all([
    getArtistDetail(params.id),
    getArtistRow(params.id),
  ]);
  if (!detail || !row) notFound();

  const { artist, oeuvres, contracts, payments, files } = detail;

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
            <div className="flex items-center gap-2">
              <ArtistFormButton artist={row} variant="secondary" label="Modifier" />
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
                <table className="w-full text-sm">
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
                        <td className="px-5 py-2.5 font-medium text-text">{o.name}</td>
                        <td className="px-5 py-2.5 text-muted">{o.drop_name ?? "—"}</td>
                        <td className="px-5 py-2.5 text-muted">{o.format}</td>
                        <td className="px-5 py-2.5 text-right text-text">{euros(o.price)}</td>
                        <td className="px-5 py-2.5">
                          <StatusBadge value={o.status} dict={OEUVRE_STATUS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          {/* Paiements */}
          <Card>
            <CardHeader title="Paiements" subtitle={`${payments.length} paiement(s)`} />
            <CardBody className="p-0">
              {payments.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-faint">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                      <th className="px-5 py-2.5 font-semibold">Drop</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Montant</th>
                      <th className="px-5 py-2.5 font-semibold">Payé le</th>
                      <th className="px-5 py-2.5 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 text-muted">{p.drop_name ?? "—"}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-text">{euros(p.amount)}</td>
                        <td className="px-5 py-2.5 text-muted">{dateCourte(p.paid_at)}</td>
                        <td className="px-5 py-2.5">
                          <StatusBadge value={p.status} dict={PAYMENT_STATUS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          {/* Contrats */}
          <Card>
            <CardHeader title="Contrats" subtitle={`${contracts.length}`} />
            <CardBody className="p-0">
              {contracts.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-faint">
                  Aucun contrat.
                </p>
              ) : (
                <ul>
                  {contracts.map((c) => (
                    <li key={c.id} className="flex items-center justify-between border-b border-border px-5 py-3 text-sm last:border-0">
                      <span className="text-muted">
                        {c.commission_pct != null ? `Commission ${c.commission_pct}%` : "Contrat"}
                      </span>
                      <StatusBadge value={c.status} dict={CONTRACT_STATUS} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Fichiers */}
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
