import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgb(15 23 42 / 0.45)",
        panel: "0 1px 2px rgb(15 23 42 / 0.06), 0 10px 32px -28px rgb(15 23 42 / 0.5)",
      },
      fontFamily: {
        sans: [
          "Vazirmatn",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        fa: ["Vazirmatn", "Tahoma", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
