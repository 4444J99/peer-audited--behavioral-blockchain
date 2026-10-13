// Run: node --test scripts/validation/__tests__/
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const script = join(root, "scripts/validation/05-behavioral-physics-check.ts");
const tsx = join(root, "node_modules/.bin/tsx");

function envWithoutApi() {
  const env = { ...process.env };
  delete env.API_URL;
  delete env.STYX_API_PUBLIC_URL;
  delete env.NEXT_PUBLIC_API_URL;
  return env;
}

test("no API address: offline check runs, integration SKIPs, exit 0", () => {
  const r = spawnSync(tsx, [script], { env: envWithoutApi(), encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Constants match/);
  assert.match(r.stdout, /GATE 05 INTEGRATION SKIP/);
});

test("no API address + constants violation: still fails (exit 1)", () => {
  const dir = mkdtempSync(join(tmpdir(), "gate05-"));
  mkdirSync(join(dir, "scripts/validation"), { recursive: true });
  mkdirSync(join(dir, "src/shared/libs"), { recursive: true });
  copyFileSync(script, join(dir, "scripts/validation/05-behavioral-physics-check.ts"));
  writeFileSync(
    join(dir, "src/shared/libs/behavioral-logic.ts"),
    "export const LOSS_AVERSION_COEFFICIENT = 2.0;\nexport const DISPUTE_GRACE_PERIOD_HOURS = 24;\n",
  );
  const r = spawnSync(tsx, [join(dir, "scripts/validation/05-behavioral-physics-check.ts")], {
    env: envWithoutApi(),
    encoding: "utf8",
  });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /Constants mismatch/);
  assert.doesNotMatch(r.stdout, /INTEGRATION SKIP/);
});
