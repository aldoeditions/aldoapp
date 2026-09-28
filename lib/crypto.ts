import "server-only";
import crypto from "node:crypto";

/**
 * Chiffrement au repos des données sensibles (n° de sécurité sociale).
 * AES-256-GCM. La clé vient de la variable d'environnement ARTIST_DATA_KEY
 * (32 octets en base64 ou hex, jamais commitée). Format stocké :
 *   base64(iv[12] || authTag[16] || ciphertext)
 *
 * Générer une clé :  openssl rand -base64 32
 * → à mettre dans .env.local et dans les variables Vercel (ARTIST_DATA_KEY).
 */

function getKey(): Buffer {
  const raw = process.env.ARTIST_DATA_KEY;
  if (!raw) throw new Error("ARTIST_DATA_KEY manquante (clé de chiffrement).");
  // Accepte base64 (44 car.) ou hex (64 car.).
  const key = /^[0-9a-fA-F]{64}$/.test(raw.trim())
    ? Buffer.from(raw.trim(), "hex")
    : Buffer.from(raw.trim(), "base64");
  if (key.length !== 32) {
    throw new Error("ARTIST_DATA_KEY invalide : 32 octets attendus (AES-256).");
  }
  return key;
}

/** Chiffre une chaîne. Renvoie null pour une valeur vide. */
export function encryptSensitive(plain: string | null | undefined): string | null {
  const value = (plain ?? "").trim();
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/** Déchiffre une valeur produite par encryptSensitive. Null si vide/illisible. */
export function decryptSensitive(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    const buf = Buffer.from(stored, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** 4 derniers chiffres (pour l'affichage masqué), à stocker en clair à côté du chiffré. */
export function last4(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

/** Rendu masqué type «•••• •••• •••• 1234 » à partir des 4 derniers chiffres. */
export function maskFromLast4(l4: string | null | undefined): string {
  return l4 ? `•••• •••• ••• ${l4}` : "—";
}
