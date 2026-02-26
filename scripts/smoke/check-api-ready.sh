#!/usr/bin/env bash
set -euo pipefail

: "${API_URL:?API_URL is required}"

API_URL="${API_URL%/}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-12}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-10}"
READY_URL="${API_URL}/health/ready"

tmp_body="$(mktemp)"
cleanup() {
  rm -f "$tmp_body"
}
trap cleanup EXIT

for i in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "API ready check attempt ${i}/${MAX_ATTEMPTS}: ${READY_URL}"
  http_code="$(curl -sS -o "$tmp_body" -w "%{http_code}" "$READY_URL" || echo "000")"

  if [ "$http_code" = "200" ]; then
    ready_status="$(
      python3 - "$tmp_body" <<'PY'
import json, sys
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(data.get('status', ''))
except Exception:
    print('')
PY
    )"
    if [ "$ready_status" = "ready" ]; then
      echo "✅ API readiness check passed"
      exit 0
    fi
    echo "⚠️  HTTP 200 but status=${ready_status:-<missing>} — retrying..."
  elif [ "$http_code" = "503" ]; then
    degraded_status="$(
      python3 - "$tmp_body" <<'PY'
import json, sys
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(data.get('status', ''))
except Exception:
    print('')
PY
    )"
    echo "⚠️  API not ready yet (status=${degraded_status:-unknown}, http=503) — retrying..."
  else
    echo "⚠️  HTTP ${http_code} — retrying..."
  fi

  sleep "$INTERVAL_SECONDS"
done

echo "❌ API readiness check failed after ${MAX_ATTEMPTS} attempts"
echo "Last response body:"
cat "$tmp_body" || true
exit 1
