"use client";

import { useState } from "react";
import { socialUrgency } from "@/lib/social";
import { SocialPostFormButton } from "./SocialPostFormButton";
import type { SocialPostWithRefs } from "@/lib/data/social";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function chipCls(status: string, urgencyVariant: string): string {
  if (urgencyVariant === "red") return "bg-dangerBg text-danger";
  if (status === "prêt à poster") return "bg-accentBg text-accent";
  if (status === "posté") return "bg-bg text-faint";
  return "bg-warningBg text-warning"; // en préparation
}

export function SocialCalendar({
  posts,
  drops,
}: {
  posts: SocialPostWithRefs[];
  drops: { id: string; name: string }[];
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const byDate = new Map<string, SocialPostWithRefs[]>();
  for (const p of posts) {
    const arr = byDate.get(p.post_date) ?? [];
    arr.push(p);
    byDate.set(p.post_date, arr);
  }

  const first = new Date(cursor.y, cursor.m, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayStr = fmt(today);

  const shift = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm text-muted hover:bg-bg">‹</button>
          <button onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })} className="rounded-md border border-border bg-surface px-3 py-1 text-2xs font-medium text-muted hover:bg-bg">Aujourd&apos;hui</button>
          <button onClick={() => shift(1)} className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm text-muted hover:bg-bg">›</button>
        </div>
        <span className="font-serif text-lg text-text">{MONTHS[cursor.m]} {cursor.y}</span>
      </div>

      <div className="grid grid-cols-7 border-b border-border text-center text-2xs uppercase tracking-wider text-faint">
        {DOW.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: cellCount }, (_, i) => {
          const date = new Date(cursor.y, cursor.m, 1 - startOffset + i);
          const key = fmt(date);
          const inMonth = date.getMonth() === cursor.m;
          const isToday = key === todayStr;
          const dayPosts = byDate.get(key) ?? [];
          return (
            <div
              key={i}
              className={
                "group min-h-[92px] border-b border-r border-border p-1.5 last:border-r-0 " +
                (inMonth ? "bg-surface" : "bg-bg/40")
              }
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={"text-2xs " + (isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-white" : inMonth ? "text-muted" : "text-faint")}>
                  {date.getDate()}
                </span>
                {inMonth && (
                  <SocialPostFormButton
                    drops={drops}
                    defaultDate={key}
                    label="+"
                    className="hidden h-4 w-4 items-center justify-center rounded text-faint hover:bg-bg hover:text-accent group-hover:flex"
                  />
                )}
              </div>
              <div className="space-y-1">
                {dayPosts.map((p) => {
                  const u = socialUrgency(p.post_date, p.status);
                  return (
                    <SocialPostFormButton
                      key={p.id}
                      post={p}
                      drops={drops}
                      label={p.title}
                      className={"block w-full truncate rounded px-1.5 py-0.5 text-left text-2xs font-medium " + chipCls(p.status, u.variant)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
