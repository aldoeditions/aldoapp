"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SOCIAL_STATUSES, SOCIAL_FORMAT } from "@/lib/constants";
import { dateCourte } from "@/lib/format";
import { socialUrgency } from "@/lib/social";
import { updateSocialStatus, deleteSocialPost } from "@/app/(app)/social/actions";
import { SocialPostFormButton } from "./SocialPostFormButton";
import type { SocialPostWithRefs } from "@/lib/data/social";

const URGENCY_CLS: Record<string, string> = {
  red: "bg-dangerBg text-danger",
  orange: "bg-warningBg text-warning",
  gray: "text-faint",
};

export function SocialListView({
  posts,
  drops,
}: {
  posts: SocialPostWithRefs[];
  drops: { id: string; name: string }[];
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface py-12 text-center text-sm text-faint">
        Aucun post planifié. Clique sur « Nouveau post » pour commencer.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-faint">
              <th className="px-5 py-2.5 font-semibold">Post</th>
              <th className="px-3 py-2.5 font-semibold">Date</th>
              <th className="px-3 py-2.5 font-semibold">Urgence</th>
              <th className="px-3 py-2.5 font-semibold">Statut</th>
              <th className="px-3 py-2.5 font-semibold">Campagne</th>
              <th className="px-3 py-2.5 font-semibold">Drive</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <Row key={p.id} post={p} drops={drops} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ post, drops }: { post: SocialPostWithRefs; drops: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const u = socialUrgency(post.post_date, post.status);
  const fmt = post.format ? SOCIAL_FORMAT[post.format] : null;

  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-bg">
      <td className="px-5 py-3">
        <span className="font-medium text-text">{post.title}</span>
        {fmt && <span className="ml-2 rounded-full bg-bg px-2 py-0.5 text-2xs text-muted">{fmt.label}</span>}
      </td>
      <td className="px-3 py-3 text-muted">{dateCourte(post.post_date)}</td>
      <td className="px-3 py-3">
        {u.label ? (
          <span className={"rounded-full px-2 py-0.5 text-2xs font-semibold " + (URGENCY_CLS[u.variant] ?? "")}>{u.label}</span>
        ) : (
          <span className="text-2xs text-faint">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        <select
          value={post.status}
          disabled={pending}
          onChange={(e) => start(async () => { await updateSocialStatus(post.id, e.target.value); router.refresh(); })}
          className="rounded-md border border-border bg-white px-2 py-1 text-2xs outline-none focus:border-accent disabled:opacity-60"
        >
          {SOCIAL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3 text-muted">{post.drop_name ?? "—"}</td>
      <td className="px-3 py-3">
        {post.drive_link ? (
          <a href={post.drive_link} target="_blank" rel="noopener noreferrer" className="text-2xs font-medium text-accent hover:underline">Ouvrir</a>
        ) : (
          <span className="text-2xs text-faint">—</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-3">
          <SocialPostFormButton post={post} drops={drops} variant="link" label="Modifier" />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Supprimer le post « ${post.title} » ? (la tâche liée sera aussi supprimée)`)) return;
              start(async () => { await deleteSocialPost(post.id); router.refresh(); });
            }}
            className="text-2xs font-medium text-muted transition-colors hover:text-danger disabled:opacity-50"
          >
            Suppr.
          </button>
        </div>
      </td>
    </tr>
  );
}
