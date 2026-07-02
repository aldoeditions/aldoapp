import { requireArtist } from "@/lib/auth/session";
import { getMyArtist, getMyContract } from "@/lib/data/portal";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { CONTRACT_STATUS } from "@/lib/constants";
import { dateCourte, pourcent } from "@/lib/format";
import { ProfileForm } from "@/components/portail/ProfileForm";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";

export default async function ProfilPage() {
  await requireArtist();
  const [artist, contract] = await Promise.all([getMyArtist(), getMyContract()]);

  if (!artist) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1.5">Ton compte</p>
        <h1 className="font-serif text-2xl tracking-tight text-text sm:text-3xl">
          Mon profil
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Tiens tes informations à jour pour Aldo et pour tes futurs acheteurs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <ProfileForm artist={artist} />
            </CardBody>
          </Card>
        </div>

        {/* Mon contrat */}
        <div>
          <Card>
            <CardHeader title="Mon contrat" />
            <CardBody>
              {contract ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Statut</span>
                    <StatusBadge value={contract.status} dict={CONTRACT_STATUS} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Commission</span>
                    <span className="text-sm font-medium text-text">
                      {pourcent((contract.commission_pct ?? artist.commission_pct ?? 30) / 100)}
                    </span>
                  </div>
                  {contract.signed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Signé le</span>
                      <span className="text-sm text-text">{dateCourte(contract.signed_at)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    {contract.file_path ? (
                      <FileDownloadButton bucket="contracts" path={contract.file_path} label="Télécharger le PDF" />
                    ) : (
                      <p className="text-2xs text-faint">Le PDF sera disponible ici une fois déposé par l&apos;équipe.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-faint">Aucun contrat pour l&apos;instant.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
