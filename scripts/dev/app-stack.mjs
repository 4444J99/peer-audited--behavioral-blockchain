import { spawn } from "node:child_process";
import { buildApiEnv, buildWebEnv, repoRoot } from "./env.mjs";

// Pre-validate both envs before spawning so a bad config fails fast
// with a single clear error, instead of leaving the user with a
// half-running stack (e.g. Web up, API crashed 5s in with a
// confusing REDIS_URL error).
let apiEnv;
let webEnv;
try {
  apiEnv = buildApiEnv();
} catch (err) {
  console.error("[app-stack] API env validation failed:", err.message);
  process.exit(1);
}
try {
  webEnv = buildWebEnv();
} catch (err) {
  console.error("[app-stack] Web env validation failed:", err.message);
  process.exit(1);
}

// Apply the DB migration chain to completion BEFORE the API spawns. The API
// has no boot-time migration step (and the schema is no longer provisioned by
// an initdb-mounted schema.sql), so skipping this leaves a fresh database
// empty — the API would come up and fail on its first query. Skipped under
// NODE_ENV=test, where the stack runs without a database (same contract as
// buildApiEnv's test fallbacks).
const isTest = apiEnv.NODE_ENV === "test";
if (!isTest) {
  const migrateExit = await new Promise((resolve) => {
    const migrate = spawn("node", ["scripts/dev/run-migrate.mjs"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    migrate.on("error", () => resolve(1));
    migrate.on("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
  if (migrateExit !== 0) {
    console.error(
      `[app-stack] Database migration failed (exit ${migrateExit}) — not starting API/Web.`,
    );
    process.exit(migrateExit);
  }
}

const children = [
  spawn("node", ["scripts/dev/run-api.mjs"], {
    cwd: repoRoot,
    env: apiEnv,
    stdio: "inherit",
  }),
  spawn("node", ["scripts/dev/run-web.mjs"], {
    cwd: repoRoot,
    env: webEnv,
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code && code !== 0) {
      shutdown(signal || "SIGTERM");
      process.exit(code);
    }
  });
}
