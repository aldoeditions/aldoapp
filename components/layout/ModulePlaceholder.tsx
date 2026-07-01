import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/** Squelette de page module — Phase 0 (contenu réel branché aux phases suivantes). */
export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  apercu,
}: {
  eyebrow: string;
  title: string;
  description: string;
  apercu: string[];
}) {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <Card>
        <CardBody className="py-10">
          <div className="mx-auto max-w-md text-center">
            <span className="eyebrow">À venir</span>
            <h3 className="mt-2 font-serif text-xl text-text">
              Module en cours de construction
            </h3>
            <p className="mt-2 text-sm text-muted">
              Les fondations sont en place. Ce module sera développé dans une
              prochaine phase.
            </p>
            <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
              {apercu.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-text"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
