import Link from "next/link";
import { requireArtist } from "@/lib/auth/session";
import { getMyArtist, getMyStats } from "@/lib/data/portal";
import { StatCard } from "@/components/ui/StatCard";
import { euros0, nombre } from "@/lib/format";

const SECTIONS = [
  { href: "/portail/profil", title: "Mon profil", desc: "Bio, photo, liens, coordonnées bancaires" },
  { href: "/portail/fichiers", title: "Mes fichiers", desc: "Dépose tes visuels HD pour impression" },
  { href: "/portail/ventes", title: "Mes ventes", desc: "Suivi par campagne et par format" },
  { href: "/portail/contrats", title: "Mes contrats", desc: "Statut et documents" },
  { href: "/portail/calendrier", title: "Calendrier", desc: "Dates de tes campagnes" },
];

export default async function PortalHome() {
  await requireArtist();
  const artist = await getMyArtist();
  const stats = await getMyStats(artist?.commission_pct ?? null);
  const prenom = (artist?.name ?? "").split(" ")[0] || "artiste";

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-1.5">Ton espace</p>
        <h1 className="font-serif text-3xl tracking-tight text-text">
          Bonjour {prenom} 👋
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Bienvenue dans ton espace Aldo. Tu peux y suivre tes ventes, déposer
          tes fichiers, consulter tes contrats et tes commissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="CA généré" value={euros0(stats.ca_brut)} accent hint={`${nombre(stats.nb_ventes)} ventes`} />
        <StatCard label="Commission estimée" value={euros0(stats.commission_estimee)} />
        <StatCard label="Reste à percevoir" value={euros0(stats.commission_due)} hint={`${euros0(stats.commission_payee)} déjà versés`} />
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg text-text">Accès rapide</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-center justify-between rounded-xl border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-float"
            >
              <div>
                <p className="font-medium text-text group-hover:text-accent">{s.title}</p>
                <p className="mt-0.5 text-2xs text-muted">{s.desc}</p>
              </div>
              <svg className="text-faint group-hover:text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
