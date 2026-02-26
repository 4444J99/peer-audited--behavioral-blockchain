const DEFAULT_API_BASE = 'http://localhost:3000';

type EnvLike = Record<string, string | undefined>;

export function resolveApiBaseUrl(env: EnvLike = process.env as EnvLike): string {
  return (
    env.EXPO_PUBLIC_STYX_API_URL ||
    env.EXPO_PUBLIC_API_URL ||
    env.STYX_API_URL ||
    DEFAULT_API_BASE
  );
}

export const API_BASE = resolveApiBaseUrl();
