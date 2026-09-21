import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type SocialPost = Tables<"social_posts">;
export type SocialPostWithRefs = SocialPost & { drop_name: string | null };

export type SocialFilter = { drop?: string; status?: string };

/** Posts planifiés (+ nom de campagne), triés par date de post. */
export async function getSocialPosts(filter: SocialFilter = {}): Promise<SocialPostWithRefs[]> {
  const supabase = createClient();
  let q = supabase.from("social_posts").select("*, drops(name)");
  if (filter.drop) q = q.eq("drop_id", filter.drop);
  if (filter.status) q = q.eq("status", filter.status);
  q = q.order("post_date", { ascending: true });
  const { data } = await q.returns<(SocialPost & { drops: { name: string } | null })[]>();
  return (data ?? []).map((p) => {
    const { drops, ...rest } = p;
    return { ...rest, drop_name: drops?.name ?? null };
  });
}

/** Prochains posts à venir (non postés), pour le dashboard. */
export async function getUpcomingSocialPosts(limit = 5): Promise<SocialPostWithRefs[]> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("social_posts")
    .select("*, drops(name)")
    .neq("status", "posté")
    .gte("post_date", today)
    .order("post_date", { ascending: true })
    .limit(limit)
    .returns<(SocialPost & { drops: { name: string } | null })[]>();
  return (data ?? []).map((p) => {
    const { drops, ...rest } = p;
    return { ...rest, drop_name: drops?.name ?? null };
  });
}

/** Compteurs pour l'en-tête. */
export async function getSocialCounts(): Promise<{ total: number; toPrepare: number }> {
  const supabase = createClient();
  const [{ count: total }, { count: toPrepare }] = await Promise.all([
    supabase.from("social_posts").select("*", { count: "exact", head: true }),
    supabase.from("social_posts").select("*", { count: "exact", head: true }).eq("status", "en préparation"),
  ]);
  return { total: total ?? 0, toPrepare: toPrepare ?? 0 };
}
