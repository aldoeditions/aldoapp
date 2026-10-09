import { requireArtist } from "@/lib/auth/session";
import {
  getMyArtist,
  getMyOeuvres,
  getMyOeuvresLite,
} from "@/lib/data/portal";
import { getMyEvents } from "@/lib/data/events";
import { listArtistDocuments } from "@/lib/data/social-rates";
import { Mascotte } from "@/components/brand/Logo";
import { Card, CardBody } from "@/components/ui/Card";
import { OnboardingWizard, type WizardStep } from "@/components/portail/OnboardingWizard";
import { ProfileForm } from "@/components/portail/ProfileForm";
import { StudioPhotos } from "@/components/portail/StudioPhotos";
import { QuestionnaireForm } from "@/components/portail/QuestionnaireForm";
import { SocialStatusForm } from "@/components/portail/SocialStatusForm";
import { OeuvreCard } from "@/components/portail/OeuvreCard";
import { FileUploader } from "@/components/portail/FileUploader";
import { EventsManager } from "@/components/portail/EventsManager";
import { COMMISSION_PCT } from "@/lib/constants";

export default async function OnboardingPage() {
  const user = await requireArtist();
  const [artist, oeuvres, oeuvresLite, events, documents] = await Promise.all([
    getMyArtist(),
    getMyOeuvres(),
    getMyOeuvresLite(),
    getMyEvents(),
    listArtistDocuments(user.artistId),
  ]);
  if (!artist) return null;

  const prenom = (artist.name ?? "").split(" ")[0] || "artiste";
  const pct = (artist.commission_pct ?? COMMISSION_PCT * 100) / 100;
  const answers =
    artist.questionnaire && typeof artist.questionnaire === "object" && !Array.isArray(artist.questionnaire)
      ? (artist.questionnaire as Record<string, string>)
      : {};
  const studioPhotos = Array.isArray(artist.studio_photos) ? (artist.studio_photos as string[]) : [];
  const startStep = typeof artist.onboarding_step === "number" ? artist.onboarding_step : 0;

  const steps: WizardStep[] = [
    {
      key: "welcome",
      title: "Bienvenue",
      node: (
        <Card>
          <CardBody className="flex flex-col items-center py-8 text-center">
            <Mascotte className="mb-4 h-28 w-auto" />
            <h3 className="font-serif text-2xl text-text">Ravis de t&apos;accueillir, {prenom} 🎉</h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              On va mettre en place ton espace Aldo en quelques minutes. On avance pas à pas, et tu peux
              t&apos;arrêter puis reprendre quand tu veux.
            </p>
            <ul className="mx-auto mt-5 w-full max-w-sm space-y-2 text-left text-sm">
              {[
                "Ton profil & des photos de ton atelier",
                "10 questions pour ta page artiste",
                "Tes infos de paiement & ton statut",
                "La description de tes œuvres & tes fichiers",
                "Tes événements à venir",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-muted">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentBg text-2xs font-semibold text-accent">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ),
    },
    {
      key: "profil",
      title: "Profil & atelier",
      subtitle: "Ta photo, ta bio, tes liens, ton adresse — et quelques photos de ton atelier.",
      node: (
        <div className="space-y-6">
          <Card><CardBody><ProfileForm artist={artist} /></CardBody></Card>
          <Card>
            <div className="border-b border-border px-5 py-3.5">
              <p className="eyebrow">Mon atelier</p>
              <h4 className="font-serif text-lg text-text">Photos</h4>
            </div>
            <CardBody><StudioPhotos photos={studioPhotos} /></CardBody>
          </Card>
        </div>
      ),
    },
    {
      key: "questions",
      title: "Mieux te connaître",
      subtitle: "10 questions qui serviront ta page artiste sur le site et les réseaux.",
      node: <Card><CardBody><QuestionnaireForm answers={answers} /></CardBody></Card>,
    },
    {
      key: "statut",
      title: "Paiement & statut",
      subtitle: "Pour te verser tes droits d'auteur dans les règles.",
      node: <Card><CardBody><SocialStatusForm artist={artist} documents={documents} /></CardBody></Card>,
    },
    {
      key: "oeuvres",
      title: "Tes œuvres",
      subtitle: "Décris chaque œuvre et dépose tes fichiers d'impression HD.",
      node:
        oeuvres.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center">
              <p className="font-serif text-lg text-text">L&apos;équipe prépare tes œuvres</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Dès qu&apos;Aldo aura créé tes œuvres pour la campagne, tu pourras les décrire et déposer
                tes fichiers ici. Tu peux continuer pour l&apos;instant.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {oeuvres.map((o) => (
                <OeuvreCard key={o.id} oeuvre={o} commissionPct={pct} />
              ))}
            </div>
            <Card>
              <div className="border-b border-border px-5 py-3.5">
                <p className="eyebrow">Fichiers d&apos;impression</p>
                <h4 className="font-serif text-lg text-text">Dépose tes visuels HD</h4>
              </div>
              <CardBody><FileUploader oeuvres={oeuvresLite} /></CardBody>
            </Card>
          </div>
        ),
    },
    {
      key: "evenements",
      title: "Tes événements",
      subtitle: "Optionnel — partage tes expos, sorties ou salons pour qu'Aldo les relaie.",
      node: <EventsManager events={events} />,
    },
    {
      key: "fini",
      title: "C'est tout bon 🎉",
      node: (
        <Card>
          <CardBody className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-successBg text-success">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h3 className="font-serif text-2xl text-text">Merci {prenom} !</h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Ton espace est prêt. Tu peux revenir compléter ou modifier tes infos à tout moment depuis
              ton profil. Bienvenue chez Aldo ✨
            </p>
          </CardBody>
        </Card>
      ),
    },
  ];

  return <OnboardingWizard steps={steps} startStep={startStep} />;
}
