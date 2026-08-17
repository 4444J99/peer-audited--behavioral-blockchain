export function normalizeBaseUrl(value: string): string {
  // Trim trailing slashes without a regex: /\/+$/ backtracks polynomially
  // on untrusted input (CodeQL js/polynomial-redos).
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
}

export function readFirstEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

export function requireOneEnv(keys: string[], purpose: string): string {
  const value = readFirstEnv(keys);
  if (!value) {
    throw new Error(`${purpose} is required. Set one of: ${keys.join(", ")}`);
  }
  return value;
}

export function parsePort(value: string, purpose: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`${purpose} must be a valid TCP port`);
  }
  return port;
}

function buildConnectionUrl(input: {
  protocol: string;
  host: string;
  port: string;
  user?: string;
  password?: string;
  database?: string;
}): string {
  const url = new URL(`${input.protocol}://${input.host}`);
  url.hostname = input.host;
  url.port = input.port;
  if (input.user) url.username = input.user;
  if (input.password) url.password = input.password;
  if (input.database) url.pathname = `/${input.database}`;
  return url.toString();
}

export function resolveApiListenPort(): number {
  return parsePort(
    requireOneEnv(["PORT", "API_PORT"], "API listen port"),
    "API listen port",
  );
}

export function resolveApiPublicUrl(fallbackUrl?: string): string | undefined {
  const configured = readFirstEnv([
    "STYX_API_PUBLIC_URL",
    "NEXT_PUBLIC_API_URL",
  ]);
  if (configured) return normalizeBaseUrl(configured);
  return fallbackUrl ? normalizeBaseUrl(fallbackUrl) : undefined;
}

export function resolveCorsOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS;
  if (configured) {
    return configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normalizeBaseUrl);
  }

  const webUrl = readFirstEnv(["STYX_WEB_PUBLIC_URL", "NEXT_PUBLIC_WEB_URL"]);
  return webUrl ? [normalizeBaseUrl(webUrl)] : [];
}

export function resolveWebPublicUrl(inputUrl?: string | null): string {
  const webUrl =
    inputUrl || readFirstEnv(["STYX_WEB_PUBLIC_URL", "NEXT_PUBLIC_WEB_URL"]);
  if (!webUrl) {
    throw new Error(
      "Web public URL is required. Set STYX_WEB_PUBLIC_URL or NEXT_PUBLIC_WEB_URL.",
    );
  }
  return normalizeBaseUrl(webUrl);
}

export function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl;

  const host = requireOneEnv(["POSTGRES_HOST"], "PostgreSQL host");
  const port = requireOneEnv(["POSTGRES_PORT"], "PostgreSQL port");
  const user = requireOneEnv(["POSTGRES_USER"], "PostgreSQL user");
  const password = requireOneEnv(["POSTGRES_PASSWORD"], "PostgreSQL password");
  const database = requireOneEnv(["POSTGRES_DB"], "PostgreSQL database");

  parsePort(port, "PostgreSQL port");
  return buildConnectionUrl({
    protocol: "postgresql",
    host,
    port,
    user,
    password,
    database,
  });
}

function parseRedisUrl(envKey: string, defaultPort: string) {
  const redisUrl = process.env[envKey];
  if (!redisUrl) return undefined;

  const parsed = new URL(redisUrl);
  const port = parsePort(
    parsed.port || process.env[`${envKey}_PORT`] || defaultPort,
    `${envKey} port`,
  );
  return {
    host: parsed.hostname,
    port,
    password: parsed.password || undefined, // allow-secret
    tls: parsed.protocol === "rediss:" ? {} : undefined,
  };
}

function resolveRedisByPurpose(
  urlEnv: string,
  hostEnv: string,
  portEnv: string,
  defaultPort: string,
) {
  const fromUrl = parseRedisUrl(urlEnv, defaultPort);
  if (fromUrl) return fromUrl;

  if (process.env.NODE_ENV === "test") {
    return { host: "127.0.0.1", port: 6379 };
  }

  const host = requireOneEnv([hostEnv], `${hostEnv}`);
  const port = parsePort(
    requireOneEnv([portEnv], `${portEnv}`),
    `${portEnv}`,
  );
  return {
    host,
    port,
    password: process.env[`${hostEnv.replace(/_HOST$/, '_PASSWORD')}`] || undefined, // allow-secret
  };
}

export function resolveRedisConnectionConfig() {
  return resolveRedisByPurpose("REDIS_URL", "REDIS_HOST", "REDIS_PORT", "6379");
}

export function resolveBullmqRedisConfig() {
  const legacy = resolveRedisByPurpose("REDIS_BULLMQ_URL", "REDIS_BULLMQ_HOST", "REDIS_BULLMQ_PORT", "6380");
  // If the purpose-specific env vars are not set, fall back to the shared Redis
  if (legacy.host === "127.0.0.1" && legacy.port === 6379 && process.env.NODE_ENV !== "test") {
    return resolveRedisConnectionConfig();
  }
  return legacy;
}

export function resolveCacheRedisConfig() {
  const cfg = resolveRedisByPurpose("REDIS_CACHE_URL", "REDIS_CACHE_HOST", "REDIS_CACHE_PORT", "6381");
  if (cfg.host === "127.0.0.1" && cfg.port === 6381 && process.env.NODE_ENV !== "test") {
    return resolveRedisConnectionConfig();
  }
  return cfg;
}

// Issue #905: the live beta runs the test-money rail. Financial-permission
// surfaces must not apply real-money exposure ceilings to it, so every such
// surface derives the rail from this single predicate instead of re-reading
// the env var (truthiness here must match beta.controller's envFlag).
export function isTestMoneyModeEnabled(): boolean {
  const raw = process.env.STYX_TEST_MONEY_MODE;
  if (raw == null) {
    return true;
  }
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}
