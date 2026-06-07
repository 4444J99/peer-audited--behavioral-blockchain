import { spawn } from "node:child_process";
import { buildApiEnv, buildWebEnv, repoRoot } from "./env.mjs";

const children = [
  spawn("node", ["scripts/dev/run-api.mjs"], {
    cwd: repoRoot,
    env: buildApiEnv(),
    stdio: "inherit",
  }),
  spawn("node", ["scripts/dev/run-web.mjs"], {
    cwd: repoRoot,
    env: buildWebEnv(),
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
