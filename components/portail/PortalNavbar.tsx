"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { logoutPortal } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/Avatar";

const LINKS = [
  { href: "/portail", label: "Accueil" },
  { href: "/portail/profil", label: "Profil" },
  { href: "/portail/fichiers", label: "Fichiers" },
  { href: "/portail/ventes", label: "Ventes" },
  { href: "/portail/contrats", label: "Contrats" },
  { href: "/portail/calendrier", label: "Calendrier" },
];

function isActive(pathname: string, href: string) {
  return href === "/portail" ? pathname === "/portail" : pathname.startsWith(href);
}

export function PortalNavbar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Marque */}
        <Link href="/portail" className="flex items-center gap-2">
          <span className="font-serif text-xl tracking-tight text-text">Aldo</span>
          <span className="hidden text-2xs font-semibold uppercase tracking-[0.16em] text-faint sm:inline">
            Espace artiste
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, l.href)
                  ? "bg-accentBg text-accent"
                  : "text-muted hover:bg-bg hover:text-text",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Compte + burger */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar name={name} src={avatarUrl} size="sm" />
            <span className="text-sm font-medium text-text">{name}</span>
          </div>
          <form action={logoutPortal} className="hidden md:block">
            <button
              type="submit"
              className="rounded-md px-2.5 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-text"
              title="Se déconnecter"
            >
              Quitter
            </button>
          </form>
          <button
            className="rounded-md p-2 text-muted hover:bg-bg md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Nav mobile */}
      {open && (
        <nav className="border-t border-line bg-surface px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(pathname, l.href)
                  ? "bg-accentBg text-accent"
                  : "text-muted hover:bg-bg hover:text-text",
              )}
            >
              {l.label}
            </Link>
          ))}
          <form action={logoutPortal}>
            <button
              type="submit"
              className="mt-1 block w-full rounded-md px-3 py-2.5 text-left text-sm text-danger hover:bg-dangerBg"
            >
              Se déconnecter
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
