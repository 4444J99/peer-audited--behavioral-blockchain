import path from "node:path";
import { spawn } from "node:child_process";
import { buildMigrateEnv, repoRoot } from "./env.mjs";

const child = spawn(
  "npm",
  ["exec", "--", "tsx", "database/migrations/migrate.ts"],
  {
    cwd: path.join(repoRoot, "src/api"),
    env: buildMigrateEnv(),
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
