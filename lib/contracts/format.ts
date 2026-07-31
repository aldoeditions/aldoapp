/* Helpers de formatage pour le contrat (dates FR, nombres en lettres, IBAN). */

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « 2026-05-01 » → « 1er mai 2026 » (1er pour le 1er du mois, sinon « 5 mai 2026 »). */
export function dateFrLongue(dateStr: string | null): string {
  if (!dateStr) return "—";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  const [, y, mm, dd] = m;
  const jour = parseInt(dd, 10);
  const mois = MOIS_FR[parseInt(mm, 10) - 1] ?? "";
  const jourTxt = jour === 1 ? "1er" : String(jour);
  return `${jourTxt} ${mois} ${y}`;
}

/** « 1995-10-25 » → « 25/10/1995 ». Accepte aussi un Date. */
export function dateJjMmAaaa(input: string | Date | null): string {
  if (!input) return "—";
  if (input instanceof Date) {
    const dd = String(input.getDate()).padStart(2, "0");
    const mm = String(input.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${input.getFullYear()}`;
  }
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return input;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/* --- Nombre entier en toutes lettres (français), 0..100 suffisent ici. --- */
const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const TENS: Record<number, string> = {
  2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante",
};

/** Entier 0..100 en toutes lettres françaises (ex. 30 → « trente »). */
export function nombreEnLettres(n: number): string {
  const x = Math.round(n);
  if (x < 0) return String(x);
  if (x < 20) return UNITS[x];
  if (x === 100) return "cent";

  const d = Math.floor(x / 10);
  const u = x % 10;

  if (d === 7 || d === 9) {
    // soixante-dix… / quatre-vingt-dix…
    const base = d === 7 ? "soixante" : "quatre-vingt";
    const reste = UNITS[10 + u]; // dix..dix-neuf
    if (d === 7 && u === 1) return "soixante et onze";
    return `${base}-${reste}`;
  }

  const base = d === 8 ? "quatre-vingt" : TENS[d];
  if (u === 0) return d === 8 ? "quatre-vingts" : base;
  if (u === 1 && d !== 8) return `${base} et un`;
  return `${base}-${UNITS[u]}`;
}

/** IBAN masqué : ne garde que les 4 derniers caractères. « •••• •••• 0567 ». */
export function ibanMasque(iban: string | null | undefined): string {
  if (!iban) return "—";
  const compact = iban.replace(/\s+/g, "");
  if (compact.length <= 4) return compact;
  const last4 = compact.slice(-4);
  const hidden = "•".repeat(Math.max(0, compact.length - 4));
  return `${hidden}${last4}`.replace(/(.{4})/g, "$1 ").trim();
}

/** IBAN formaté par groupes de 4 (affichage complet dans le PDF). */
export function ibanGroupe(iban: string | null | undefined): string {
  if (!iban) return "—";
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}
