import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getSocialPosts, getSocialCounts } from "@/lib/data/social";
import { getDropsForSelect } from "@/lib/data/drops";
import { PageHeader } from "@/components/ui/PageHeader";
import { SocialPostFormButton } from "@/components/social/SocialPostFormButton";
import { SocialListView } from "@/components/social/SocialListView";
import { SocialCalendar } from "@/components/social/SocialCalendar";

export default async function SocialPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const user = await requireModule("social");
  const editable = canEdit(user.role, "social");
  const view = searchParams.view === "liste" ? "liste" : "calendrier";

  const [posts, counts, drops] = await Promise.all([
    getSocialPosts(),
    getSocialCounts(),
    getDropsForSelect(),
  ]);

  const tab = (key: "calendrier" | "liste", label: string) => (
    <Link
      href={`/social?view=${key}`}
      className={
        "rounded-md px-3 py-1.5 text-2xs font-semibold transition-colors " +
        (view === key ? "bg-surface text-text shadow-card" : "text-muted hover:text-text")
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Réseaux"
        title="Réseaux sociaux"
        description={`${counts.total} post(s) planifié(s) · ${counts.toPrepare} en préparation.`}
        action={editable ? <SocialPostFormButton drops={drops} label="Nouveau post" /> : undefined}
      />

      <div className="flex items-center gap-1 rounded-lg border border-border bg-bg p-1">
        {tab("calendrier", "Calendrier")}
        {tab("liste", "Liste")}
      </div>

      {view === "calendrier" ? (
        <SocialCalendar posts={posts} drops={drops} />
      ) : (
        <SocialListView posts={posts} drops={drops} />
      )}
    </div>
  );
}
