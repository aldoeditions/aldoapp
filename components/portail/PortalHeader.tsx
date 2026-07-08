/** En-tête de page du portail — rythme vertical aéré. */
export function PortalHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <header className="space-y-3.5">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-serif text-2xl leading-tight text-text sm:text-[1.9rem]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      )}
    </header>
  );
}
