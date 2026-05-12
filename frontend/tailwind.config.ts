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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Login screen tokens (from Figma)
        "saa-bg": "rgba(0, 16, 26, 1)",
        "saa-header": "rgba(16, 20, 23, 0.8)",
        "saa-cta": "rgba(255, 234, 158, 1)",
        "saa-cta-foreground": "rgba(0, 16, 26, 1)",
        "saa-divider": "#2E3940",
        // Homepage tokens (from Figma)
        "saa-gold": "#FFEA9E",
        "saa-gold-glow": "#FAE287",
        "saa-border": "#998C5F",
        "saa-danger": "#D4271D",
        "saa-card": "rgba(255, 255, 255, 0.04)",
        // Kudos Live Board tokens (from Figma)
        "saa-kudo-card": "#FFF8E1",
        "saa-kudo-text": "#00101A",
        "saa-kudo-muted": "#999999",
        "saa-kudo-hashtag": "#D4271D",
        "saa-kudo-divider": "#FFEA9E",
        "saa-kudo-msg-bg": "rgba(255, 234, 158, 0.40)",
        "saa-kudo-container": "#00070C",
        "saa-kudo-button-soft": "rgba(255, 234, 158, 0.10)",
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        "montserrat-alternates": [
          "var(--font-montserrat-alternates)",
          "Montserrat Alternates",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
