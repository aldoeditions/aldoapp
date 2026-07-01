import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { euros0, nombre } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const prenom = (user.profile?.name ?? user.email.split("@")[0]).split(" ")[0];

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
