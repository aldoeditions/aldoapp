"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/permissions";
import { ORDER_STATUS } from "@/lib/constants";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export type FormState = { error: string | null; ok?: boolean };

async function assertCanEdit() {
  const user = await requireUser();
  if (!canEdit(user.role, "commandes")) {
    throw new Error("Accès refusé : droits insuffisants.");
  }
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

type ItemInput = { oeuvre_id: string; quantity: number; unit_price: number };

function parseItems(fd: FormData): ItemInput[] {
  const raw = fd.get("items");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const arr = JSON.parse(raw) as ItemInput[];
    return arr
      .filter((i) => i.oeuvre_id && i.quantity > 0)
      .map((i) => ({
        oeuvre_id: i.oeuvre_id,
        quantity: Math.round(i.quantity),
        unit_price: Number(i.unit_price) || 0,
      }));
  } catch {
    return [];
  }
}

type DbClient = ReturnType<typeof createClient>;

/**
 * Recalcule nb_ventes et ca_brut de chaque œuvre depuis TOUTES ses lignes de
 * commande. La vue drop_pnl (basée sur oeuvres.nb_ventes/ca_brut) reste ainsi
 * synchrone avec les commandes réelles.
 */
async function syncOeuvresSales(supabase: DbClient, oeuvreIds: string[]) {
  const unique = Array.from(new Set(oeuvreIds.filter(Boolean)));
  for (const oeuvreId of unique) {
    const { data } = await supabase
      .from("order_items")
      .select("quantity, total_price")
      .eq("oeuvre_id", oeuvreId);
    const nb = (data ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0);
    const ca = (data ?? []).reduce((s, r) => s + (r.total_price ?? 0), 0);
    await supabase
      .from("oeuvres")
      .update({ nb_ventes: nb, ca_brut: Math.round(ca * 100) / 100 })
      .eq("id", oeuvreId);
  }
}

export async function saveOrder(
  id: string | null,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  try {
    await assertCanEdit();
    const supabase = createClient();

    const client_name = str(fd, "client_name");
    if (!client_name) return { error: "Le nom du client est obligatoire." };

    const items = parseItems(fd);
    const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

    const order_number =
      str(fd, "order_number") ?? `CMD-${Date.now().toString().slice(-6)}`;

    const fields = {
      order_number,
      client_name,
      client_email: str(fd, "client_email"),
      client_address: str(fd, "client_address"),
      drop_id: str(fd, "drop_id"),
      wave: str(fd, "wave"),
      status: str(fd, "status") ?? "en attente",
      tracking_number: str(fd, "tracking_number"),
      total_amount: total,
    };

    const affected = new Set(items.map((i) => i.oeuvre_id));

    let orderId = id;
    if (orderId) {
      const { error } = await supabase
        .from("orders")
        .update(fields as TablesUpdate<"orders">)
        .eq("id", orderId);
      if (error) throw error;
      // Les anciennes œuvres sont aussi à resynchroniser
      const { data: old } = await supabase
        .from("order_items")
        .select("oeuvre_id")
        .eq("order_id", orderId);
      for (const o of old ?? []) affected.add(o.oeuvre_id);
      await supabase.from("order_items").delete().eq("order_id", orderId);
    } else {
      const { data, error } = await supabase
        .from("orders")
        .insert(fields as TablesInsert<"orders">)
        .select("id")
        .single();
      if (error) throw error;
      orderId = data.id;
    }

    if (items.length) {
      const rows: TablesInsert<"order_items">[] = items.map((i) => ({
        order_id: orderId!,
        oeuvre_id: i.oeuvre_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: Math.round(i.quantity * i.unit_price * 100) / 100,
      }));
      const { error } = await supabase.from("order_items").insert(rows);
      if (error) throw error;
    }

    await syncOeuvresSales(supabase, Array.from(affected));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }

  revalidatePath("/commandes");
  revalidatePath("/drops");
  if (id) revalidatePath(`/commandes/${id}`);
  return { error: null, ok: true };
}

export async function deleteOrder(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { data: old } = await supabase
    .from("order_items")
    .select("oeuvre_id")
    .eq("order_id", id);
  await supabase.from("order_items").delete().eq("order_id", id);
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
  await syncOeuvresSales(supabase, (old ?? []).map((o) => o.oeuvre_id));
  revalidatePath("/commandes");
  revalidatePath("/drops");
}

/** Change le statut d'une commande (+ date d'expédition si expédié). */
export async function updateOrderStatus(id: string, status: string) {
  await assertCanEdit();
  if (!ORDER_STATUS[status]) throw new Error("Statut invalide.");
  const supabase = createClient();
  const patch: TablesUpdate<"orders"> = { status };
  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath("/commandes");
  revalidatePath(`/commandes/${id}`);
}

/** Passe toutes les commandes d'une vague à un statut donné. */
export async function markWaveStatus(wave: string, status: string) {
  await assertCanEdit();
  if (!ORDER_STATUS[status]) throw new Error("Statut invalide.");
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status } as TablesUpdate<"orders">)
    .eq("wave", wave);
  if (error) throw error;
  revalidatePath("/commandes");
}
