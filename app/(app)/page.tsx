import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPendingFiles } from "@/lib/data/artists";
import { getMyOpenTasks } from "@/lib/data/tasks";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { FilesReview } from "@/components/artists/FilesReview";
import { TASK_STATUS } from "@/lib/constants";
import { euros0, nombre, dateCourte } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const prenom = user.displayName.split(" ")[0];

  // Agrégats légers — la base peut être vide en Phase 0.
  const [{ count: nbArtistes }, { count: nbDrops }, { data: pnl }] =
    await Promise.all([
      supabase.from("artists").select("*", { count: "exact", head: true }),
      supabase.from("drops").select("*", { count: "exact", head: true }),
      supabase
        .from("drop_pnl")
        .select("ca_brut, resultat_net, nb_ventes")
        .order("start_date", { ascending: false })
        .returns<
          { ca_brut: number | null; resultat_net: number | null; nb_ventes: number | null }[]
        >(),
    ]);

  const caTotal = (pnl ?? []).reduce((s, d) => s + (d.ca_brut ?? 0), 0);
  const netTotal = (pnl ?? []).reduce((s, d) => s + (d.resultat_net ?? 0), 0);
  const ventesTotal = (pnl ?? []).reduce((s, d) => s + (d.nb_ventes ?? 0), 0);

  const [pendingFiles, myTasks] = await Promise.all([
    getPendingFiles(),
    getMyOpenTasks(user.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vue d'ensemble"
        title={`Bonjour ${prenom}`}
        description="Tableau de bord de l'activité Aldo Éditions."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CA brut cumulé" value={euros0(caTotal)} accent />
        <StatCard label="Résultat net" value={euros0(netTotal)} />
        <StatCard label="Ventes" value={nombre(ventesTotal)} />
        <StatCard
          label="Artistes"
          value={nombre(nbArtistes ?? 0)}
          hint={`${nombre(nbDrops ?? 0)} drop(s)`}
        />
      </div>

      {/* Actions requises — mes tâches ouvertes */}
      <Card>
        <CardHeader
          title="Actions requises"
          subtitle="Les tâches qui te sont assignées."
          action={
            <Link href="/projet" className="text-2xs font-medium text-accent hover:underline">
              Tout le projet →
            </Link>
          }
        />
        <CardBody className={myTasks.length > 0 ? "p-0" : undefined}>
          {myTasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-faint">Aucune tâche assignée. 🎉</p>
          ) : (
            <ul>
              {myTasks.map((t) => (
                <li key={t.id}>
                  <Link href="/projet" className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm transition-colors last:border-0 hover:bg-bg">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text">{t.title}</span>
                      <span className="text-2xs text-faint">
                        {t.drop_name ?? "—"}{t.due_date ? ` · échéance ${dateCourte(t.due_date)}` : ""}
                      </span>
                    </span>
                    <StatusBadge value={t.status} dict={TASK_STATUS} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Fichiers en attente de validation */}
      <Card>
        <CardHeader
          title="Fichiers en attente"
          subtitle="Fichiers déposés par les artistes, à valider avant impression."
          action={
            pendingFiles.length > 0 ? (
              <span className="rounded-full bg-warningBg px-2.5 py-0.5 text-2xs font-semibold text-warning">
                {nombre(pendingFiles.length)} à traiter
              </span>
            ) : undefined
          }
        />
        <CardBody className={pendingFiles.length > 0 ? "p-0" : undefined}>
          {pendingFiles.length === 0 ? (
            <p className="py-4 text-center text-sm text-faint">
              Aucun fichier en attente. 🎉
            </p>
          ) : (
            <FilesReview files={pendingFiles} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Activité récente"
          subtitle="Les derniers mouvements apparaîtront ici."
        />
        <CardBody>
          <EmptyState
            title="Rien à afficher pour l'instant"
            description="Crée ton premier drop ou ajoute un artiste pour voir l'activité se remplir."
            action={
              <ButtonLink href="/drops" variant="secondary" size="sm">
                Aller aux drops
              </ButtonLink>
            }
          />
        </CardBody>
      </Card>
    </div>
  );
}
