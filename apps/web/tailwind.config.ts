import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cine: {
          bg: "rgb(var(--cine-bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--cine-surface-rgb) / <alpha-value>)",
          card: "rgb(var(--cine-card-rgb) / <alpha-value>)",
          border: "rgb(var(--cine-border-rgb) / <alpha-value>)",
          accent: "rgb(var(--cine-accent-rgb) / <alpha-value>)",
          rose: "#EC4899",
          emerald: "#10B981",
          amber: "#F59E0B",
          text: "rgb(var(--cine-text-rgb) / <alpha-value>)",
          muted: "rgb(var(--cine-muted-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
