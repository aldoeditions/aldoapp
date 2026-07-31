import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ibanMasque } from "@/lib/contracts/format";
import type { Artist, Contract, Drop } from "@/types/database";

export type ContractRow = Contract & { drop_name: string | null };

export type ContractContext = {
  artist: Artist | null;
  iban: string | null;
  ibanMasked: string;
  drops: Pick<Drop, "id" | "name" | "status" | "start_date" | "end_date">[];
  contracts: ContractRow[];
  commissionPct: number;
  missing: string[];
};

/** Champs obligatoires manquants pour générer un contrat conforme. */
function missingFields(a: Artist | null, iban: string | null): string[] {
  if (!a) return [];
  const m: string[] = [];
  if (!a.birth_date) m.push("Date de naissance");
  if (!a.birth_place) m.push("Lieu de naissance");
  if (!(a.address ?? "").trim()) m.push("Adresse postale");
  if (!(a.email ?? "").trim()) m.push("Email");
  if (!(iban ?? "").trim()) m.push("IBAN");
  return m;
}

/** Contexte de génération de contrat pour un artiste (fiche admin). */
export async function getContractContext(artistId: string): Promise<ContractContext> {
  const supabase = createClient();
  const admin = createAdminClient(); // IBAN : lecture privilégiée serveur

  const [artistRes, bankingRes, dropsRes, contractsRes] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
    admin.from("artist_banking").select("iban").eq("artist_id", artistId).maybeSingle(),
    supabase
      .from("drops")
      .select("id, name, status, start_date, end_date")
      .in("status", ["à venir", "en cours"])
      .order("start_date", { ascending: true }),
    supabase
      .from("contracts")
      .select("*, drops(name)")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false }),
  ]);

  const artist = (artistRes.data as Artist) ?? null;
  const iban = bankingRes.data?.iban ?? null;
  const contracts: ContractRow[] = (contractsRes.data ?? []).map((c) => {
    const { drops, ...rest } = c as Contract & { drops: { name: string } | null };
    return { ...rest, drop_name: drops?.name ?? null };
  });

  return {
    artist,
    iban,
    ibanMasked: ibanMasque(iban),
    drops: dropsRes.data ?? [],
    contracts,
    commissionPct: artist?.commission_pct ?? 30,
    missing: missingFields(artist, iban),
  };
}
