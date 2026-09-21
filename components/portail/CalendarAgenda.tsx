import { StatusBadge } from "@/components/ui/Badge";
import { DROP_STATUS } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import type { ArtistCampaignAgenda, ArtistCalendarEvent } from "@/lib/data/portal";

const DOT: Record<ArtistCalendarEvent["type"], string> = {
  vente: "bg-accent",
  deadline: "bg-danger",
  impression: "bg-faint",
  fin: "bg-muted",
  paiement: "bg-success",
};

function relative(date: string, today: string): { txt: string; cls: string } {
  const days = Math.round(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000,
  );
  if (days < 0) return { txt: "passé", cls: "text-faint" };
  if (days === 0) return { txt: "aujourd'hui", cls: "text-accent font-semibold" };
  if (days === 1) return { txt: "demain", cls: "text-warning font-semibold" };
  if (days <= 7) return { txt: `dans ${days} jours`, cls: "text-warning font-medium" };
  if (days <= 31) return { txt: `dans ${days} jours`, cls: "text-muted" };
  return { txt: `dans ${Math.round(days / 7)} sem.`, cls: "text-faint" };
}

export function CalendarAgenda({ agendas, today }: { agendas: ArtistCampaignAgenda[]; today: string }) {
  if (agendas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
        <p className="eyebrow">Aucune campagne à venir</p>
        <p className="mt-2 text-sm text-muted">
          Dès que tes œuvres seront programmées dans une campagne, ses dates clés apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {agendas.map((c) => (
        <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
            <div>
              <p className="font-serif text-lg leading-tight text-text">{c.name}</p>
              {c.start_date && c.end_date && (
                <p className="text-2xs text-faint">
                  {dateCourte(c.start_date)} → {dateCourte(c.end_date)}
                </p>
              )}
            </div>
            <StatusBadge value={c.status} dict={DROP_STATUS} />
          </div>

          <ol className="divide-y divide-border">
            {c.events.map((e, i) => {
              const r = relative(e.date, today);
              const passed = r.txt === "passé";
              return (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className={"h-2.5 w-2.5 shrink-0 rounded-full " + (passed ? "bg-border" : DOT[e.type])} />
                  <span className="min-w-0 flex-1">
                    <span className={"block text-sm font-medium " + (passed ? "text-faint line-through" : "text-text")}>
                      {e.label}
                    </span>
                    {e.note && <span className="text-2xs text-faint">{e.note}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-2xs text-muted">{dateCourte(e.date)}</span>
                    <span className={"block text-2xs " + r.cls}>{r.txt}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
