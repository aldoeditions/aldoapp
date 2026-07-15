import Link from "next/link";
import { type Role } from "@/lib/auth/permissions";
import { Logo } from "@/components/brand/Logo";
import { SidebarNavList } from "./SidebarNavList";

/** Sidebar admin — desktop uniquement (md+). Le mobile passe par MobileNav. */
export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="grain hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-white/90 md:flex">
      <div className="px-5 pb-5 pt-6">
        <Link href="/" className="block">
          <Logo className="h-6 text-white" />
          <p className="mt-2 text-2xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Administration
          </p>
        </Link>
      </div>
      <SidebarNavList role={role} />
    </aside>
  );
}
