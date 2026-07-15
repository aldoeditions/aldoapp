import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_BUCKET = "artist-assets";
const PRIVATE_BUCKET = "artist-files";

/**
 * Recopie un fichier déposé (bucket privé) en VISUEL public de l'œuvre, si
 * c'est une image. Best-effort : n'échoue jamais l'appelant. Le master HD, lui,
 * reste dans le bucket privé — ceci ne crée qu'un aperçu web.
 */
export async function syncOeuvreVisuel(
  oeuvreId: string,
  filePath: string,
  filename: string | null,
  mime: string | null,
): Promise<void> {
  if (!(mime ?? "").startsWith("image/")) return;
  try {
    const admin = createAdminClient();
    const { data: blob } = await admin.storage.from(PRIVATE_BUCKET).download(filePath);
    if (!blob) return;

    const ext = (filename?.split(".").pop() || "jpg").toLowerCase();
    const dest = `oeuvres/${oeuvreId}/visuel-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const up = await admin.storage.from(PUBLIC_BUCKET).upload(dest, bytes, {
      contentType: mime ?? undefined,
      upsert: true,
    });
    if (up.error) return;

    const url = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(dest).data.publicUrl;
    const supabase = createClient();
    await supabase.from("oeuvres").update({ file_url: url }).eq("id", oeuvreId);
  } catch {
    /* aperçu non bloquant */
  }
}
