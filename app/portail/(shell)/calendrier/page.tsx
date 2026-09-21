import { requireArtist } from "@/lib/auth/session";
import { getMyCalendar } from "@/lib/data/portal";
import { CalendarAgenda } from "@/components/portail/CalendarAgenda";
import { dateCourte } from "@/lib/format";

export default async function CalendrierPage() {
  await requireArtist();
  const agendas = await getMyCalendar();
  const today = new Date().toISOString().slice(0, 10);

  // Prochaine échéance à venir, toutes campagnes confondues.
  const next = agendas
    .flatMap((c) => c.events.map((e) => ({ ...e, campaign: c.name })))
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const days = next
    ? Math.round((new Date(`${next.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000)
    : null;

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <h1 className="font-serif text-2xl leading-tight text-text sm:text-[1.9rem]">Calendrier</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Les dates clés de tes campagnes : mise en vente, date limite d&apos;envoi de tes fichiers, fin, et paiement estimé.
        </p>
      </div>

      {next && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accentBg/50 px-5 py-3.5">
          <span className="text-sm text-text">
            <span className="eyebrow mr-2">Prochaine échéance</span>
            <span className="font-medium">{next.label}</span>
            <span className="text-muted"> · {next.campaign}</span>
          </span>
          <span className="text-2xs font-semibold text-accent">
            {dateCourte(next.date)} · {days === 0 ? "aujourd'hui" : days === 1 ? "demain" : `dans ${days} jours`}
          </span>
        </div>
      )}

      <CalendarAgenda agendas={agendas} today={today} />
    </div>
  );
}
