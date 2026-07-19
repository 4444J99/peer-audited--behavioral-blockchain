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

export function resolveRedisConnectionConfig() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const parsed = new URL(redisUrl);
    // Default Redis port is 6379 (Redis standard) when the URL has no
    // explicit port and REDIS_PORT env is unset. Previously this
    // required REDIS_PORT to be set, which broke the common case of
    // REDIS_URL=redis://localhost with no port.
    const port = parsePort(
      parsed.port || process.env.REDIS_PORT || "6379",
      "REDIS_URL port",
    );
    return {
      host: parsed.hostname,
      port,
      password: parsed.password || undefined, // allow-secret
      tls: parsed.protocol === "rediss:" ? {} : undefined,
    };
  }

  if (process.env.NODE_ENV === "test") {
    return {
      host: "127.0.0.1",
      port: 6379,
      password: process.env.REDIS_PASSWORD || undefined, // allow-secret
    };
  }

  const host = requireOneEnv(["REDIS_HOST"], "Redis host");
  const port = parsePort(
    requireOneEnv(["REDIS_PORT"], "Redis port"),
    "Redis port",
  );

  return {
    host,
    port,
    password: process.env.REDIS_PASSWORD || undefined, // allow-secret
  };
}
