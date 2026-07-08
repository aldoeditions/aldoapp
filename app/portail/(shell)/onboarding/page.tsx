import Link from "next/link";
import { requireArtist } from "@/lib/auth/session";
import { getMyArtist } from "@/lib/data/portal";
import { Mascotte } from "@/components/brand/Logo";

export default async function OnboardingPage() {
  await requireArtist();
  const artist = await getMyArtist();
  const prenom = (artist?.name ?? "").split(" ")[0] || "artiste";

  const steps = [
    { title: "Complète ton profil", desc: "Ajoute ta bio, ta photo, tes liens et ton RIB.", href: "/portail/profil" },
    { title: "Dépose tes visuels HD", desc: "Envoie tes fichiers d'impression pour validation.", href: "/portail/fichiers" },
    { title: "Suis tes ventes", desc: "Découvre tes ventes et commissions en temps réel.", href: "/portail/ventes" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <div className="flex flex-col items-center text-center">
        <Mascotte className="mb-3 h-28 w-auto" />
        <p className="eyebrow mb-2">Bienvenue</p>
        <h1 className="font-serif text-3xl tracking-tight text-text">
          Ravis de t&apos;accueillir, {prenom} 🎉
        </h1>
        <p className="mt-3 text-sm text-muted">
          Ton espace Aldo est prêt. Voici quelques étapes pour bien démarrer.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-float"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accentBg font-semibold text-accent">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-text">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted">{s.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div className="text-center">
        <Link
          href="/portail"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover"
        >
          Accéder à mon espace
        </Link>
      </div>
    </div>
  );
}
