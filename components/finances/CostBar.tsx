import { euros } from "@/lib/format";

export type PnlBreakdown = {
  ca: number;
  commissions: number;
  impression: number;
  packaging: number;
  charges: number;
  net: number;
};

const SEGMENTS: { key: keyof Omit<PnlBreakdown, "ca" | "net">; label: string; cls: string }[] = [
  { key: "commissions", label: "Commissions", cls: "bg-accent" },
  { key: "impression", label: "Impression", cls: "bg-warning" },
  { key: "packaging", label: "Packaging", cls: "bg-muted" },
  { key: "charges", label: "Charges", cls: "bg-danger" },
];

/** Barre empilée : décompose le CA en coûts + résultat net. */
export function CostBar({ data, showLegend = true }: { data: PnlBreakdown; showLegend?: boolean }) {
  const costs = data.commissions + data.impression + data.packaging + data.charges;
  const base = Math.max(data.ca, costs, 1);
  const pct = (v: number) => `${Math.max(0, (v / base) * 100)}%`;
  const netPositive = data.net >= 0;

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border">
        {SEGMENTS.map((s) => {
          const v = data[s.key];
          if (v <= 0) return null;
          return (
            <div
              key={s.key}
              className={s.cls}
              style={{ width: pct(v) }}
              title={`${s.label} : ${euros(v)}`}
            />
          );
        })}
        {netPositive && data.net > 0 && (
          <div className="bg-success" style={{ width: pct(data.net) }} title={`Résultat net : ${euros(data.net)}`} />
        )}
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {SEGMENTS.map((s) => (
            <LegendItem key={s.key} cls={s.cls} label={s.label} value={data[s.key]} />
          ))}
          <LegendItem
            cls={netPositive ? "bg-success" : "bg-danger"}
            label="Résultat net"
            value={data.net}
            strong
          />
        </div>
      )}
    </div>
  );
}

function LegendItem({ cls, label, value, strong }: { cls: string; label: string; value: number; strong?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs">
      <span className={`h-2 w-2 rounded-sm ${cls}`} />
      <span className="text-muted">{label}</span>
      <span className={strong ? "font-semibold text-text" : "text-text"}>{euros(value)}</span>
    </span>
  );
}
