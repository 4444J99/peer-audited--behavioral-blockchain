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

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
