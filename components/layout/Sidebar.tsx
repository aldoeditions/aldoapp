"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { canView, type ModuleKey, type Role } from "@/lib/auth/permissions";
import { NAV } from "./nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-white/90">
      {/* Marque */}
      <div className="px-5 pb-5 pt-6">
        <Link href="/" className="block">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Administration
          </p>
          <p className="mt-1 font-serif text-xl tracking-tight text-white">
            Aldo Éditions
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => {
          const items = group.items.filter((it) =>
            canView(role, it.key as ModuleKey),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.title} className="mb-5">
              <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-white/30">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {items.map(({ key, label, href, Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={key}>
                      <Link
                        href={href}
                        className={cn(
                          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon
                          className={cn(
                            "shrink-0",
                            active ? "text-accent" : "text-white/50",
                          )}
                        />
                        <span>{label}</span>
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
