#!/usr/bin/env node
/**
 * Records the signed-in rehearsal fallback: the four moments the Jessica runbook
 * table names, in order, each carrying its truth label.
 *
 * Three boundaries this file exists to hold:
 *
 * 1. The synthetic password is never displayed. Sessions are established through
 *    the request client, so no login form is ever rendered and no password field
 *    is focused, filled, or masked on camera. Never add context.tracing.start()
 *    or recordHar here -- both would persist the login request body to disk.
 * 2. Every sign-in happens BEFORE the recorded page is created. POST /auth/login
 *    is throttled at 5 requests per 60s per IP and the live-stack gate that runs
 *    first already spends three of them, so a throttle wait is likely -- it just
 *    must not land in the middle of the recording.
 * 3. /dashboard, /practitioner and /hr do not themselves display truth labels --
 *    only src/web/app/tour/page.tsx does. This script therefore overlays them as
 *    an explicitly-marked REHEARSAL CAPTION rather than implying the product
 *    renders them. The label text is asserted against /tour first, so a caption
 *    can never drift from the source of truth.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const outputDir = path.join(repoRoot, "docs/demo/assets");
const outputPath = path.join(outputDir, "styx-signed-in-rehearsal.mp4");
const recordingDir = mkdtempSync(path.join(tmpdir(), "styx-rehearsal-recording-"));

// The wrapper resolves these from the launcher's own state file. Requiring them
// rather than defaulting avoids the stale-port trap in capture-tour-fallback.mjs,
// whose default (3101) matches neither the Docker nor the native demo.
const webBase = process.env.STYX_DEMO_WEB_URL;
const demoPassword = process.env.STYX_DEMO_PASSWORD;
const demoCommit = process.env.STYX_DEMO_COMMIT || "unknown commit";
if (!webBase) throw new Error("STYX_DEMO_WEB_URL must be set; run npm run demo:capture:rehearsal.");
if (!demoPassword) throw new Error("STYX_DEMO_PASSWORD must be set; run npm run demo:capture:rehearsal.");

const TRUTH = { working: "Working today", beta: "Test-money beta", future: "Future enterprise capability" };
const CAPTION_COLORS = {
  working: { border: "#34d399", background: "#022c22", color: "#6ee7b7" },
  beta: { border: "#fbbf24", background: "#2b1d02", color: "#fcd34d" },
  future: { border: "#38bdf8", background: "#04212e", color: "#7dd3fc" },
};
const CAPTION_HEIGHT = 56;
const RECORDED_ON = new Date().toISOString().slice(0, 10);

const SEGMENTS = [
  {
    email: "river@demo.styx.protocol",
    route: "/dashboard",
    kind: "working",
    heading: "Individual flow — working today",
    lines: [
      "Signing in as river@demo.styx.protocol, a synthetic account.",
      "The session is established off camera, so the local synthetic password is never displayed.",
    ],
    // The signed-in email in the header proves the session is real, and the
    // test-credit heading proves the money boundary is on screen.
    expect: ["river@demo.styx.protocol", "CAPITAL AT RISK (TEST CREDITS)"],
    scrolls: 3,
  },
  {
    email: "dr.moira@demo.styx.protocol",
    route: "/practitioner",
    kind: "working",
    heading: "Coach flow — working today",
    lines: [
      "Signing in as dr.moira@demo.styx.protocol, a synthetic practitioner.",
      "The independent coach is the first buyer in the sales narrative, so this is the route that matters most.",
    ],
    // "Practitioner Console" also appears in the loading state, and the page
    // renders "Practitioner sign-in required" on a 401 rather than failing --
    // so assert a string only the loaded, authenticated console shows.
    expect: ["Composite risk intelligence for assigned clients"],
    scrolls: 3,
  },
  {
    email: "hr.lead@acheron.example",
    route: "/hr",
    kind: "future",
    heading: "Enterprise direction — future capability",
    lines: [
      "Signing in as hr.lead@acheron.example, a synthetic enterprise admin.",
      "This is an aggregate preview of a direction, not a deployed enterprise product.",
    ],
    // /hr is gated at build time by NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI; a web
    // build made outside native.sh renders "Internal Feature Disabled" instead.
    expect: ["Enterprise Group Analytics"],
    scrolls: 2,
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let browser;

try {
  const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
    throw new Error("ffmpeg is required to create the MP4 rehearsal. Install ffmpeg, then retry.");
  }
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright is required to record the rehearsal. Run npm ci and npx playwright install chromium, then retry.",
    );
  }

  mkdirSync(outputDir, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: recordingDir, size: { width: 1280, height: 720 } },
  });

  // The captions must quote the product's own labels. If someone edits the
  // truthLabels map in tour/page.tsx, fail here rather than overlay stale text.
  const tourResponse = await context.request.get(`${webBase}/tour`);
  if (!tourResponse.ok()) throw new Error(`tour precheck: HTTP ${tourResponse.status()}`);
  const tourHtml = await tourResponse.text();
  for (const label of Object.values(TRUTH)) {
    if (!tourHtml.includes(label)) {
      throw new Error(`tour precheck: truth label "${label}" is missing from /tour; captions would be stale.`);
    }
  }

  /** Authenticates one synthetic account and returns its session token. */
  async function fetchSessionToken(email) {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await context.request.post(`${webBase}/api/auth/login`, {
        data: { email, password: demoPassword }, // allow-secret: synthetic seed credential
      });
      if (response.status() === 429) {
        if (attempt === 4) throw new Error(`sign-in for ${email}: still throttled after ${attempt} attempts.`);
        const retryAfter = Number(response.headers()["retry-after"]);
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? (retryAfter + 1) * 1000 : 21000;
        console.log(`  login throttled for ${email}; waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/4).`);
        await sleep(waitMs);
        continue;
      }
      if (!response.ok()) throw new Error(`sign-in for ${email}: HTTP ${response.status()}`);
      const body = await response.json();
      if (typeof body.token !== "string" || !body.token) {
        throw new Error(`sign-in for ${email}: no session token was returned.`);
      }
      return body.token;
    }
    throw new Error(`sign-in for ${email}: exhausted attempts.`);
  }

  // Collect every session up front, off camera. Any throttle wait is paid here,
  // before a single frame is recorded.
  console.log("▸ Establishing synthetic sessions off camera ...");
  const tokens = new Map();
  for (const segment of SEGMENTS) {
    tokens.set(segment.email, await fetchSessionToken(segment.email));
  }
  await context.clearCookies();

  const page = await context.newPage();
  const video = page.video();
  if (!video) throw new Error("Playwright did not create a rehearsal recording.");

  async function card(heading, lines, seconds = 3) {
    const body = [`<h1 style="margin:0 0 22px;font-size:44px;letter-spacing:-1px;">${heading}</h1>`]
      .concat(
        lines.map(
          (line) =>
            `<p style="margin:0 0 14px;font-size:21px;line-height:1.5;color:#a3a3a3;max-width:62ch;">${line}</p>`,
        ),
      )
      .join("");
    await page.setContent(
      `<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:-apple-system,Helvetica,Arial,sans-serif;">
         <div style="padding:0 72px;">${body}</div>
       </body>`,
    );
    await page.waitForTimeout(seconds * 1000);
  }

  async function caption(kind, route, account) {
    const style = CAPTION_COLORS[kind];
    await page.evaluate(
      ({ text, route, account, style, height }) => {
        document.getElementById("styx-rehearsal-caption")?.remove();
        document.body.style.paddingTop = `${height}px`;
        const bar = document.createElement("div");
        bar.id = "styx-rehearsal-caption";
        bar.setAttribute(
          "style",
          `position:fixed;top:0;left:0;right:0;height:${height}px;z-index:2147483647;display:flex;align-items:center;gap:16px;padding:0 20px;box-sizing:border-box;background:${style.background};border-bottom:2px solid ${style.border};color:${style.color};font:700 13px/1 -apple-system,Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;`,
        );
        bar.innerHTML =
          `<span style="opacity:.55;">Rehearsal caption</span>` +
          `<span style="opacity:.55;">${route}</span>` +
          `<span style="opacity:.55;">${account}</span>` +
          `<span style="margin-left:auto;border:1px solid ${style.border};border-radius:999px;padding:6px 14px;">${text}</span>`;
        document.body.appendChild(bar);
      },
      { text: TRUTH[kind], route, account, style, height: CAPTION_HEIGHT },
    );
  }

  async function dwell(scrolls) {
    await page.waitForTimeout(1600);
    for (let i = 0; i < scrolls; i += 1) {
      await page.mouse.wheel(0, 570);
      await page.waitForTimeout(1400);
    }
  }

  // 1. Title card -- pins the artifact to a commit and a date, because the seeded
  // streaks in seed-circles.sql are relative to CURRENT_DATE and shift daily.
  await card(
    "Styx — signed-in rehearsal",
    [
      `Recorded ${RECORDED_ON} against commit ${demoCommit}, after the live-stack gate passed.`,
      "Synthetic accounts, synthetic data, test-money only. No real payment, clinical, or enterprise claim.",
    ],
    4,
  );

  // 2. The Tour, which carries its own truth label in the product.
  await page.goto(`${webBase}/tour`, { waitUntil: "networkidle" });
  await dwell(3);

  // 3-5. Each signed-in route, with its session applied instantly from the
  // token collected before recording began.
  for (const segment of SEGMENTS) {
    await card(segment.heading, segment.lines);
    await context.clearCookies();
    await context.addCookies([
      { name: "styx_auth_token", value: tokens.get(segment.email), url: webBase },
    ]);
    await page.goto(`${webBase}${segment.route}`, { waitUntil: "networkidle" });
    for (const expected of segment.expect) {
      await page.getByText(expected).first().waitFor({ timeout: 20000 });
    }
    await caption(segment.kind, segment.route, `${segment.email} (synthetic)`);
    await dwell(segment.scrolls);
  }

  // 6. Close on the boundary, quoting tour/page.tsx verbatim.
  await card(
    "What is deliberately not being claimed",
    [
      "No real-money settlement, payment custody, pricing, or public launch.",
      "No clinical outcome, diagnosis, treatment, or health-data promise.",
      "No assertion that enterprise procurement or app-store readiness is complete.",
    ],
    5,
  );

  // The webm is only finalized when the context closes.
  await context.close();
  const webmPath = await video.path();
  const conversion = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      webmPath,
      "-an", // no audio track: nothing ambient can be captured
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "30",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      outputPath,
    ],
    { stdio: "inherit" },
  );
  if (conversion.status !== 0) {
    throw new Error(`ffmpeg failed with exit code ${conversion.status ?? "unknown"}.`);
  }

  // docs/** is force-included by .gitignore and there is no LFS rule, so this file
  // lands in git as a plain blob. Refuse to leave an oversized one behind.
  const sizeBytes = statSync(outputPath).size;
  const sizeMb = sizeBytes / (1024 * 1024);
  if (sizeMb > 8) {
    throw new Error(`recorded rehearsal is ${sizeMb.toFixed(1)} MB, above the 8 MB commit budget.`);
  }
  console.log(`PASS: recorded signed-in rehearsal at ${outputPath} (${sizeMb.toFixed(1)} MB).`);
} finally {
  await browser?.close();
  rmSync(recordingDir, { recursive: true, force: true });
}
