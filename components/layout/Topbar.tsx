"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { initiales } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/auth/permissions";
import { LogoutIcon } from "./icons";
import { NAV } from "./nav";

function currentLabel(pathname: string): string {
  for (const group of NAV) {
    for (const item of group.items) {
      if (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) {
        return item.label;
      }
    }
  }
  return "Aldo Éditions";
}

export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: Role;
}) {
  const pathname = usePathname();
  const label = currentLabel(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="text-faint">Aldo Éditions</span>
        <span className="text-faint">/</span>
        <span className="font-medium text-text">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-text">{name}</p>
          <p className="text-2xs text-faint">{ROLE_LABEL[role]}</p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-2xs font-semibold text-white"
          title={email}
        >
          {initiales(name)}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-border/60 hover:text-text"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogoutIcon />
          </button>
        </form>
      </div>
    </header>
  );
}
