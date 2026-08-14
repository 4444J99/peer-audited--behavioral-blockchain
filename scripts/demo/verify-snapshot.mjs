#!/usr/bin/env node
/**
 * The snapshot's executable predicate. Exit 0 <=> every route in the guided-tour
 * registry renders from captured fixtures with no backend behind it.
 *
 * WHY A SWEEP AND NOT A BUILD CHECK.
 *
 * The snapshot's failure mode is invisible to everything cheaper. A broken route
 * still builds, still exports an HTML file, and still answers HTTP 200 -- the
 * error is text *inside* the page. Verifying that the export exists, or that
 * `/tour` looks right, proves nothing about the other 47 routes.
 *
 * That is not hypothetical: shipping interception in `api-client.ts` alone left
 * 8 of 48 routes issuing real `/api` calls (they use hand-rolled `fetch`), so a
 * remote viewer opening `/practitioner` or `/realms` got "API 404" while every
 * gate stayed green.
 *
 * Two things fail this predicate:
 *   1. Any same-origin `/api/*` request. On a static host it can only 404.
 *   2. Any cross-origin request. The static snapshot must be self-contained; the
 *      LAN feedback collector in particular does not exist behind a pages.dev
 *      origin, and aiming viewers at it is mixed-content noise at best.
 *
 * Usage: node scripts/demo/verify-snapshot.mjs <base-url>
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const registryPath = path.join(repoRoot, "src/web/lib/guided-tour/registry.ts");

const BASE = (process.argv[2] || "http://127.0.0.1:4316").replace(/\/$/, "");

// Concrete ids for dynamic segments -- the same ones the export pre-renders, so
// the sweep visits pages that actually exist rather than reporting phantom holes.
const CONCRETE = {
  "[id]": "c1000000-0000-0000-0000-000000000001",
  "[slug]": "recovery-abstinence",
  "[linkId]": "demo",
};
const concretise = (route) => route.replace(/\[[^\]]+\]/g, (segment) => CONCRETE[segment] ?? "demo");

/**
 * Off-origin hosts that are a deliberate part of the app, not a backend.
 *
 * Kept as a narrow allow-list rather than relaxing the rule, because the whole
 * point of the off-origin check is to catch things like the LAN feedback
 * collector -- a host that exists on the presenter's machine and nowhere else.
 *
 * cdnjs: /pitch loads a decorative font for its p5 sketches
 * (components/PitchDeck/ui/slides/p5Sketches.ts). Pre-existing app behaviour,
 * and it degrades to a default font rather than breaking the slide -- but it does
 * mean /pitch is the one route that is not fully offline-capable.
 */
const ALLOWED_OFF_ORIGIN = new Set(["https://cdnjs.cloudflare.com"]);

const source = await readFile(registryPath, "utf8");
const routes = [...source.matchAll(/\{\s*path:\s*"([^"]+)"[\s\S]*?persona:\s*"([^"]+)"/g)].map(
  (match) => ({ path: match[1], persona: match[2] }),
);
if (!routes.length) throw new Error("no routes parsed from the guided-tour registry.");

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });

const failures = [];
let swept = 0;

for (const route of routes) {
  // A "none" route is public, but it still renders inside a persona's session;
  // river is the persona with the widest fixture set.
  const persona = route.persona === "none" ? "river" : route.persona;
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(
    ([personaKey, personaValue, optOutKey]) => {
      window.localStorage.setItem(personaKey, personaValue);
      // Belt and braces: a snapshot build already suppresses telemetry, and this
      // sweep asserts that. Setting the opt-out too means the sweep cannot pollute
      // the presenter's report even if it is ever pointed at a live demo.
      window.localStorage.setItem(optOutKey, "off");
    },
    ["styx.snapshot.persona", persona, "styx.guidedTour.telemetry"],
  );
  const page = await context.newPage();

  const apiCalls = new Set();
  const offOrigin = new Set();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== BASE) {
      if (!ALLOWED_OFF_ORIGIN.has(url.origin)) offOrigin.add(url.origin);
      return;
    }
    if (url.pathname.startsWith("/api/")) apiCalls.add(url.pathname);
  });

  let target = `${BASE}${concretise(route.path)}`;
  if (!target.endsWith("/")) target += "/"; // the export builds with trailingSlash

  let settled = true;
  try {
    await page.goto(target, { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(400);
  } catch {
    settled = false;
  }

  // Strip the tour panel before measuring: it describes every route, so a page
  // that rendered nothing still carries plenty of the panel's text.
  const chars = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("[data-guided-tour]").forEach((node) => node.remove());
    return (clone.textContent || "").replace(/\s+/g, " ").trim().length;
  });

  // Endpoints the snapshot layer was asked for and had no fixture for. Checking
  // the screen instead would miss these: a page that catches its own error and
  // renders zeros looks completely healthy.
  const misses = await page.evaluate(() => window.__STYX_SNAPSHOT_MISSES__ || []);

  const problems = [];
  if (apiCalls.size) problems.push(`hit the API: ${[...apiCalls].join(", ")}`);
  if (offOrigin.size) problems.push(`called off-origin: ${[...offOrigin].join(", ")}`);
  if (!settled) problems.push("never reached networkidle");
  if (chars < 200) problems.push(`rendered almost nothing (${chars} chars outside the tour panel)`);
  if (misses.length) problems.push(`no fixture captured for: ${[...new Set(misses)].join(", ")}`);

  if (problems.length) failures.push({ route: route.path, persona, problems });
  swept += 1;

  await page.close();
  await context.close();
}

await browser.close();

console.log(`Swept ${swept} route(s) against ${BASE}.`);
if (failures.length) {
  console.log(`FAIL: ${failures.length} route(s) are not self-contained:`);
  for (const failure of failures) {
    console.log(`  ${failure.route} [${failure.persona}]`);
    for (const problem of failure.problems) console.log(`      - ${problem}`);
  }
  console.log("");
  console.log("A route that reaches for /api needs its client routed through the snapshot");
  console.log("layer (src/web/services/snapshot-fetch.ts patches fetch for exactly this).");
  console.log("");
  console.log("A route with NO FIXTURE is the more interesting failure: the capture only");
  console.log("records 2xx responses, so a missing fixture usually means that endpoint is");
  console.log("broken on the live demo. Probe it directly before re-capturing -- this check");
  console.log("is how a permanently-403 admin route and a 500-ing behavioral query were found.");
  console.log("  npm run demo:reset:verify && npm run snapshot:capture");
  process.exit(1);
}
console.log(`PASS: all ${swept} routes render from fixtures with no backend and no off-origin calls.`);
