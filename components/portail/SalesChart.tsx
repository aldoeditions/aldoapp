"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/** Graphe des ventes (CA) par campagne. */
export function SalesChart({
  data,
}: {
  data: { name: string; ca: number; ventes: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-faint">
        Pas encore de ventes à afficher.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DF" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#8A8780" }}
            tickLine={false}
            axisLine={{ stroke: "#E8E5DF" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8A8780" }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `${v} €`}
          />
          <Tooltip
            cursor={{ fill: "#EEF0FF" }}
            formatter={(v) => [`${v} €`, "CA"] as [string, string]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E8E5DF",
              fontSize: 12,
            }}
          />
          <Bar dataKey="ca" fill="#0627b7" radius={[6, 6, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
