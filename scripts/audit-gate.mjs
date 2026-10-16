#!/usr/bin/env node
// Fails on any high/critical npm advisory not listed (by exact GHSA + package) in .audit-exceptions.json.
// Expired exceptions (reviewBy < today, UTC) also fail.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { exceptions } = JSON.parse(readFileSync(new URL("../.audit-exceptions.json", import.meta.url)));
const today = new Date().toISOString().slice(0, 10);
const allowed = new Map();
let failed = false;
for (const e of exceptions) {
  if (!/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(e.id) || !e.package || !e.reviewBy) {
    console.error(`::error::Malformed audit exception: ${JSON.stringify(e)}`); failed = true; continue;
  }
  if (e.reviewBy < today) { console.error(`::error::Audit exception ${e.id} (${e.package}) expired on ${e.reviewBy}`); failed = true; continue; }
  allowed.set(e.id, e.package);
}

let raw;
try { raw = execFileSync("npm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 64 << 20 }); }
catch (err) { raw = err.stdout; }
const report = JSON.parse(raw);
if (!report.vulnerabilities) { console.error("::error::npm audit returned no report"); process.exit(1); }

const blocking = [], excepted = new Set();
for (const vuln of Object.values(report.vulnerabilities)) {
  for (const via of vuln.via) {
    if (typeof via !== "object") continue; // transitive; reported under its root package
    if (via.severity !== "high" && via.severity !== "critical") continue;
    const id = (via.url || "").split("/").pop();
    if (allowed.get(id) === via.name) excepted.add(`${id} (${via.name})`);
    else blocking.push(`${via.severity} ${id || via.source} ${via.name}: ${via.title}`);
  }
}
const m = report.metadata?.vulnerabilities ?? {};
console.log(`npm audit: ${m.total} total (critical ${m.critical}, high ${m.high}, moderate ${m.moderate}, low ${m.low})`);
for (const x of excepted) console.log(`excepted: ${x}`);
for (const b of [...new Set(blocking)]) console.error(`::error::blocking advisory: ${b}`);
if (blocking.length || failed) process.exit(1);
console.log("Dependency audit gate: PASS (no un-excepted high/critical advisories)");
