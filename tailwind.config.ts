import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-section": "#EFF7F8",
        "bg-dark": "#0C1A1D",
        accent: "#26A1B0",
        "accent-hover": "#1D8898",
        border: "#C8E4E8",
        "text-muted": "#607A80",
        "text-on-dark": "#FFFFFF",
        "wa-green": "#25D366",
        "wa-hover": "#1DA851",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "var(--font-noto-sc)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "var(--font-noto-sc)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
