#!/usr/bin/env bash
set -euo pipefail

: "${API_URL:?API_URL is required}"

API_URL="${API_URL%/}"
RELEASE_URL="${API_URL}/meta/release"
EXPECTED_SERVICE="${EXPECTED_SERVICE:-styx-api}"
EXPECTED_ENV_LABEL="${EXPECTED_ENV_LABEL:-}"

tmp_body="$(mktemp)"
cleanup() {
  rm -f "$tmp_body"
}
trap cleanup EXIT

echo "Release metadata check: ${RELEASE_URL}"
http_code="$(curl -sS -o "$tmp_body" -w "%{http_code}" "$RELEASE_URL" || echo "000")"
if [ "$http_code" != "200" ]; then
  echo "❌ Release metadata endpoint failed with HTTP ${http_code}"
  cat "$tmp_body" || true
  exit 1
fi

python3 - "$tmp_body" "$EXPECTED_SERVICE" "$EXPECTED_ENV_LABEL" <<'PY'
import json, sys

path, expected_service, expected_env_label = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, 'r', encoding='utf-8') as f:
    payload = json.load(f)

service = payload.get('service')
env_label = ((payload.get('environment') or {}).get('label'))
snapshot = payload.get('featureFlagSnapshotHash')
timestamp = payload.get('timestamp')

if service != expected_service:
    raise SystemExit(f"Expected service={expected_service!r}, got {service!r}")
if not env_label:
    raise SystemExit("Missing environment.label in /meta/release response")
if expected_env_label and env_label != expected_env_label:
    raise SystemExit(f"Expected environment.label={expected_env_label!r}, got {env_label!r}")
if not snapshot:
    raise SystemExit("Missing featureFlagSnapshotHash in /meta/release response")
if not timestamp:
    raise SystemExit("Missing timestamp in /meta/release response")

build = payload.get('build') or {}
print(f"✅ Release metadata ok: service={service}, env={env_label}, sha={build.get('sha') or 'none'}, flags={snapshot}")
PY
