#!/usr/bin/env node
/**
 * Reads back what the room did with the demo.
 *
 * Reads the NDJSON directly rather than the collector's HTTP endpoint, so the
 * report still works after the demo has been shut down -- which is when a
 * presenter actually wants to read it.
 */
import { readFile } from "node:fs/promises";

import { FILES, readNdjson, summarise } from "./feedback-server.mjs";

const [sessions, events, notes] = await Promise.all([
  readNdjson(FILES.sessions),
  readNdjson(FILES.events),
  readNdjson(FILES.notes),
]);

if (!sessions.length && !events.length && !notes.length) {
  console.log("No demo feedback recorded yet.");
  console.log("Start the collector with `npm run demo:feedback` before people open the tour.");
  process.exit(0);
}

const summary = summarise(sessions, events, notes);
const pad = (value, width) => String(value).padEnd(width);
const seconds = (value) => (value >= 60 ? `${Math.round(value / 60)}m` : `${value}s`);

console.log("");
console.log(`  ${summary.totals.viewers} viewer(s) · ${summary.totals.routeViews} route views · ${summary.totals.distinctRoutes} distinct routes · ${summary.totals.notes} note(s)`);
console.log("");

console.log("  WHO");
for (const viewer of summary.viewers) {
  console.log(
    `    ${pad(viewer.name, 22)} ${pad(`${viewer.routes} routes`, 12)} ${pad(seconds(Math.round(viewer.dwellMs / 1000)), 8)} ${pad(`${viewer.tooltips} tooltips`, 14)} ${pad(viewer.audience, 12)} ${viewer.notes} notes`,
  );
}

console.log("");
console.log("  WHERE THEY SPENT TIME (total dwell, descending)");
for (const route of summary.routes.slice(0, 15)) {
  console.log(
    `    ${pad(route.route, 42)} ${pad(seconds(route.totalDwellSeconds), 8)} ${pad(`${route.views} views`, 11)} ${route.viewers} viewer(s)`,
  );
}

if (summary.notes.length) {
  console.log("");
  console.log("  NOTES");
  for (const note of summary.notes) {
    const who = note.name || "(anonymous)";
    console.log(`    [${note.route}] ${who}: ${note.text}`);
  }
}

// The silence is the finding. A route nobody opened during a walkthrough is
// either unreachable, uninteresting, or badly signposted -- and a report that
// only lists what people did look at hides all three.
// The registry is TypeScript, which plain node cannot import; read the paths out
// as text rather than adding a transpiler to a reporting script.
const touched = new Set(summary.routes.map((route) => route.route));
const registryPath = new URL("../../src/web/lib/guided-tour/registry.ts", import.meta.url);
let registered = [];
try {
  const source = await readFile(registryPath, "utf8");
  registered = [...source.matchAll(/^\s*path:\s*"([^"]+)"/gm)].map((match) => match[1]);
} catch {
  registered = [];
}
const untouched = registered.filter((route) => !touched.has(route));
if (untouched.length) {
  console.log("");
  console.log(`  NOBODY OPENED (${untouched.length} of ${registered.length})`);
  console.log(`    ${untouched.join(", ")}`);
}

console.log("");
