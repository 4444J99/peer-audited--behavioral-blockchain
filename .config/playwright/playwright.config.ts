import { defineConfig, devices } from '@playwright/test';
import { join } from 'path';

// This config lives in .config/playwright/ (Minimal-Root convention) but the
// specs it runs (e2e/) and the web server it boots (src/web/) live at the repo
// root. Playwright resolves a relative testDir/webServer.cwd against the config
// file's own directory (.config/playwright/), which would point at the wrong
// place. The CLI is always invoked from the repo root — the --config path is
// itself repo-root-relative — so anchor both to process.cwd() as absolute
// paths. (No import.meta/__dirname: Playwright's config loader rejects that
// dual idiom with "exports is not defined in ES module scope".)
const repoRoot = process.cwd();

export default defineConfig({
  testDir: join(repoRoot, 'e2e'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    // `next start` defaults to port 3000; pin it to 3001 to match `url` below
    // (local `next dev -p 3001` already binds 3001). cwd is the web workspace
    // at the repo root, resolved absolutely so it is independent of this
    // config file's location.
    command: process.env.CI ? 'npm run start -- -p 3001' : 'npm run dev',
    cwd: join(repoRoot, 'src/web'),
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
