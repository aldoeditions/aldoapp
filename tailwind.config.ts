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
        // — Palette projet (source de vérité) —
        bg: "#F7F6F3",
        surface: "#FFFFFF",
        border: "#E8E5DF",
        text: "#1a1a1a",
        muted: "#8A8780",
        accent: "#0627b7",
        accentBg: "#EEF0FF",
        success: "#2D7A4F",
        successBg: "#E9F5EE",
        warning: "#C07A1A",
        warningBg: "#FFF6E8",
        danger: "#C4342D",
        dangerBg: "#FFEFEE",
        // — Tokens techniques complémentaires (UI) —
        sidebar: "#1a1a1a",
        accentHover: "#041d8c",
        faint: "#B0ADA4", // gris clair pour libellés discrets
        neutralBg: "#EFEEEB", // fond des badges neutres « à demander »
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", '"Times New Roman"', "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26, 26, 26, 0.04)",
        float: "0 4px 16px rgba(26, 26, 26, 0.08)",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
