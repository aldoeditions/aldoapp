"use client";

import { useState } from "react";
import Link from "next/link";
import { type Role } from "@/lib/auth/permissions";
import { Logo } from "@/components/brand/Logo";
import { SidebarNavList } from "./SidebarNavList";

/** Navigation admin mobile : bouton hamburger + drawer sombre. */
export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-border/60 hover:text-text"
        aria-label="Ouvrir le menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="grain relative flex h-full w-64 max-w-[82%] flex-col bg-sidebar text-white/90 shadow-float">
            <div className="flex items-center justify-between px-5 pb-5 pt-6">
              <Link href="/" onClick={() => setOpen(false)}>
                <Logo className="h-6 text-white" />
              </Link>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-white/70 hover:bg-white/10" aria-label="Fermer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <SidebarNavList role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
