import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // — Palette Aldo —
        bg: "#F4F5FB", // fond clair légèrement bleuté
        surface: "#FFFFFF",
        border: "#E4E6F2",
        text: "#1C1C1F", // noir Aldo
        muted: "#5D5F70",
        accent: "#0627B7", // bleu Aldo
        accentBg: "#EAECFB",
        success: "#1E7A4C",
        successBg: "#E4F3EB",
        warning: "#B4690E",
        warningBg: "#FBEFE1",
        danger: "#C4342D",
        dangerBg: "#FBEAE8",
        // — Tokens techniques —
        sidebar: "#1C1C1F",
        accentHover: "#041D8C",
        faint: "#A0A2B4",
        neutralBg: "#ECEDF5",
      },
      fontFamily: {
        // « serif » = police d'affichage (titres) — nom conservé pour ne pas
        // toucher tous les composants ; « sans » = Azeret Mono (corps).
        serif: ["var(--font-display)", "Archivo Black", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Archivo Black", "system-ui", "sans-serif"],
        sans: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 28, 31, 0.05)",
        float: "0 8px 28px rgba(6, 39, 183, 0.12)",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
