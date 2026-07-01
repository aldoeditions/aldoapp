import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
