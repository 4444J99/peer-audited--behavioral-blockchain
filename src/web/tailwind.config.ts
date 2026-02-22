import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/web/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/web/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // For cases where it might use relative root
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
