import sharp from "sharp";

/**
 * Réduit une image pour un APERÇU web léger : max 1600px (côté le plus long),
 * JPEG qualité 78. Une image HD de plusieurs Mo tombe typiquement à ~100–400 Ko.
 * Renvoie toujours du JPEG (contentType image/jpeg, extension .jpg).
 */
export async function downscalePreview(input: Buffer, max = 1600): Promise<Buffer> {
  return sharp(input)
    .rotate() // respecte l'orientation EXIF
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}
