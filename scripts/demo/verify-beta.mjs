#!/usr/bin/env node
/**
 * The LIVE beta's executable predicate: exit 0 <=> every guided-tour route
 * renders, signed in as its own persona, against the deployed beta host.
 *
 * This is the live sibling of verify-snapshot.mjs, and it exists for the same
 * reason: a broken route still answers HTTP 200 with the error as text inside
 * the page, so nothing cheaper can see the failure. What it uniquely catches
 * on a hosted deploy:
 *   - the tour compiled OUT of the bundle (NEXT_PUBLIC_STYX_GUIDED_TOUR unset
 *     at build time) — asserted via [data-guided-tour] on every route;
 *   - API calls failing through the /api rewrite (un-baked NEXT_PUBLIC_API_URL,
 *     dead upstream, broken auth) — any /api response >= 400 is a failure;
 *   - personas whose seeded password does not match BETA_DEMO_PASSWORD — the
 *     login itself is part of the predicate.
 *
 * Usage: STYX_BETA_WEB_URL=<url> STYX_DEMO_PASSWORD=<pw> node scripts/demo/verify-beta.mjs
 * Log hygiene: runs in public Actions logs — the URL and password come from
 * masked secrets and are never interpolated into output here.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const registryPath = path.join(repoRoot, "src/web/lib/guided-tour/registry.ts");

const BASE = (process.env.STYX_BETA_WEB_URL || "").replace(/\/$/, "");
const PASSWORD = process.env.STYX_DEMO_PASSWORD; // allow-secret: synthetic seed credential
if (!BASE) throw new Error("STYX_BETA_WEB_URL must be set.");
if (!PASSWORD) throw new Error("STYX_DEMO_PASSWORD must be set.");

const PERSONA_ACCOUNTS = {
  river: "river@demo.styx.protocol",
  moira: "dr.moira@demo.styx.protocol",
  hr: "hr.lead@acheron.example",
  alecto: "alecto@demo.styx.protocol",
  sage: "sage@demo.styx.protocol",
};

// Same concrete ids the export and the fixtures use — the seeded rows.
const CONCRETE = {
  "[id]": "c1000000-0000-0000-0000-000000000001",
  "[slug]": "recovery-abstinence",
  "[linkId]": "demo",
};
const concretise = (route) => route.replace(/\[[^\]]+\]/g, (segment) => CONCRETE[segment] ?? "demo");

const source = await readFile(registryPath, "utf8");
const routes = [...source.matchAll(/\{\s*path:\s*"([^"]+)"[\s\S]*?persona:\s*"([^"]+)"/g)].map(
  (match) => ({ path: match[1], persona: match[2] }),
);
if (!routes.length) throw new Error("no routes parsed from the guided-tour registry.");

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });

const failures = [];
const skipped = [];
let swept = 0;

// Group by effective persona so each account logs in exactly once. "none"
// routes are public but render inside a session; river has the widest data.
const groups = new Map();
for (const route of routes) {
  const persona = route.persona === "none" ? "river" : route.persona;
  if (!groups.has(persona)) groups.set(persona, []);
  groups.get(persona).push(route);
}

for (const [persona, personaRoutes] of groups) {
  const email = PERSONA_ACCOUNTS[persona];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // This sweep is automation: keep it out of the live feedback report, exactly
  // like every other browser-driving script in scripts/demo/.
  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    ["styx.guidedTour.telemetry", "off"],
  );

  // POST /auth/login is throttled at 5 per 60s per IP; five personas is right
  // at the edge, so pace 429s instead of failing half way through.
  let loggedIn = false;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await context.request.post(`${BASE}/api/auth/login`, {
      data: { email, password: PASSWORD }, // allow-secret: synthetic seed credential
    });
    if (response.status() === 429) {
      console.log(`  login throttled for ${persona}; waiting 21s ...`);
      await new Promise((resolve) => setTimeout(resolve, 21_000));
      continue;
    }
    if (!response.ok()) {
      failures.push({
        route: "(login)",
        persona,
        problems: [`login as ${email} returned HTTP ${response.status()} — seeded password does not match BETA_DEMO_PASSWORD, or the account is not seeded`],
      });
      break;
    }
    loggedIn = true;
    break;
  }
  if (!loggedIn) {
    await context.close();
    continue;
  }

  const page = await context.newPage();
  for (const route of personaRoutes) {
    // The whistleblower route is live since #892's fix: the dynamic segment
    // directory was literally named %5BlinkId%5D (URL-encoded brackets), so
    // Next served it as a static segment and every concrete id 404'd; the
    // seed now also provides the 'demo' bounty link, so the sweep covers it
    // like any other route.
    const apiErrors = new Set();
    const onResponse = (response) => {
      const url = new URL(response.url());
      if (url.origin !== BASE) return;
      if (!url.pathname.startsWith("/api/")) return;
      // /api/auth/refresh 401s legitimately when there is nothing to refresh.
      if (url.pathname === "/api/auth/refresh") return;
      // /api/auth/csrf is throttled at 5/min per IP and refetched on navigation;
      // a 429 on re-issue is benign (the login-time CSRF cookie stays valid) and
      // ANY fast navigation trips it — a sweep most of all.
      if (url.pathname === "/api/auth/csrf" && response.status() === 429) return;
      if (response.status() >= 400) apiErrors.add(`${url.pathname} -> ${response.status()}`);
    };
    page.on("response", onResponse);

    let target = `${BASE}${concretise(route.path)}`;
    let settled = true;
    let mainStatus = 0;
    try {
      const main = await page.goto(target, { waitUntil: "networkidle", timeout: 30_000 });
      mainStatus = main ? main.status() : 0;
      await page.waitForTimeout(400);
    } catch {
      settled = false;
    }

    const { chars, tourPresent } = await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll("[data-guided-tour]").forEach((node) => node.remove());
      return {
        chars: (clone.textContent || "").replace(/\s+/g, " ").trim().length,
        tourPresent: Boolean(document.querySelector("[data-guided-tour]")),
      };
    }).catch(() => ({ chars: 0, tourPresent: false }));

    const problems = [];
    if (mainStatus && (mainStatus < 200 || mainStatus >= 400)) problems.push(`page answered HTTP ${mainStatus}`);
    if (!settled) problems.push("never reached networkidle");
    if (apiErrors.size) problems.push(`API errors through the rewrite: ${[...apiErrors].join(", ")}`);
    if (chars < 200) problems.push(`rendered almost nothing (${chars} chars outside the tour panel)`);
    if (!tourPresent) problems.push("no [data-guided-tour] element — the tour is compiled out of this build");

    if (problems.length) failures.push({ route: route.path, persona, problems });
    swept += 1;
    page.off("response", onResponse);
  }

  await page.close();
  await context.close();
}

await browser.close();

console.log(`Swept ${swept} route(s) across ${groups.size} persona session(s).`);
for (const entry of skipped) console.log(`  SKIPPED: ${entry}`);
if (failures.length) {
  console.log(`FAIL: ${failures.length} route(s) broken on the live beta:`);
  for (const failure of failures) {
    console.log(`  ${failure.route} [${failure.persona}]`);
    for (const problem of failure.problems) console.log(`      - ${problem}`);
  }
  process.exit(1);
}
console.log(`PASS: all ${swept} swept routes render signed-in with the tour present and no API errors (${skipped.length} named skip(s)).`);
