import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Cinzel", "Georgia", "serif"],
        serif: ["var(--font-serif)", "Prata", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#535353",
        muted: "#919295",
        faint: "#b5b8ba",
        border: "#e0ddd8",
        gold: "#C9A96E",
      },
      letterSpacing: {
        widest: "0.2em",
      },
    },
  },
  plugins: [],
} satisfies Config;
