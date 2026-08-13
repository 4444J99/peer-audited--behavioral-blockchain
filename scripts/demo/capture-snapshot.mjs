#!/usr/bin/env node
/**
 * Captures the API fixtures the Cloudflare snapshot serves.
 *
 * It drives the REAL local demo in a browser, as each synthetic persona, and records
 * every /api response the app actually makes. Recording what the app requests -- rather
 * than guessing endpoints from the API surface -- is the whole point: a hand-written
 * fixture set drifts silently and produces a plausible, wrong screen, which is the
 * worst thing a demo can do.
 *
 * Run it against a demo that has just passed its gate; the fixtures inherit whatever
 * that run was showing, so they are only as honest as the run that produced them.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const outDir = path.join(repoRoot, "src/web/public/demo-snapshot");
const registryPath = path.join(repoRoot, "src/web/lib/guided-tour/registry.ts");

const webBase = process.env.STYX_DEMO_WEB_URL;
const demoPassword = process.env.STYX_DEMO_PASSWORD; // allow-secret: synthetic seed credential
if (!webBase) throw new Error("STYX_DEMO_WEB_URL must be set.");
if (!demoPassword) throw new Error("STYX_DEMO_PASSWORD must be set.");

const PERSONAS = {
  river: "river@demo.styx.protocol",
  moira: "dr.moira@demo.styx.protocol",
  hr: "hr.lead@acheron.example",
  alecto: "alecto@demo.styx.protocol",
  sage: "sage@demo.styx.protocol",
};

/** Reads route + persona pairs straight out of the tour registry, so coverage tracks it. */
async function readRegistryRoutes() {
  const source = await readFile(registryPath, "utf8");
  const entries = [];
  const blocks = source.split(/\n\s*\{\s*\n/);
  for (const block of blocks) {
    const routePath = block.match(/^\s*path:\s*"([^"]+)"/m)?.[1];
    const persona = block.match(/^\s*persona:\s*"([^"]+)"/m)?.[1];
    if (routePath && persona) entries.push({ path: routePath, persona });
  }
  return entries;
}

const registryRoutes = await readRegistryRoutes();
if (!registryRoutes.length) throw new Error("no routes parsed from the guided-tour registry.");

// Dynamic segments are exported with concrete synthetic ids; visit the same ones so the
// fixtures match the pages that actually exist in the export.
const CONCRETE = {
  "[id]": "c1000000-0000-0000-0000-000000000001",
  "[slug]": "recovery-abstinence",
  "[linkId]": "demo",
};
const concretise = (route) =>
  route.replace(/\[[^\]]+\]/g, (segment) => CONCRETE[segment] ?? "demo");

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });

await mkdir(outDir, { recursive: true });
const written = [];

for (const [persona, email] of Object.entries(PERSONAS)) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // POST /auth/login is throttled at 5 per 60s per IP; five personas is right at the
  // edge, so pace them rather than tripping it half way through a capture.
  let token = "";
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await context.request.post(`${webBase}/api/auth/login`, {
      data: { email, password: demoPassword }, // allow-secret: synthetic seed credential
    });
    if (response.status() === 429) {
      const waitMs = 21000;
      console.log(`  login throttled for ${persona}; waiting ${waitMs / 1000}s ...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }
    if (!response.ok()) throw new Error(`login ${persona}: HTTP ${response.status()}`);
    token = (await response.json()).token; // allow-secret: short-lived synthetic session token
    break;
  }
  if (!token) throw new Error(`login ${persona}: exhausted attempts`);
  await context.addCookies([{ name: "styx_auth_token", value: token, url: webBase }]);

  const fixtures = {};
  let unreadable = 0;
  // Body reads must be started in the handler AND awaited before the next navigation.
  // Playwright discards response bodies once the page navigates away, so an async
  // read left dangling resolves to nothing -- silently, which reads as "the app made
  // no API calls" rather than "the capture raced the navigation".
  let pending = [];
  const page = await context.newPage();
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/api/")) return;
    if (response.request().method() !== "GET") return;
    if (!response.ok()) return; // a failed call is not a fixture
    const apiPath = url.pathname.slice("/api".length) + (url.search || "");
    pending.push(
      response
        .json()
        .then((body) => {
          fixtures[`GET ${apiPath}`] = body;
          const bare = `GET ${url.pathname.slice("/api".length)}`;
          if (!(bare in fixtures)) fixtures[bare] = body;
        })
        .catch(() => {
          unreadable += 1;
        }),
    );
  });

  const drain = async () => {
    const inflight = pending;
    pending = [];
    await Promise.allSettled(inflight);
  };

  const routes = registryRoutes
    .filter((entry) => entry.persona === persona || entry.persona === "none")
    .map((entry) => concretise(entry.path));

  for (const route of routes) {
    try {
      await page.goto(`${webBase}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(600);
    } catch {
      console.log(`  (skipped ${route} — did not settle)`);
    }
    // Before the next navigation, not after the loop.
    await drain();
  }

  await drain();
  await page.close();
  await context.close();

  const file = path.join(outDir, `${persona}.json`);
  await writeFile(file, `${JSON.stringify(fixtures, null, 2)}\n`, "utf8");
  written.push({ persona, routes: routes.length, fixtures: Object.keys(fixtures).length });
  const note = unreadable ? ` (${unreadable} body/bodies unreadable)` : "";
  console.log(`  ${persona}: ${routes.length} routes → ${Object.keys(fixtures).length} fixtures${note}`);
}

await browser.close();

const empty = written.filter((entry) => entry.fixtures === 0);
if (empty.length) {
  // A persona with no fixtures produces a hosted screen full of nothing, which reads
  // as a broken product rather than a missing capture. Refuse to ship that quietly.
  throw new Error(
    `no fixtures captured for: ${empty.map((entry) => entry.persona).join(", ")}.\n` +
      "The usual cause is that the running demo is serving a SNAPSHOT build: a snapshot\n" +
      "build overwrites .next, and its client answers from fixtures instead of calling\n" +
      "/api, so the capture sees no API traffic at all. Confusingly, /api still proxies\n" +
      "correctly, because rewrites were loaded when the server started.\n" +
      "Rebuild the demo normally first:  npm run demo:reset:verify",
  );
}

console.log(`PASS: captured ${written.reduce((sum, e) => sum + e.fixtures, 0)} fixtures into ${outDir}`);
