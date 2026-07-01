import type { ModuleKey } from "@/lib/auth/permissions";
import {
  DashboardIcon,
  ProspectionIcon,
  ArtistesIcon,
  DropsIcon,
  CommandesIcon,
  FinancesIcon,
  ChargesIcon,
  ParametresIcon,
} from "./icons";

export type NavItem = {
  key: ModuleKey;
  label: string;
  href: string;
  Icon: (p: { className?: string }) => JSX.Element;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/** Arborescence complète (filtrée par rôle au rendu). */
export const NAV: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/", Icon: DashboardIcon },
    ],
  },
  {
    title: "Pipeline",
    items: [
      {
        key: "prospection",
        label: "Prospection",
        href: "/prospection",
        Icon: ProspectionIcon,
      },
      {
        key: "artistes",
        label: "Artistes",
        href: "/artistes",
        Icon: ArtistesIcon,
      },
    ],
  },
  {
    title: "Produit",
    items: [
      { key: "drops", label: "Drops & Œuvres", href: "/drops", Icon: DropsIcon },
      {
        key: "commandes",
        label: "Commandes",
        href: "/commandes",
        Icon: CommandesIcon,
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        key: "finances",
        label: "Finances",
        href: "/finances",
        Icon: FinancesIcon,
      },
      { key: "charges", label: "Charges", href: "/charges", Icon: ChargesIcon },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        key: "parametres",
        label: "Paramètres",
        href: "/parametres",
        Icon: ParametresIcon,
      },
    ],
  },
];
