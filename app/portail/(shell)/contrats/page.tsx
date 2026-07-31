import { requireArtist } from "@/lib/auth/session";
import { getMyContracts } from "@/lib/data/portal";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import { PortalHeader } from "@/components/portail/PortalHeader";
import { CONTRACT_DOC_STATUS } from "@/lib/constants";
import { dateCourte } from "@/lib/format";

export default async function ContratsPage() {
  await requireArtist();
  const contracts = await getMyContracts();

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Administratif"
        title="Mes contrats"
        description="Retrouve tes contrats de campagne et leur statut. Télécharge-les à tout moment."
      />

      {contracts.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="font-serif text-lg text-text">Aucun contrat pour le moment</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Dès qu&apos;Aldo t&apos;enverra un contrat de campagne, il apparaîtra ici, prêt à consulter et signer.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul>
              {contracts.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-0"
                >
                  <div>
                    <p className="font-medium text-text">{c.drop_name ?? "Campagne"}</p>
                    <p className="text-2xs text-faint">
                      Émis le {dateCourte(c.generated_at ?? c.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge value={c.status} dict={CONTRACT_DOC_STATUS} />
                    {c.file_path ? (
                      <FileDownloadButton bucket="contracts" path={c.file_path} label="PDF signé" />
                    ) : c.pdf_path ? (
                      <FileDownloadButton bucket="contracts" path={c.pdf_path} label="Télécharger" />
                    ) : null}
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
