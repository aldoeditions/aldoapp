import Link from "next/link";
import { requireArtist } from "@/lib/auth/session";
import {
  getMyArtist,
  getMyStats,
  getMyCampaigns,
  getMyActions,
} from "@/lib/data/portal";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { euros0, euros, nombre, dateCourte } from "@/lib/format";

function joursRestants(end: string | null): number | null {
  if (!end) return null;
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
}

export default async function PortalHome() {
  await requireArtist();
  const artist = await getMyArtist();
  const [stats, campaigns, actions] = await Promise.all([
    getMyStats(artist?.commission_pct ?? null),
    getMyCampaigns(),
    getMyActions(artist?.iban ?? null),
  ]);
  const prenom = (artist?.name ?? "").split(" ")[0] || "artiste";
  const restants = joursRestants(campaigns.current?.drop.end_date ?? null);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <p className="eyebrow mb-1.5">Ton espace</p>
        <h1 className="font-serif text-3xl tracking-tight text-text">
          Bonjour {prenom} 👋
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Retrouve ici tes ventes, tes fichiers, tes contrats et tes commissions,
          en temps réel.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ventes totales" value={nombre(stats.nb_ventes)} hint="affiches vendues" />
        <StatCard label="CA généré" value={euros0(stats.ca_brut)} accent />
        <StatCard label="Commission à recevoir" value={euros0(stats.commission_due)} hint={`${euros0(stats.commission_payee)} déjà versés`} />
      </div>

      {/* Actions à faire */}
      {actions.length > 0 && (
        <Card>
          <CardHeader title="À faire" subtitle="Quelques actions pour être à jour." />
          <CardBody className="p-0">
            <ul>
              {actions.map((a) => (
                <li key={a.href + a.label}>
                  <Link
                    href={a.href}
                    className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 text-sm transition-colors last:border-0 hover:bg-bg"
                  >
                    <span className="flex items-center gap-2.5 text-text">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      {a.label}
                    </span>
                    <svg className="text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Campagne en cours */}
      {campaigns.current && (
        <Card>
          <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Campagne en cours</p>
              <h3 className="font-serif text-xl text-text">{campaigns.current.drop.name}</h3>
              <p className="mt-0.5 text-2xs text-faint">
                {dateCourte(campaigns.current.drop.start_date)} → {dateCourte(campaigns.current.drop.end_date)}
              </p>
            </div>
            {restants !== null && restants >= 0 && (
              <div className="text-center">
                <p className="font-serif text-3xl leading-none text-accent">{restants}</p>
                <p className="text-2xs text-faint">jour{restants > 1 ? "s" : ""} restant{restants > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
          <CardBody className="p-0">
            {campaigns.current.oeuvres.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-faint">Aucune de tes œuvres dans cette campagne.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-2.5 font-semibold">Ton œuvre</th>
                    <th className="px-3 py-2.5 font-semibold">Format</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Ventes</th>
                    <th className="px-5 py-2.5 text-right font-semibold">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.current.oeuvres.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 font-medium text-text">{o.name}</td>
                      <td className="px-3 py-2.5 text-muted">{o.format}</td>
                      <td className="px-3 py-2.5 text-right text-text">{nombre(o.nb_ventes)}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-text">{euros(o.ca_brut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      )}

      {/* Prochaine campagne */}
      {campaigns.next && (
        <Card>
          <CardBody className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Prochaine campagne</p>
              <p className="mt-1 font-serif text-lg text-text">{campaigns.next.name}</p>
              <p className="text-2xs text-faint">
                À partir du {dateCourte(campaigns.next.start_date)}
              </p>
            </div>
            <span className="rounded-full bg-accentBg px-3 py-1 text-2xs font-semibold text-accent">
              À venir
            </span>
          </CardBody>
        </Card>
      )}

      {/* Aucune campagne */}
      {!campaigns.current && !campaigns.next && (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="font-serif text-lg text-text">Aucune campagne pour le moment</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Tes œuvres n&apos;apparaissent pas encore dans une campagne. L&apos;équipe
              Aldo revient vers toi très vite — en attendant, tu peux compléter ton
              profil et déposer tes fichiers.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/portail/profil" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-bg">
                Mon profil
              </Link>
              <Link href="/portail/fichiers" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover">
                Déposer mes fichiers
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
