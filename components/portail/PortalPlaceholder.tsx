export function PortalPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-text sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{description}</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-10 text-center shadow-card">
        <p className="eyebrow">Bientôt disponible</p>
        <p className="mt-2 text-sm text-muted">
          Cette section arrive très prochainement dans ton espace.
        </p>
      </div>
    </div>
  );
}
