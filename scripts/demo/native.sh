#!/usr/bin/env bash
# Docker-free local Styx demo. It owns only one explicitly named database,
# Redis port, API port, web port, PID file, and ignored artifact directory.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
state_dir="$repo_root/artifacts"
state_file="$state_dir/styx-demo-native.env"
api_log="$state_dir/styx-demo-native-api.log"
web_log="$state_dir/styx-demo-native-web.log"
database_name="${STYX_DEMO_NATIVE_DATABASE:-styx_demo_styxlaunch}"
redis_port="${STYX_DEMO_NATIVE_REDIS_PORT:-6391}"
api_port="${STYX_DEMO_NATIVE_API_PORT:-4310}"
web_port="${STYX_DEMO_NATIVE_WEB_PORT:-4311}"

die() { echo "FAIL: $*" >&2; exit 1; }
info() { echo "▸ $*"; }
ok() { echo "✓ $*"; }

node24() {
  if command -v mise >/dev/null 2>&1; then
    mise x node@24 -- "$@"
  else
    "$@"
  fi
}

node24_path() {
  if command -v mise >/dev/null 2>&1; then
    mise x node@24 -- which node
  else
    command -v node
  fi
}

require_native_tools() {
  command -v psql >/dev/null 2>&1 || die "psql is required for the native demo fallback."
  command -v createdb >/dev/null 2>&1 || die "createdb is required for the native demo fallback."
  command -v redis-server >/dev/null 2>&1 || die "redis-server is required for the native demo fallback."
  command -v redis-cli >/dev/null 2>&1 || die "redis-cli is required for the native demo fallback."
  command -v curl >/dev/null 2>&1 || die "curl is required for the native demo fallback."
  node24 node --version >/dev/null 2>&1 || die "Node 24 LTS is required for the native demo fallback."
}

write_state() {
  mkdir -p "$state_dir"
  printf '%s\n' \
    'STYX_DEMO_NATIVE=1' \
    "STYX_DEMO_API_URL=http://127.0.0.1:${api_port}" \
    "STYX_DEMO_WEB_URL=http://127.0.0.1:${web_port}" \
    "STYX_DEMO_DATABASE=${database_name}" \
    "STYX_DEMO_REDIS_PORT=${redis_port}" \
    "STYX_DEMO_API_PID=${api_pid}" \
    "STYX_DEMO_WEB_PID=${web_pid}" > "$state_file"
}

load_state() {
  [ -f "$state_file" ] || return 1
  # The state file is written only by write_state above and contains fixed,
  # unquoted local values; it deliberately contains no credentials.
  source "$state_file"
}

stop_pid() {
  local pid="$1" label="$2"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    info "Stopping ${label} (pid ${pid}) ..."
    kill "$pid"
    for _ in 1 2 3 4 5; do
      kill -0 "$pid" 2>/dev/null || return 0
      sleep 1
    done
    die "${label} did not stop cleanly (pid ${pid}); inspect it before retrying."
  fi
}

wait_for_http() {
  local url="$1" label="$2"
  for _ in $(seq 1 40); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      ok "${label} is ready."
      return 0
    fi
    sleep 1
  done
  return 1
}

set_demo_env() {
  export NODE_ENV=demo
  export PORT="$api_port"
  export DATABASE_URL="postgresql:///${database_name}"
  export MIGRATION_DATABASE_URL="$DATABASE_URL"
  export REDIS_URL="redis://127.0.0.1:${redis_port}"
  export REDIS_BULLMQ_URL="$REDIS_URL"
  export REDIS_CACHE_URL="$REDIS_URL"
  export STYX_API_PUBLIC_URL="http://127.0.0.1:${api_port}"
  export STYX_WEB_PUBLIC_URL="http://127.0.0.1:${web_port}"
  export NEXT_PUBLIC_API_URL="$STYX_API_PUBLIC_URL"
  export NEXT_PUBLIC_WEB_URL="$STYX_WEB_PUBLIC_URL"
  export CORS_ORIGINS="$STYX_WEB_PUBLIC_URL"
  export STYX_TEST_MONEY_MODE=true
  export STYX_ENV_LABEL=local-native-demo
  export STYX_PRIVATE_BETA=true
  export STYX_ALLOWLIST_US_ONLY=true
  export STYX_FEATURE_B2B_HR_UI=true
  export GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true
  export JWT_SECRET=local-native-demo-jwt-secret-0123456789abcdef
  export APP_SECRET=local-native-demo-app-secret
  export ANONYMIZE_SALT=local-native-demo-anonymize-salt
  export ZK_EXHAUST_SECRET=local-native-demo-zk-secret
  export STYX_WEBHOOK_SECRET=local-native-demo-webhook
  export INTERNAL_SERVICE_TOKEN=local-native-demo-internal
  export ENTERPRISE_SSO_SECRET=local-native-demo-sso
  export STRIPE_SECRET_KEY=sk_test_mock_key
  export STRIPE_PUBLISHABLE_KEY=pk_test_mock_key
  export NEXT_PUBLIC_STYX_ENV_LABEL=local-native-demo
  export NEXT_PUBLIC_STYX_PRIVATE_BETA=true
  export NEXT_PUBLIC_STYX_TEST_MONEY_MODE=true
  export NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI=true
}

seed_database() {
  if ! psql -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = '${database_name}'" | grep -qx 1; then
    info "Creating synthetic database ${database_name} ..."
    createdb "$database_name"
  fi
  info "Applying the canonical migration chain ..."
  node24 npx tsx src/api/database/migrations/migrate.ts
  info "Applying synthetic demo seeds ..."
  psql -d "$database_name" -v ON_ERROR_STOP=1 -f src/api/database/seed.sql
  psql -d "$database_name" -v ON_ERROR_STOP=1 -f scripts/demo/seed-circles.sql
}

start_redis() {
  if redis-cli -p "$redis_port" ping >/dev/null 2>&1; then
    return 0
  fi
  redis-server --port "$redis_port" --save "" --appendonly no --daemonize yes --pidfile "/tmp/styx-demo-native-redis-${redis_port}.pid"
  redis-cli -p "$redis_port" ping >/dev/null 2>&1 || die "native Redis did not start on ${redis_port}."
}

launch() {
  require_native_tools
  set_demo_env
  seed_database
  start_redis
  mkdir -p "$state_dir"

  info "Starting local API on ${api_port} ..."
  node_bin="$(node24_path)"
  npm_bin="$(dirname "$node_bin")/npm"
  nohup "$npm_bin" run dev --workspace @styx/api >"$api_log" 2>&1 < /dev/null &
  api_pid=$!
  wait_for_http "http://127.0.0.1:${api_port}/health/ready" "API" || die "API did not become ready; inspect ${api_log}."

  info "Building and starting local web tour on ${web_port} ..."
  NODE_ENV=production node24 npm run build --workspace @styx/web
  cd "$repo_root/src/web"
  nohup "$npm_bin" exec -- next start -p "$web_port" >"$web_log" 2>&1 < /dev/null &
  web_pid=$!
  cd "$repo_root"
  wait_for_http "http://127.0.0.1:${web_port}/tour" "Web tour" || die "web tour did not become ready; inspect ${web_log}."

  write_state
  ok "Native synthetic, test-money demo is live."
  echo "  Tour: http://127.0.0.1:${web_port}/tour"
  echo "  Verify: npm run demo:verify"
  echo "  Stop: bash scripts/demo/native.sh down"
}

down() {
  if load_state; then
    stop_pid "${STYX_DEMO_WEB_PID:-}" "native web"
    stop_pid "${STYX_DEMO_API_PID:-}" "native API"
  fi
  if redis-cli -p "$redis_port" ping >/dev/null 2>&1; then
    info "Stopping native Redis on ${redis_port} ..."
    redis-cli -p "$redis_port" shutdown nosave
  fi
  rm -f "$state_file"
  ok "Native synthetic demo stopped. Database ${database_name} is retained until reset."
}

reset() {
  require_native_tools
  down || true
  if psql -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = '${database_name}'" | grep -qx 1; then
    info "Dropping only synthetic database ${database_name} ..."
    dropdb "$database_name"
  fi
  launch
}

case "${1:-}" in
  launch) launch ;;
  reset) reset ;;
  down) down ;;
  *) die "usage: bash scripts/demo/native.sh {launch|reset|down}" ;;
esac
