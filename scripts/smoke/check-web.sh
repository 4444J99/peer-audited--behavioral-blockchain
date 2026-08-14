#!/usr/bin/env bash
set -euo pipefail

if [ -z "${WEB_URL:-}" ]; then
  echo "::warning::Skipping web smoke test: WEB_URL is not configured."
  exit 0
fi

WEB_URL="${WEB_URL%/}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-12}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-10}"

tmp_body="$(mktemp)"
cleanup() {
  rm -f "$tmp_body"
}
trap cleanup EXIT

for i in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "Web smoke check attempt ${i}/${MAX_ATTEMPTS}: ${WEB_URL}"
  http_code="$(curl -sS -o "$tmp_body" -w "%{http_code}" "$WEB_URL" || echo "000")"
  if [ "$http_code" = "200" ]; then
    # The root is a client component that renders even when the API link is
    # completely broken, so a 200 here proves liveness only. /api/health
    # traverses the Next rewrite into the API — it fails precisely when
    # NEXT_PUBLIC_API_URL was absent at build time and the docker-compose
    # fallback host got baked in, which nothing else detects.
    proxy_code="$(curl -sS -o "$tmp_body" -w "%{http_code}" "$WEB_URL/api/health" || echo "000")"
    if [ "$proxy_code" = "200" ]; then
      echo "✅ Web smoke test passed (root 200, /api/health proxy 200)"
      exit 0
    fi
    echo "⚠️  Root is 200 but /api/health via the rewrite returned ${proxy_code} — retrying..."
  else
    echo "⚠️  HTTP ${http_code} — retrying..."
  fi
  sleep "$INTERVAL_SECONDS"
done

echo "❌ Web smoke test failed after ${MAX_ATTEMPTS} attempts"
echo "Last response body:"
cat "$tmp_body" || true
exit 1
