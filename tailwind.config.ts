import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          navy: "var(--court-background)",
          cyan: "var(--court-foreground)",
          ball: "var(--court-ball)",
          grey: "var(--court-grey)",
          ink: "var(--court-ink)",
          panel: "var(--court-panel)",
          mist: "var(--court-mist)"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(0, 0, 0, 0.28)",
        glow: "0 0 36px rgba(204, 255, 0, 0.26)"
      }
    }
  },
  plugins: []
};

export default config;
