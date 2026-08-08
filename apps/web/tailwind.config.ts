import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "var(--bg-base)",
        "bg-surface": "var(--bg-surface)",
        "bg-surface-2": "var(--bg-surface-2)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "accent-live": "var(--accent-live)",
        "accent-dead": "var(--accent-dead)",
        "accent-data": "var(--accent-data)",
        "accent-data-dim": "var(--accent-data-dim)",
        "grid-line": "var(--grid-line)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        serif: ["var(--font-serif)", "serif"],
      },
      backgroundImage: {
        "grid-paper":
          "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-40": "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
