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
    echo "✅ Web smoke test passed"
    exit 0
  fi
  echo "⚠️  HTTP ${http_code} — retrying..."
  sleep "$INTERVAL_SECONDS"
done

echo "❌ Web smoke test failed after ${MAX_ATTEMPTS} attempts"
echo "Last response body:"
cat "$tmp_body" || true
exit 1
