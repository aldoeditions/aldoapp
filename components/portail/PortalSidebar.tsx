"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { logoutPortal } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/brand/Logo";

type IconProps = { className?: string };
const base = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

const Icons = {
  home: (p: IconProps) => (<svg {...base} className={p.className}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>),
  oeuvres: (p: IconProps) => (<svg {...base} className={p.className}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>),
  ventes: (p: IconProps) => (<svg {...base} className={p.className}><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3M20 16v-6" /></svg>),
  fichiers: (p: IconProps) => (<svg {...base} className={p.className}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>),
  profil: (p: IconProps) => (<svg {...base} className={p.className}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>),
  contrats: (p: IconProps) => (<svg {...base} className={p.className}><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M8 12h8M8 16h5" /></svg>),
  calendrier: (p: IconProps) => (<svg {...base} className={p.className}><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>),
  logout: (p: IconProps) => (<svg {...base} className={p.className}><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" /><path d="M10 12H3m0 0 3-3m-3 3 3 3" /></svg>),
};

const LINKS = [
  { href: "/portail", label: "Accueil", Icon: Icons.home },
  { href: "/portail/oeuvres", label: "Œuvres", Icon: Icons.oeuvres },
  { href: "/portail/ventes", label: "Ventes", Icon: Icons.ventes },
  { href: "/portail/fichiers", label: "Fichiers", Icon: Icons.fichiers },
  { href: "/portail/profil", label: "Profil", Icon: Icons.profil },
  { href: "/portail/contrats", label: "Contrats", Icon: Icons.contrats },
  { href: "/portail/calendrier", label: "Calendrier", Icon: Icons.calendrier },
];

function isActive(pathname: string, href: string) {
  return href === "/portail" ? pathname === "/portail" : pathname.startsWith(href);
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-accentBg text-accent" : "text-muted hover:bg-bg hover:text-text",
            )}
          >
            <Icon className={cn("shrink-0", active ? "text-accent" : "text-faint")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Account({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-border px-2 pt-4">
      <Avatar name={name} src={avatarUrl} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{name}</span>
      <form action={logoutPortal}>
        <button
          type="submit"
          title="Se déconnecter"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-text"
        >
          <Icons.logout />
        </button>
      </form>
    </div>
  );
}

export function PortalSidebar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop : sidebar fixe */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="px-5 pb-6 pt-6">
          <Link href="/portail" className="flex items-center gap-2.5">
            <Logo className="h-6 text-accent" />
            <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-faint">
              Espace artiste
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavList pathname={pathname} />
        </div>
        <div className="p-3">
          <Account name={name} avatarUrl={avatarUrl} />
        </div>
      </aside>

      {/* Mobile : barre supérieure */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/portail" className="flex items-center gap-2">
          <Logo className="h-5 text-accent" />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-muted hover:bg-bg"
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>

      {/* Mobile : drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative flex h-full w-72 max-w-[80%] flex-col bg-surface shadow-float">
            <div className="flex items-center justify-between px-5 pb-6 pt-5">
              <Logo className="h-6 text-accent" />
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted hover:bg-bg" aria-label="Fermer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="p-3">
              <Account name={name} avatarUrl={avatarUrl} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
