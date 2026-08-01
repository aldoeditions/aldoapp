/** Handle @xxx affichable, depuis une URL Instagram complète ou un handle brut. */
export function igHandle(v: string | null | undefined): string {
  if (!v) return "";
  const m = v.match(/instagram\.com\/([^/?#]+)/i);
  return "@" + (m ? m[1] : v).replace(/^@/, "").replace(/\/$/, "");
}

/** URL Instagram cliquable, depuis une URL complète ou un handle brut. */
export function igUrl(v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}
