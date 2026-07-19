import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ask-styx/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    // Inline @testing-library/jest-dom so vitest 4 can resolve
    // its subpath `vitest` import correctly when running from a
    // workspace where the jest-dom package is hoisted to the
    // monorepo root. Without this, vitest 4 reports:
    //   "Cannot find package 'vitest' imported from
    //    @testing-library/jest-dom/dist/vitest.mjs"
    server: {
      deps: {
        inline: ['@testing-library/jest-dom'],
      },
    },
  },
});
