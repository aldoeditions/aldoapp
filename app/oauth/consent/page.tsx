import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ConsentButtons } from "./ConsentButtons";

export const metadata: Metadata = {
  title: "Autoriser un connecteur — Aldo Éditions",
};

export const dynamic = "force-dynamic";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: { authorization_id?: string };
}) {
  const authorizationId = searchParams.authorization_id;

  // Pas de session → login, en conservant l'authorization_id au retour.
  const user = await getSessionUser();
  if (!user) {
    const back = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId ?? "")}`;
    redirect(`/login?redirect=${encodeURIComponent(back)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-9 text-accent" />
          <p className="eyebrow mt-4">Connecteur</p>
        </div>

        <div className="card p-6">
          <Body authorizationId={authorizationId} role={user!.role} email={user!.email} />
        </div>

        <p className="mt-6 text-center text-2xs text-faint">
          Aldo Éditions · autorisation d&apos;accès à l&apos;administration
        </p>
      </div>
    </main>
  );
}

async function Body({
  authorizationId,
  role,
  email,
}: {
  authorizationId?: string;
  role: string;
  email: string;
}) {
  if (!authorizationId) {
    return <Notice tone="warning">Requête d&apos;autorisation incomplète (identifiant manquant).</Notice>;
  }

  if (role !== "admin") {
    return (
      <Notice tone="warning">
        Le compte <span className="font-medium">{email}</span> n&apos;est pas administrateur. Seuls
        les comptes de l&apos;équipe peuvent autoriser un connecteur à l&apos;administration Aldo.
      </Notice>
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (error) {
    return <Notice tone="danger">Autorisation introuvable ou expirée. Relance la connexion depuis le connecteur.</Notice>;
  }

  // Déjà consenti → Supabase renvoie directement l'URL de redirection.
  if (data && "redirect_url" in data) {
    redirect(data.redirect_url);
  }

  const details = data as Extract<typeof data, { authorization_id: string }>;
  const scopes = (details.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <>
      <h1 className="font-serif text-lg text-text">
        {details.client.name || "Un connecteur"} demande l&apos;accès à l&apos;administration Aldo
      </h1>
      <p className="mt-2 text-sm text-muted">
        Connecté en tant que <span className="font-medium text-text">{email}</span>.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-bg/60 px-4 py-3 text-sm text-muted">
        <p className="font-medium text-text">Cet accès permet au connecteur de :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>lire les campagnes, les contrats et les ventes ;</li>
          <li>générer les contrats et les marquer comme envoyés.</li>
        </ul>
        <p className="mt-3 text-2xs text-faint">
          Aucune donnée sensible n&apos;est accessible : ni IBAN, ni n° de sécurité sociale, ni
          adresse, ni donnée client. Chaque action d&apos;écriture est confirmée et journalisée.
        </p>
      </div>

      {scopes.length > 0 && (
        <p className="mt-3 text-2xs text-faint">Portées demandées : {scopes.join(", ")}</p>
      )}

      <ConsentButtons authorizationId={authorizationId} />
    </>
  );
}

function Notice({ tone, children }: { tone: "warning" | "danger"; children: React.ReactNode }) {
  const cls = tone === "danger" ? "bg-dangerBg text-danger" : "bg-warningBg text-warning";
  return <p className={`rounded-lg px-3 py-2 text-sm ${cls}`}>{children}</p>;
}
