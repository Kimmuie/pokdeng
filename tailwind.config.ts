import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Anuphan", "Noto Sans Thai", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        felt: { 950: "#08190f", 900: "#0c2218", 800: "#10291d", 700: "#17402c", 600: "#1d5a3f", 500: "#2f7a52" },
        gold: { 300: "#f6d98a", 400: "#f0c24f", 500: "#e0a83a", 600: "#c98f26" },
        ink: { DEFAULT: "#e6efe8", muted: "#9fb5a8", dim: "#6f877a" },
        win: "#46d39a",
        lose: "#f0627a",
      },
    },
  },
  plugins: [],
};
export default config;
