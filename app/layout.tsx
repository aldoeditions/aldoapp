import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Polices AUTO-HÉBERGÉES (woff2 dans app/fonts) : plus aucune dépendance
// réseau à Google Fonts au build (local & Vercel) → la typo ne « saute »
// plus. Le sous-ensemble latin couvre le français, y compris la ligature œ/Œ.

// Titres : substitut à « BN Mighty » (lourde, géométrique, poster).
const display = localFont({
  src: "./fonts/archivo-black-latin.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

// Corps : DM Sans (police variable 400→700).
const body = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aldo Éditions — Administration",
  description:
    "Plateforme d'administration Aldo Éditions : prospection, drops, commandes et finances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
