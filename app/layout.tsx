import type { Metadata } from "next";
import { Archivo_Black, Azeret_Mono } from "next/font/google";
import "./globals.css";

// Titres : substitut à « BN Mighty » (lourde, géométrique, poster).
const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// Corps : Azeret Mono (identité Aldo).
const mono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
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
    <html lang="fr" className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
