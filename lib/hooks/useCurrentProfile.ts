"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrentProfile = {
  id: string;
  display_name: string | null;
  avatar_initials: string | null;
  role: string | null;
} | null;

/** Profil complet de l'utilisateur connecté (côté client). */
export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setProfile(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_initials, role")
        .eq("id", user.id)
        .maybeSingle();
      if (active) { setProfile((data as CurrentProfile) ?? null); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return { profile, loading };
}
