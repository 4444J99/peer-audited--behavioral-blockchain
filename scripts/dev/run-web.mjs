import path from "node:path";
import { spawn } from "node:child_process";
import { buildWebEnv, repoRoot } from "./env.mjs";

const env = buildWebEnv();
const child = spawn("npm", ["exec", "--", "next", "dev", "-p", env.PORT], {
  cwd: path.join(repoRoot, "src/web"),
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
