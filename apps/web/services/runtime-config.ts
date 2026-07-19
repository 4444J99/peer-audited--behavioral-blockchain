function normalizeBaseUrl(value: string): string {
  // Trim trailing slashes without a regex: /\/+$/ backtracks polynomially
  // on untrusted input (CodeQL js/polynomial-redos).
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
}

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  if (process.env.NODE_ENV === "test") {
    return "/api";
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.STYX_API_PUBLIC_URL;
  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL or STYX_API_PUBLIC_URL is required for server-side API requests.",
    );
  }

  return normalizeBaseUrl(apiUrl);
}
