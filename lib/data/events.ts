import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ArtistEvent } from "@/types/database";

/** Événements de l'artiste connecté (RLS scoping), triés par date. */
export async function getMyEvents(): Promise<ArtistEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artist_events")
    .select("*")
    .order("event_date", { ascending: true, nullsFirst: false })
    .returns<ArtistEvent[]>();
  return data ?? [];
}

export type AdminEvent = ArtistEvent & { artist_name: string | null };

/** Tous les événements (vue équipe) avec le nom de l'artiste, pour l'Agenda. */
export async function getAllArtistEvents(): Promise<AdminEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artist_events")
    .select("*, artists(name)")
    .order("event_date", { ascending: true, nullsFirst: false })
    .returns<(ArtistEvent & { artists: { name: string } | null })[]>();
  return (data ?? []).map((e) => {
    const { artists, ...rest } = e;
    return { ...rest, artist_name: artists?.name ?? null };
  });
}

/** Nombre d'événements « proposés » (à trier pour l'Agenda) — badge admin. */
export async function getProposedEventsCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("artist_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "proposé");
  return count ?? 0;
}
