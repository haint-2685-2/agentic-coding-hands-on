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
        "saa-header": "rgba(11, 15, 18, 0.8)",
        "saa-cta": "rgba(255, 234, 158, 1)",
        "saa-cta-foreground": "rgba(0, 16, 26, 1)",
        "saa-divider": "#2E3940",
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
