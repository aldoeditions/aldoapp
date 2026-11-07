import { requireArtist } from "@/lib/auth/session";
import { getMyStatements } from "@/lib/data/portal";
import { Card, CardBody } from "@/components/ui/Card";
import { PortalHeader } from "@/components/portail/PortalHeader";
import { eurosCents, dateCourte } from "@/lib/format";

export default async function RelevesPage() {
  await requireArtist();
  const statements = await getMyStatements();

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Administratif"
        title="Mes relevés de droits d'auteur"
        description="Un relevé par campagne : tes ventes, le précompte éventuel et le net versé. Ils tiennent lieu de justificatif — tu n'as pas de facture à émettre."
      />

      {statements.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="font-serif text-lg text-text">Aucun relevé pour le moment</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Après chaque campagne, Aldo établit ton relevé de droits d&apos;auteur. Il apparaîtra ici,
              téléchargeable en PDF.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul>
              {statements.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text">
                      {s.drop_name ?? "Campagne"}
                      {s.number && <span className="ml-2 font-mono text-2xs text-faint">{s.number}</span>}
                    </p>
                    <p className="text-2xs text-faint">
                      Émis le {dateCourte(s.issued_at)}
                      {s.paid_at ? ` · versé le ${dateCourte(s.paid_at)}` : ""}
                      {" · net "}
                      <span className="font-medium text-text">{eurosCents(s.net_cents ?? 0)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-2xs font-semibold " +
                        (s.status === "payé" ? "bg-successBg text-success" : "bg-accentBg text-accent")
                      }
                    >
                      {s.status === "payé" ? "Versé" : "Émis"}
                    </span>
                    <a
                      href={`/portail/releves/${s.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-bg"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
                      PDF
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
