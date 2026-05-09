import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          navy: "#25476E",
          cyan: "#33EFFF",
          ball: "#CCFF00",
          grey: "#D9D9D9",
          ink: "#07111C",
          panel: "#102A43",
          mist: "#EAF6FA"
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
