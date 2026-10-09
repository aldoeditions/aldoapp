import { requireArtist } from "@/lib/auth/session";
import { getMyArtist, getMyContract } from "@/lib/data/portal";
import { listArtistDocuments } from "@/lib/data/social-rates";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { CONTRACT_STATUS } from "@/lib/constants";
import { dateCourte, pourcent } from "@/lib/format";
import { ProfileForm } from "@/components/portail/ProfileForm";
import { SocialStatusForm } from "@/components/portail/SocialStatusForm";
import { QuestionnaireForm } from "@/components/portail/QuestionnaireForm";
import { StudioPhotos } from "@/components/portail/StudioPhotos";
import { FileDownloadButton } from "@/components/portail/FileDownloadButton";
import { PortalHeader } from "@/components/portail/PortalHeader";

export default async function ProfilPage() {
  const user = await requireArtist();
  const [artist, contract, documents] = await Promise.all([
    getMyArtist(),
    getMyContract(),
    listArtistDocuments(user.artistId),
  ]);

  if (!artist) return null;

  const answers =
    artist.questionnaire && typeof artist.questionnaire === "object" && !Array.isArray(artist.questionnaire)
      ? (artist.questionnaire as Record<string, string>)
      : {};
  const studioPhotos = Array.isArray(artist.studio_photos) ? (artist.studio_photos as string[]) : [];

  return (
    <div className="space-y-7">
      <PortalHeader
        eyebrow="Ton compte"
        title="Mon profil"
        description="Tiens tes informations à jour pour Aldo et pour tes futurs acheteurs."
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardBody>
              <ProfileForm artist={artist} />
            </CardBody>
          </Card>
        </div>

        {/* Statut social & Urssaf */}
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader title="Statut social & Urssaf" subtitle="Ton régime d'artiste-auteur et tes justificatifs." />
            <CardBody>
              <SocialStatusForm artist={artist} documents={documents} />
            </CardBody>
          </Card>
        </div>

        {/* Mon atelier (photos) */}
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader title="Mon atelier" subtitle="Des photos pour illustrer ta page artiste." />
            <CardBody>
              <StudioPhotos photos={studioPhotos} />
            </CardBody>
          </Card>
        </div>

        {/* Mieux te connaître (10 questions) */}
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader title="Mieux te connaître" subtitle="10 questions pour ta page artiste (site + réseaux)." />
            <CardBody>
              <QuestionnaireForm answers={answers} />
            </CardBody>
          </Card>
        </div>

        {/* Mon contrat */}
        <div className="min-w-0">
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
