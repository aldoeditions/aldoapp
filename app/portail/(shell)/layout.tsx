import { requireArtist } from "@/lib/auth/session";
import { getMyArtist } from "@/lib/data/portal";
import { PortalNavbar } from "@/components/portail/PortalNavbar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireArtist();
  const artist = await getMyArtist();
  const name = artist?.name ?? user.profile?.name ?? user.email.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PortalNavbar name={name} avatarUrl={artist?.avatar_url ?? null} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-2xs text-faint sm:flex-row sm:px-6">
          <span className="font-serif text-sm text-muted">Aldo Éditions</span>
          <span>
            Une question ? Écris-nous à{" "}
            <a href="mailto:contact@aldoeditions.com" className="text-accent hover:underline">
              contact@aldoeditions.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
