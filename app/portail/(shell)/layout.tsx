import { requireArtist } from "@/lib/auth/session";
import { getMyArtist } from "@/lib/data/portal";
import { PortalSidebar } from "@/components/portail/PortalSidebar";
import { Logo } from "@/components/brand/Logo";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireArtist();
  const artist = await getMyArtist();
  const name = artist?.name ?? user.profile?.name ?? user.email.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col bg-bg md:h-screen md:flex-row md:overflow-hidden">
      <PortalSidebar name={name} avatarUrl={artist?.avatar_url ?? null} />

      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <main className="flex flex-1 flex-col md:overflow-y-auto">
          <div className="w-full flex-1 px-5 py-8 sm:px-8 sm:py-10">
            {children}
          </div>

          <footer className="mt-auto border-t border-border">
            <div className="flex flex-col items-center justify-between gap-2 px-5 py-5 text-2xs text-faint sm:flex-row sm:px-8">
              <Logo className="h-4 text-muted" />
              <span>
                Une question ? Écris-nous à{" "}
                <a href="mailto:contact@aldoeditions.com" className="text-accent hover:underline">
                  contact@aldoeditions.com
                </a>
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
