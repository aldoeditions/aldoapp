import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/session";
import { getCampaignRoyalties } from "@/lib/data/royalties";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { eurosCents } from "@/lib/format";
import { RoyaltyToolbar } from "@/components/finances/RoyaltyToolbar";
import { RoyaltyRowActions } from "@/components/finances/RoyaltyRowActions";

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    brouillon: "bg-bg text-muted",
    émis: "bg-accentBg text-accent",
    payé: "bg-successBg text-success",
    annulé: "bg-dangerBg text-danger",
  };
  const label = status ?? "à générer";
  return (
    <span className={"rounded-full px-2 py-0.5 text-2xs font-semibold " + (map[status ?? ""] ?? "bg-bg text-faint")}>
      {label}
    </span>
  );
}

export default async function CampaignRoyaltiesPage({ params }: { params: { id: string } }) {
  await requireModule("finances");
  const { drop, rate, rows } = await getCampaignRoyalties(params.id);
  if (!drop) notFound();

  const totals = rows.reduce(
    (t, r) => {
      const st = r.statement;
      const useSnap = st && st.status !== "brouillon";
      t.brut += (useSnap ? st!.brut_cents : r.computed?.brut_cents) ?? 0;
      t.precompte += (useSnap ? st!.precompte_cents : r.computed?.precompte?.total_cents ?? 0) ?? 0;
      t.net += (useSnap ? st!.net_cents : r.computed?.net_cents) ?? 0;
      return t;
    },
    { brut: 0, precompte: 0, net: 0 },
  );

  return (
    <div className="space-y-6">
      <Link href={`/drops/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        {drop.name}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Après campagne"
          title="Relevés de droits d'auteur"
          description="Un relevé par artiste : ventes, brut, précompte éventuel et net à verser. Génère les brouillons puis émets-les (numérotés et figés)."
        />
        <RoyaltyToolbar dropId={params.id} />
      </div>

      {!rate && (
        <div className="rounded-lg border border-warning/25 bg-warningBg/50 px-4 py-2.5 text-sm text-warning">
          Aucun barème social pour la date du jour — impossible de calculer le précompte.
        </div>
      )}

      {rows.length === 0 ? (
        <Card><CardBody className="py-10 text-center text-sm text-faint">Aucun artiste programmé sur cette campagne.</CardBody></Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
                  <th className="px-5 py-2.5 font-semibold">Artiste</th>
                  <th className="px-3 py-2.5 text-right font-semibold">HT</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Brut</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Précompte</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Net</th>
                  <th className="px-3 py-2.5 font-semibold">Relevé</th>
                  <th className="px-3 py-2.5 font-semibold">Alertes</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = r.statement;
                  const useSnap = st && st.status !== "brouillon";
                  const ht = (useSnap ? st!.total_ht_cents : r.computed?.total_ht_cents) ?? 0;
                  const brut = (useSnap ? st!.brut_cents : r.computed?.brut_cents) ?? 0;
                  const prec = (useSnap ? st!.precompte_cents : r.computed?.precompte?.total_cents ?? 0) ?? 0;
                  const net = (useSnap ? st!.net_cents : r.computed?.net_cents) ?? 0;
                  return (
                    <tr key={r.artist_id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5">
                        <Link href={`/artistes/${r.artist_id}`} className="font-medium text-text hover:text-accent">{r.artist_name}</Link>
                        <span className="ml-2 text-2xs text-faint">{Math.round(r.commission_pct)}%</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted">{eurosCents(ht)}</td>
                      <td className="px-3 py-2.5 text-right text-text">{eurosCents(brut)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{r.exempt ? "— (dispense)" : `− ${eurosCents(prec)}`}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-accent">{eurosCents(net)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <StatusPill status={st?.status ?? null} />
                          {st?.number && <span className="font-mono text-2xs text-faint">{st.number}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.alerts.length === 0 ? (
                          <span className="text-2xs text-faint">—</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {r.alerts.map((a) => (
                              <span key={a} className="text-2xs font-medium text-warning">{a}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <RoyaltyRowActions
                          dropId={params.id}
                          statementId={st?.id ?? null}
                          status={st?.status ?? null}
                          nonResident={r.non_resident}
                          treatment={st?.non_resident_treatment ?? null}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-bg text-sm font-semibold">
                  <td className="px-5 py-3 text-text">Total</td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3 text-right text-text">{eurosCents(totals.brut)}</td>
                  <td className="px-3 py-3 text-right text-text">{eurosCents(totals.precompte)}</td>
                  <td className="px-3 py-3 text-right text-accent">{eurosCents(totals.net)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
