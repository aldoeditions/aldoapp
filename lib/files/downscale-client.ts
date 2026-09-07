/**
 * Réduit une image DANS LE NAVIGATEUR avant envoi (évite le 413 des Server
 * Actions, limitées à ~1 Mo). Sortie JPEG ~1600px : typiquement 100–300 Ko.
 * Utilisé par les formulaires client ; repli sur le fichier d'origine si échec.
 */
export async function downscaleImageFile(
  file: File,
  max = 1600,
  quality = 0.85,
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);

    const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * ratio));
    const h = Math.max(1, Math.round(bitmap.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "visuel";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // repli : on renvoie le fichier tel quel
  }
}
