import Link from "next/link";
import { requireModule } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { getSocialPosts, getSocialCounts } from "@/lib/data/social";
import { getDropsForSelect } from "@/lib/data/drops";
import { PageHeader } from "@/components/ui/PageHeader";
import { SocialPostFormButton } from "@/components/social/SocialPostFormButton";
import { SocialFilters } from "@/components/social/SocialFilters";
import { SocialListView } from "@/components/social/SocialListView";
import { SocialCalendar } from "@/components/social/SocialCalendar";

export default async function SocialPage({
  searchParams,
}: {
  searchParams: { view?: string; drop?: string; status?: string };
}) {
  const user = await requireModule("social");
  const editable = canEdit(user.role, "social");
  const view = searchParams.view === "liste" ? "liste" : "calendrier";

  const [posts, counts, drops] = await Promise.all([
    getSocialPosts({ drop: searchParams.drop, status: searchParams.status }),
    getSocialCounts(),
    getDropsForSelect(),
  ]);

  const qs = (key: "calendrier" | "liste") => {
    const p = new URLSearchParams();
    p.set("view", key);
    if (searchParams.drop) p.set("drop", searchParams.drop);
    if (searchParams.status) p.set("status", searchParams.status);
    return `/social?${p.toString()}`;
  };

  const tab = (key: "calendrier" | "liste", label: string) => (
    <Link
      href={qs(key)}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg p-1">
          {tab("calendrier", "Calendrier")}
          {tab("liste", "Liste")}
        </div>
        <SocialFilters drops={drops} />
      </div>

      {view === "calendrier" ? (
        <SocialCalendar posts={posts} drops={drops} />
      ) : (
        <SocialListView posts={posts} drops={drops} />
      )}
    </div>
  );
}
