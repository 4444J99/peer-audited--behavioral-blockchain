#!/usr/bin/env node
/**
 * Records the static, truth-labeled Tour as a travel fallback. It never signs
 * into an account or records personal data. Run the full live-stack verifier
 * separately when recording a signed-in rehearsal.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const tourUrl = process.env.STYX_TOUR_URL || "http://127.0.0.1:3101/tour";
const outputDir = path.join(repoRoot, "docs/demo/assets");
const outputPath = path.join(outputDir, "styx-tour-fallback.mp4");
const recordingDir = mkdtempSync(path.join(tmpdir(), "styx-tour-recording-"));

mkdirSync(outputDir, { recursive: true });

let browser;

try {
  const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
    throw new Error(
      "ffmpeg is required to create the MP4 fallback. Install ffmpeg, then retry.",
    );
  }
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright is required to record the Tour fallback. Run npm ci and npx playwright install chromium, then retry.",
    );
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: recordingDir, size: { width: 1280, height: 720 } },
  });
  // A recorder is not an attendee; keep it out of the feedback report.
  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    ["styx.guidedTour.telemetry", "off"],
  );
  const page = await context.newPage();
  await page.goto(tourUrl, { waitUntil: "networkidle" });
  const video = page.video();
  if (!video) throw new Error("Playwright did not create a Tour recording.");

  // Keep each truth boundary legible in the fallback rather than racing through
  // the page. The resulting clip is a screen recording of the local Tour only.
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 570);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 570);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 570);
  await page.waitForTimeout(1400);

  await context.close();
  const webmPath = await video.path();
  const conversion = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      webmPath,
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      outputPath,
    ],
    { stdio: "inherit" },
  );
  if (conversion.status !== 0) {
    throw new Error(
      `ffmpeg failed with exit code ${conversion.status ?? "unknown"}.`,
    );
  }
  console.log(`PASS: recorded static Tour fallback at ${outputPath}`);
} finally {
  await browser?.close();
  rmSync(recordingDir, { recursive: true, force: true });
}
