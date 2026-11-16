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
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C96B",
          dark: "#9B7B2E",
        },
        bg: {
          primary: "#0A0A0F",
          secondary: "#0F0F1A",
          card: "#12121E",
        },
        border: {
          DEFAULT: "#1E1E35",
          gold: "rgba(201,168,76,0.3)",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "gradient": "gradient-shift 4s ease infinite",
        "fade-in-up": "fadeInUp 0.6s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
