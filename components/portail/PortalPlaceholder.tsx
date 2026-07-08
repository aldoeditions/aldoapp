export function PortalPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <h1 className="font-serif text-2xl leading-tight text-text sm:text-[1.9rem]">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
        <p className="eyebrow">Bientôt disponible</p>
        <p className="mt-2 text-sm text-muted">
          Cette section arrive très prochainement dans ton espace.
        </p>
      </div>
    </div>
  );
}
