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
    <div className="min-h-screen bg-canvas">
      <PortalNavbar name={name} avatarUrl={artist?.avatar_url ?? null} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
