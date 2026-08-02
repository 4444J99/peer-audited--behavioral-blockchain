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

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string; // allow-secret
  tls?: Record<string, unknown>;
}

interface RedisPurposeDescriptor {
  urlEnv: string;
  hostEnv: string;
  portEnv: string;
  defaultPort: string;
}

/**
 * Small purpose registry: a new queue is a table row, not a copied function.
 * Each purpose reads a purpose-specific URL (or host/port pair) and falls back
 * to the shared `default` connection when unconfigured.
 */
const REDIS_PURPOSES: Record<string, RedisPurposeDescriptor> = {
  default: {
    urlEnv: "REDIS_URL",
    hostEnv: "REDIS_HOST",
    portEnv: "REDIS_PORT",
    defaultPort: "6379",
  },
  bullmq: {
    urlEnv: "REDIS_BULLMQ_URL",
    hostEnv: "REDIS_BULLMQ_HOST",
    portEnv: "REDIS_BULLMQ_PORT",
    defaultPort: "6380",
  },
  cache: {
    urlEnv: "REDIS_CACHE_URL",
    hostEnv: "REDIS_CACHE_HOST",
    portEnv: "REDIS_CACHE_PORT",
    defaultPort: "6381",
  },
};

type RedisPurpose = keyof typeof REDIS_PURPOSES;

function parseRedisUrl(
  envKey: string,
  defaultPort: string,
): RedisConnectionConfig | undefined {
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

/**
 * Resolve the connection config for one Redis purpose, or `null` when that
 * purpose is entirely unconfigured. Absence returns `null` so callers can fall
 * back to the shared connection; a *partial* host/port pair is misconfiguration
 * and still throws rather than guessing.
 */
function resolveRedisByPurpose(
  purpose: RedisPurpose,
): RedisConnectionConfig | null {
  const { urlEnv, hostEnv, portEnv, defaultPort } = REDIS_PURPOSES[purpose];
  const fromUrl = parseRedisUrl(urlEnv, defaultPort);
  if (fromUrl) return fromUrl;

  if (process.env.NODE_ENV === "test") {
    return { host: "127.0.0.1", port: 6379 };
  }

  const host = process.env[hostEnv];
  const port = process.env[portEnv];
  if (!host && !port) return null;

  return {
    host: requireOneEnv([hostEnv], `${hostEnv}`),
    port: parsePort(requireOneEnv([portEnv], `${portEnv}`), `${portEnv}`),
    password: process.env[`${hostEnv.replace(/_HOST$/, "_PASSWORD")}`] || undefined, // allow-secret
  };
}

export function resolveRedisConnectionConfig(): RedisConnectionConfig | null {
  return resolveRedisByPurpose("default");
}

export function resolveBullmqRedisConfig(): RedisConnectionConfig | null {
  return (
    resolveRedisByPurpose("bullmq") ?? resolveRedisConnectionConfig()
  );
}

export function resolveCacheRedisConfig(): RedisConnectionConfig | null {
  return (
    resolveRedisByPurpose("cache") ?? resolveRedisConnectionConfig()
  );
}

/**
 * Whether the pilot is running on test money. Defaults ON.
 *
 * The escrow rail factory selects from this: true → LedgerEscrowProvider (real
 * balances on the internal ledger, no outside rail attached); false →
 * StripeEscrowProvider. This is the same predicate StripeFboService uses to arm
 * its real-money interlocks, so the rail selection and the interlock can never
 * disagree about which mode is active.
 */
export function testMoneyModeEnabled(): boolean {
  return (
    String(process.env.STYX_TEST_MONEY_MODE ?? "true").toLowerCase() !== "false"
  );
}
