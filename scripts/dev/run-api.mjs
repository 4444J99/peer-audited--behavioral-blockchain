import path from "node:path";
import { spawn } from "node:child_process";
import { buildApiEnv, repoRoot } from "./env.mjs";

const env = buildApiEnv();
// npm sometimes nests api-only packages (class-validator, @nestjs/platform-express)
// under src/api/node_modules while their consumers (@nestjs/core, @nestjs/common)
// hoist to the repo root; NODE_PATH gives root-located packages a fallback
// resolution path into the workspace's nested modules.
const apiNodeModules = path.join(repoRoot, "src/api/node_modules");
env.NODE_PATH = env.NODE_PATH
  ? `${apiNodeModules}${path.delimiter}${env.NODE_PATH}`
  : apiNodeModules;

const child = spawn(
  process.execPath,
  ["-r", "ts-node/register", "-r", "tsconfig-paths/register", "src/main.ts"],
  {
    cwd: path.join(repoRoot, "src/api"),
    env,
    stdio: "inherit",
  },
);

// This process is only a launcher; the Nest server is the child. Without
// forwarding, terminating the launcher leaves the server alive and reparented to
// init, still holding the API port -- and the demo launcher's next readiness
// probe then passes against that stale server, bound to a database the reset in
// between has already dropped and recreated. Forward instead of orphaning.
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
