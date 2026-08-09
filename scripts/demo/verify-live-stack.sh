#!/usr/bin/env bash
# Full local-demo gate: API/browser behavior is verified over HTTP and the
# seeded database is checked from inside the same named Compose project.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
native_state="$repo_root/artifacts/styx-demo-native.env"

read_native_state() {
  native_api_url=""
  native_web_url=""
  native_database=""
  local key value
  while IFS='=' read -r key value; do
    case "$key" in
      STYX_DEMO_NATIVE) [ "$value" = "1" ] || { echo "FAIL: invalid native demo state marker." >&2; exit 1; } ;;
      STYX_DEMO_API_URL) native_api_url="$value" ;;
      STYX_DEMO_WEB_URL) native_web_url="$value" ;;
      STYX_DEMO_DATABASE) native_database="$value" ;;
      STYX_DEMO_REDIS_PORT|STYX_DEMO_API_PID|STYX_DEMO_WEB_PID) ;;
      "") ;;
      *) echo "FAIL: unrecognized native demo state key: $key" >&2; exit 1 ;;
    esac
  done < "$native_state"
  [[ "$native_api_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || { echo "FAIL: invalid native API URL in state." >&2; exit 1; }
  [[ "$native_web_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || { echo "FAIL: invalid native web URL in state." >&2; exit 1; }
  [[ "$native_database" =~ ^[A-Za-z0-9_]+$ ]] || { echo "FAIL: invalid native database in state." >&2; exit 1; }
}

compose_env_value() {
  local key="$1" value="" defaults_env="$repo_root/.config/docker/compose.defaults.env" root_env="$repo_root/.env"
  [ -f "$defaults_env" ] && value="$(grep -E "^${key}=" "$defaults_env" | tail -n1 | cut -d= -f2- || true)"
  if [ -f "$root_env" ]; then
    local override
    override="$(grep -E "^${key}=" "$root_env" | tail -n1 | cut -d= -f2- || true)"
    [ -n "$override" ] && value="$override"
  fi
  printf '%s' "$value"
}

if [ -f "$native_state" ]; then
  read_native_state
  STYX_DEMO_API_URL="$native_api_url" STYX_DEMO_WEB_URL="$native_web_url" node "$repo_root/scripts/demo/verify-live-stack.mjs"
  database_count="$(psql -d "$native_database" -Atqc "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email = 'hr.lead@acheron.example';")"
else
  compose_file="$repo_root/.config/docker/docker-compose.yml"
  defaults_env="$repo_root/.config/docker/compose.defaults.env"
  project_name="${STYX_DEMO_COMPOSE_PROJECT:-styx-demo}"
  command -v docker >/dev/null 2>&1 || {
    echo "FAIL: launch the native demo with npm run demo:launch, or install Docker Compose." >&2
    exit 1
  }
  api_port="$(compose_env_value STYX_DOCKER_API_PORT)"
  web_port="$(compose_env_value STYX_DOCKER_WEB_PORT)"
  api_port="${api_port:-3000}"
  web_port="${web_port:-3001}"
  STYX_DEMO_API_URL="http://127.0.0.1:${api_port}" STYX_DEMO_WEB_URL="http://127.0.0.1:${web_port}" node "$repo_root/scripts/demo/verify-live-stack.mjs"
  database_count="$(docker compose --project-name "$project_name" --env-file "$defaults_env" -f "$compose_file" exec -T styx-postgres psql -Atq -v ON_ERROR_STOP=1 -U styx -d styx -c "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email = 'hr.lead@acheron.example';")"
fi
if [ "$database_count" -lt 12 ]; then
  echo "FAIL: synthetic database seed is incomplete (expected at least 12 demo users, got $database_count)." >&2
  exit 1
fi

echo "PASS: synthetic database contains $database_count demo identities; no live payment data was queried."
