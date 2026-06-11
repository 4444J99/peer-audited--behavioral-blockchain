import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, "../..");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const parsed = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    parsed[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
  }
  return parsed;
}

export function loadRepoEnv() {
  const env = { ...process.env };
  const envFiles = [
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, ".env"),
    path.join(repoRoot, "src/api/.env.local"),
    path.join(repoRoot, "src/api/.env"),
  ];

  for (const filePath of envFiles) {
    const values = parseEnvFile(filePath);
    for (const [key, value] of Object.entries(values)) {
      if (env[key] === undefined) env[key] = value;
    }
  }

  return env;
}

export function requireOne(env, keys, purpose) {
  for (const key of keys) {
    if (env[key]) return env[key];
  }
  throw new Error(`${purpose} is required. Set one of: ${keys.join(", ")}`);
}

function portFromUrl(rawUrl, purpose) {
  const parsed = new URL(rawUrl);
  if (parsed.port) return parsed.port;
  if (parsed.protocol === "https:") return "443";
  if (parsed.protocol === "http:") return "80";
  throw new Error(
    `${purpose} must include a network URL with a resolvable port`,
  );
}

export function buildApiEnv() {
  const env = loadRepoEnv();
  const isTest = env.NODE_ENV === "test" || process.env.NODE_ENV === "test";

  let apiUrl;
  try {
    apiUrl = requireOne(
      env,
      ["STYX_API_PUBLIC_URL", "NEXT_PUBLIC_API_URL"],
      "API public URL",
    );
  } catch (err) {
    if (isTest) {
      apiUrl = "http://localhost:3000";
    } else {
      throw err;
    }
  }

  const webUrl =
    env.STYX_WEB_PUBLIC_URL ||
    env.NEXT_PUBLIC_WEB_URL ||
    (isTest ? "http://localhost:3001" : undefined);

  if (!isTest) {
    requireOne(env, ["DATABASE_URL"], "DATABASE_URL");
    requireOne(env, ["REDIS_URL", "REDIS_HOST"], "Redis connection");
  }

  env.STYX_API_PUBLIC_URL ||= apiUrl;
  env.NEXT_PUBLIC_API_URL ||= apiUrl;
  // Default API to a dedicated dev port (3000) so it does not collide
  // with the Web process (default 3001) or the public-URL's port.
  // Override order: STYX_API_PORT > PORT > 3000.
  env.API_PORT ||=
    env.STYX_API_PORT ||
    env.PORT ||
    "3000";
  env.PORT = env.API_PORT;
  env.NODE_ENV ||= "development";
  if (!env.CORS_ORIGINS && webUrl) env.CORS_ORIGINS = webUrl;

  return env;
}

export function buildWebEnv() {
  const env = loadRepoEnv();
  const isTest = env.NODE_ENV === "test" || process.env.NODE_ENV === "test";

  let apiUrl;
  try {
    apiUrl = requireOne(
      env,
      ["NEXT_PUBLIC_API_URL", "STYX_API_PUBLIC_URL"],
      "API public URL",
    );
  } catch (err) {
    if (isTest) {
      apiUrl = "http://localhost:3000";
    } else {
      throw err;
    }
  }

  let webUrl;
  try {
    webUrl = requireOne(
      env,
      ["STYX_WEB_PUBLIC_URL", "NEXT_PUBLIC_WEB_URL"],
      "Web public URL",
    );
  } catch (err) {
    if (isTest) {
      webUrl = "http://localhost:3001";
    } else {
      throw err;
    }
  }

  env.NEXT_PUBLIC_API_URL = apiUrl;
  env.STYX_WEB_PUBLIC_URL ||= webUrl;
  // STYX_WEB_PORT should win over the shared PORT (which is often
  // set by toolchains like Render/Heroku/Docker) so the Web process
  // binds to its dedicated dev port.
  // Override order: STYX_WEB_PORT > PORT > portFromUrl(webUrl).
  // STYX_WEB_PORT explicitly OVERRIDES PORT (not just fallback) so
  // run-web.mjs (next dev -p $PORT) uses the dev port.
  if (env.STYX_WEB_PORT) {
    env.PORT = env.STYX_WEB_PORT;
  } else if (!env.PORT) {
    env.PORT = portFromUrl(webUrl, "Web public URL");
  }
  if (!env.STYX_WEB_PORT) {
    env.STYX_WEB_PORT = env.PORT;
  }
  env.NODE_ENV ||= "development";

  return env;
}

/**
 * Minimal env for DB migrations. Migrations only need DATABASE_URL
 * (or PG* vars); they do NOT need API/Redis/Stripe/etc. Use this
 * from scripts/dev/run-migrate.mjs to avoid confusing "REDIS_URL
 * required" errors when running `npm run dev:migrate`.
 */
export function buildMigrateEnv() {
  const env = loadRepoEnv();
  const isTest = env.NODE_ENV === "test" || process.env.NODE_ENV === "test";

  if (!isTest) {
    requireOne(env, ["DATABASE_URL"], "DATABASE_URL");
  }

  env.NODE_ENV ||= "development";
  return env;
}
