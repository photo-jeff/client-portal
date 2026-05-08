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
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        charcoal: "#1a1a1a",
        stone: "#888888",
        border: "#e0ddd8",
        cream: "#faf9f7",
      },
      letterSpacing: {
        widest: "0.2em",
      },
    },
  },
  plugins: [],
} satisfies Config;
