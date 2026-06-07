import { defineConfig, devices } from "@playwright/test";
import { join } from "path";

// This config lives in .config/playwright/ (Minimal-Root convention) but the
// specs it runs (e2e/) and the web server it boots (src/web/) live at the repo
// root. Playwright resolves a relative testDir/webServer.cwd against the config
// file's own directory (.config/playwright/), which would point at the wrong
// place. The CLI is always invoked from the repo root — the --config path is
// itself repo-root-relative — so anchor both to process.cwd() as absolute
// paths. (No import.meta/__dirname: Playwright's config loader rejects that
// dual idiom with "exports is not defined in ES module scope".)
const repoRoot = process.cwd();

function requireWebUrl(): string {
  const webUrl =
    process.env.E2E_BASE_URL ||
    process.env.STYX_WEB_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_WEB_URL;
  if (!webUrl) {
    throw new Error(
      "E2E_BASE_URL, STYX_WEB_PUBLIC_URL, or NEXT_PUBLIC_WEB_URL is required.",
    );
  }
  // Trim trailing slashes without a regex: /\/+$/ backtracks polynomially
  // on untrusted input (CodeQL js/polynomial-redos).
  let end = webUrl.length;
  while (end > 0 && webUrl[end - 1] === "/") end--;
  return webUrl.slice(0, end);
}

function portFromUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  if (parsed.port) return parsed.port;
  if (parsed.protocol === "https:") return "443";
  if (parsed.protocol === "http:") return "80";
  throw new Error("Playwright base URL must use http or https.");
}

const webUrl = requireWebUrl();
const webPort = process.env.STYX_WEB_PORT || portFromUrl(webUrl);

export default defineConfig({
  testDir: join(repoRoot, "e2e"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: webUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: process.env.CI ? `npm run start -- -p ${webPort}` : "npm run dev",
    cwd: join(repoRoot, "src/web"),
    url: webUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
