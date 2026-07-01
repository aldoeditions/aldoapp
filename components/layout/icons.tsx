/** Jeu d'icônes outline (24px, stroke 1.6) pour la navigation. */

type IconProps = { className?: string };

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function ProspectionIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ArtistesIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M17 8.5a3 3 0 0 1 0 5.4M19 19a5 5 0 0 0-2.5-4.3" />
    </svg>
  );
}

export function DropsIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <path d="M12 3s5.5 5.5 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 8.5 12 3 12 3Z" />
    </svg>
  );
}

export function CommandesIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <path d="M3 4h2l2 12h11l2-8H6" />
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
}

export function FinancesIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6M20 16v-2" />
    </svg>
  );
}

export function ChargesIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <path d="M12 2v20M17 5.5C17 4 14.8 3 12 3S7 4 7 5.8C7 9.5 17 8 17 12c0 1.8-2.2 3-5 3s-5-1-5-2.6" />
    </svg>
  );
}

export function ParametresIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

export function LogoutIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M10 12H3m0 0 3-3m-3 3 3 3" />
    </svg>
  );
}
