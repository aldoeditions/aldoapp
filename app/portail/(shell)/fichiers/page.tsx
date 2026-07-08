import { requireArtist } from "@/lib/auth/session";
import { getMyFiles, getMyOeuvresLite } from "@/lib/data/portal";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ARTIST_FILE_STATUS } from "@/lib/constants";
import { taille, dateCourte } from "@/lib/format";
import { FileUploader } from "@/components/portail/FileUploader";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import { PortalHeader } from "@/components/portail/PortalHeader";

export default async function FichiersPage() {
  await requireArtist();
  const [files, oeuvres] = await Promise.all([getMyFiles(), getMyOeuvresLite()]);

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Impression"
        title="Mes fichiers"
        description="Dépose tes fichiers d'impression HD. L'équipe Aldo les valide avant impression."
      />

      <Card>
        <CardHeader title="Déposer un fichier" />
        <CardBody>
          <FileUploader oeuvres={oeuvres} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mes dépôts" subtitle={`${files.length} fichier(s)`} />
        <CardBody className="p-0">
          {files.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-faint">Aucun fichier déposé pour l&apos;instant.</p>
          ) : (
            <ul>
              {files.map((f) => (
                <li key={f.id} className="border-b border-border px-5 py-3.5 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">{f.filename}</p>
                      <p className="text-2xs text-faint">
                        {taille(f.file_size)} · {dateCourte(f.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <FileDownloadButton bucket="artist-files" path={f.file_path} />
                      <StatusBadge value={f.status} dict={ARTIST_FILE_STATUS} />
                    </div>
                  </div>
                  {f.status === "refusé" && f.review_note && (
                    <div className="mt-2 rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">
                      <span className="font-semibold">Refusé :</span> {f.review_note}
                      <span className="text-danger/80"> — dépose une nouvelle version ci-dessus.</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
