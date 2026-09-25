"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { submitOeuvreDescription } from "@/app/portail/(shell)/actions";

export function OeuvreDescriptionForm({
  oeuvreId,
  oeuvreName,
  description,
  status,
}: {
  oeuvreId: string;
  oeuvreName: string;
  description: string | null;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [value, setValue] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);

  const trigger =
    status === "validée"
      ? { cls: "border-success/30 bg-successBg/50 text-success", label: "✓ Description validée" }
      : status === "à valider"
        ? { cls: "border-warning/30 bg-warningBg/60 text-warning", label: "⏳ Description à valider" }
        : { cls: "border-accent/30 bg-accentBg/60 text-accent", label: "✏️ Décrire cette œuvre" };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start(async () => {
      setError(null);
      const res = await submitOeuvreDescription(oeuvreId, value);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={"mt-3 w-full rounded-md border px-3 py-2 text-2xs font-semibold transition-colors " + trigger.cls}
      >
        {trigger.label}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Description de l'œuvre">
        {open && (
          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <div>
              <p className="font-serif text-lg text-text">{oeuvreName}</p>
              <p className="mt-1 text-2xs text-muted">
                Raconte cette œuvre : l&apos;intention, la technique, l&apos;histoire… Ce texte sera relu par Aldo avant
                d&apos;être publié sur la boutique.
              </p>
            </div>

            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={7}
              placeholder="Ex. Cette affiche s'inspire de…"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />

            {status === "validée" && (
              <p className="rounded-md bg-bg px-3 py-2 text-2xs text-muted">
                Cette description est déjà validée. Si tu la modifies, elle repassera en validation.
              </p>
            )}
            {error && <p className="rounded-md bg-dangerBg px-3 py-2 text-2xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={pending || !value.trim()}
              className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentHover disabled:opacity-60"
            >
              {pending ? "Envoi…" : "Envoyer à Aldo"}
            </button>
          </form>
        )}
      </Drawer>
    </>
  );
}
