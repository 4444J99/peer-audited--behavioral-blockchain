import type { Config } from "tailwindcss";

// Tailwind v4 keeps `content` detection but moves theme tokens into CSS.
// The `background`/`foreground` colors that lived in `theme.extend` here are
// now declared in `app/globals.css` as an `@theme inline` block — utilities
// (`bg-background`, `text-foreground`) are generated from that live source,
// not from a static config that can silently go stale.
const config: Config = {
  content: [
    "./src/web/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/web/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // For cases where it might use relative root
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
};
export default config;
