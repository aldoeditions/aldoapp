import { COMMISSION_PCT, TVA_PCT } from "@/lib/constants";

const QA: { q: string; a: string }[] = [
  {
    q: "Comment est calculée ma commission ?",
    a: `Tu touches ${Math.round(COMMISSION_PCT * 100)} % du prix de vente HORS TAXES de chaque affiche vendue (le prix affiché est TTC, TVA ${Math.round(
      TVA_PCT * 100,
    )} % incluse). Exemple : une affiche à 25 € TTC = 20,83 € HT → ta commission est de 6,25 €.`,
  },
  {
    q: "Quand suis-je payé ?",
    a: "Après la fin de chaque campagne, Aldo établit le relevé de tes ventes puis te verse ta commission. Le versement intervient généralement dans les ~40 jours suivant la fin de la campagne, sous réserve du relevé. Tu suis « ce qu'il te reste à recevoir » directement sur ton espace.",
  },
  {
    q: "C'est quoi le « précompte » sur mes versements ?",
    a: "Si tu es artiste-auteur, Aldo agit comme « diffuseur » : elle retient sur ta rémunération tes cotisations sociales (retraite, CSG/CRDS, formation — environ 16 %) et les reverse pour ton compte à l'Urssaf. Ce n'est pas une charge Aldo : c'est ta protection sociale. Le « net versé » est ce que tu reçois réellement, et tu peux télécharger ton relevé annuel depuis « Mes ventes ». Si tu es dispensé de précompte (attestation Urssaf) ou si tu factures avec un SIRET, rien n'est retenu.",
  },
  {
    q: "Que dois-je fournir, et quand ?",
    a: "Tes fichiers d'impression HD (haute résolution) avant la date limite indiquée dans ton Calendrier — ils passent en validation par l'équipe. On peut aussi te demander une bio, une photo, et une description pour chacune de tes œuvres.",
  },
  {
    q: "À quoi sert la description de mes œuvres ?",
    a: "Le texte que tu rédiges sur chaque œuvre (depuis « Mes œuvres ») raconte la pièce à tes acheteurs. Aldo le relit avant de le publier sur la boutique. Tu peux le modifier à tout moment.",
  },
  {
    q: "Où voir mes ventes ?",
    a: "Dans « Ventes » : chaque affiche vendue apparaît en temps réel, avec ta commission. Le détail par campagne est aussi sur ton accueil.",
  },
];

export function HowItWorks() {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-3.5">
        <p className="eyebrow">Bon à savoir</p>
        <h3 className="font-serif text-lg text-text">Comment ça marche ?</h3>
      </div>
      <div className="divide-y divide-border">
        {QA.map((item) => (
          <details key={item.q} className="group px-5 py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text">
              {item.q}
              <svg
                className="shrink-0 text-faint transition-transform group-open:rotate-90"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
