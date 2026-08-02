import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { downscalePreview } from "@/lib/files/image";

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

    // Downscale → aperçu web léger (JPEG). On ne stocke jamais le HD brut en public.
    const original = Buffer.from(await blob.arrayBuffer());
    const preview = await downscalePreview(original);
    const dest = `oeuvres/${oeuvreId}/visuel-${Date.now()}.jpg`;
    const up = await admin.storage.from(PUBLIC_BUCKET).upload(dest, preview, {
      contentType: "image/jpeg",
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
