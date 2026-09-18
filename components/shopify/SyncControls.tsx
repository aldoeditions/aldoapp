"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pingShopify, syncRecentOrders } from "@/app/(app)/parametres/shopify/actions";

export function SyncControls() {
  const router = useRouter();
  const [pingMsg, setPingMsg] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [pingPending, startPing] = useTransition();
  const [syncPending, startSync] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pingPending}
        onClick={() =>
          startPing(async () => {
            setPingMsg(null);
            const r = await pingShopify();
            setPingMsg(r.ok ? `Connecté à « ${r.shop} » ✓` : `Échec : ${r.error}`);
          })
        }
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-2xs font-semibold text-text transition-colors hover:bg-bg disabled:opacity-60"
      >
        {pingPending ? "Test…" : "Tester la connexion"}
      </button>
      {pingMsg && <span className="text-2xs text-muted">{pingMsg}</span>}

      <span className="ml-auto flex items-center gap-2">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-border bg-white px-2 py-1.5 text-2xs outline-none focus:border-accent"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
          <option value={365}>1 an</option>
        </select>
        <button
          type="button"
          disabled={syncPending}
          onClick={() =>
            startSync(async () => {
              setSyncMsg(null);
              const r = await syncRecentOrders(days);
              setSyncMsg(
                r.error
                  ? `Erreur : ${r.error}`
                  : `${r.imported} commande(s) importée(s)${r.unresolved ? ` · ${r.unresolved} ligne(s) non résolue(s)` : ""}`,
              );
              router.refresh();
            })
          }
          className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-accentHover disabled:opacity-60"
        >
          {syncPending ? "Import…" : "Importer les commandes"}
        </button>
      </span>
      {syncMsg && <span className="w-full text-2xs text-muted">{syncMsg}</span>}
    </div>
  );
}
