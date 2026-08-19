#!/usr/bin/env bash
# Full local-demo gate: API/browser behavior is verified over HTTP and the
# seeded database is checked from inside the same named Compose project.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
native_state="$repo_root/artifacts/styx-demo-native.env"
local_password_file="$repo_root/artifacts/styx-demo-local.env"

read_local_demo_password() {
  local key value
  demo_password=""
  [ -r "$local_password_file" ] || return 1
  while IFS='=' read -r key value; do
    case "$key" in
      STYX_DEMO_PASSWORD) demo_password="$value" ;;
      "") ;;
      *) echo "FAIL: unrecognized local demo credential key: $key" >&2; exit 1 ;;
    esac
  done < "$local_password_file"
  [[ -n "$demo_password" && "$demo_password" != *$'\n'* ]]
}

read_native_state() {
  native_api_url=""
  native_web_url=""
  native_database=""
  native_demo_password=""
  local key value
  while IFS='=' read -r key value; do
    case "$key" in
      STYX_DEMO_NATIVE) [ "$value" = "1" ] || { echo "FAIL: invalid native demo state marker." >&2; exit 1; } ;;
      STYX_DEMO_API_URL) native_api_url="$value" ;;
      STYX_DEMO_WEB_URL) native_web_url="$value" ;;
      STYX_DEMO_DATABASE) native_database="$value" ;;
      STYX_DEMO_REDIS_PORT|STYX_DEMO_REDIS_MANAGED|STYX_DEMO_REDIS_PID|STYX_DEMO_API_PID|STYX_DEMO_WEB_PID) ;;
      STYX_DEMO_PASSWORD) native_demo_password="$value" ;;
      "") ;;
      *) echo "FAIL: unrecognized native demo state key: $key" >&2; exit 1 ;;
    esac
  done < "$native_state"
  [[ "$native_api_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || { echo "FAIL: invalid native API URL in state." >&2; exit 1; }
  [[ "$native_web_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || { echo "FAIL: invalid native web URL in state." >&2; exit 1; }
  [[ "$native_database" =~ ^[A-Za-z0-9_]+$ ]] || { echo "FAIL: invalid native database in state." >&2; exit 1; }
  [[ -n "$native_demo_password" && "$native_demo_password" != *$'\n'* ]] || { echo "FAIL: invalid native synthetic password in state." >&2; exit 1; }
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
  STYX_DEMO_API_URL="$native_api_url" STYX_DEMO_WEB_URL="$native_web_url" STYX_DEMO_PASSWORD="$native_demo_password" node "$repo_root/scripts/demo/verify-live-stack.mjs"
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
  postgres_user="$(compose_env_value POSTGRES_USER)"
  postgres_database="$(compose_env_value POSTGRES_DB)"
  demo_password="${STYX_DEMO_PASSWORD:-}"
  api_port="${api_port:-3000}"
  web_port="${web_port:-3001}"
  postgres_user="${postgres_user:-styx}"
  postgres_database="${postgres_database:-styx}"
  [ -n "$demo_password" ] || read_local_demo_password || { echo "FAIL: launch or reset the Compose demo before verifying it." >&2; exit 1; }
  STYX_DEMO_API_URL="http://127.0.0.1:${api_port}" STYX_DEMO_WEB_URL="http://127.0.0.1:${web_port}" STYX_DEMO_PASSWORD="$demo_password" node "$repo_root/scripts/demo/verify-live-stack.mjs"
  compose_args=(--project-name "$project_name" --env-file "$defaults_env")
  [ -f "$repo_root/.env" ] && compose_args+=(--env-file "$repo_root/.env")
  database_count="$(docker compose "${compose_args[@]}" -f "$compose_file" exec -T styx-postgres psql -Atq -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_database" -c "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email = 'hr.lead@acheron.example';")"
fi
if [ "$database_count" -lt 12 ]; then
  echo "FAIL: synthetic database seed is incomplete (expected at least 12 demo users, got $database_count)." >&2
  exit 1
fi

echo "PASS: synthetic database contains $database_count demo identities; no live payment data was queried."
