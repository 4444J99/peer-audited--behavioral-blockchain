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
  [[ "$(node24 node -p 'process.versions.node.split(`.`)[0]')" == "24" ]] || die "Node 24 LTS is required for the native demo fallback."
}

require_demo_secrets() {
  local key
  for key in STYX_DEMO_PASSWORD JWT_SECRET APP_SECRET ANONYMIZE_SALT ZK_EXHAUST_SECRET STYX_WEBHOOK_SECRET INTERNAL_SERVICE_TOKEN ENTERPRISE_SSO_SECRET STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY; do
    [[ -n "${!key:-}" ]] || die "${key} must be injected before launching the native demo."
  done
}

write_state() {
  mkdir -p "$state_dir"
  printf '%s\n' \
    'STYX_DEMO_NATIVE=1' \
    "STYX_DEMO_API_URL=http://127.0.0.1:${api_port}" \
    "STYX_DEMO_WEB_URL=http://127.0.0.1:${web_port}" \
    "STYX_DEMO_DATABASE=${database_name}" \
    "STYX_DEMO_REDIS_PORT=${redis_port}" \
    "STYX_DEMO_REDIS_MANAGED=${redis_managed}" \
    "STYX_DEMO_REDIS_PID=${redis_pid}" \
    "STYX_DEMO_API_PID=${api_pid}" \
    "STYX_DEMO_WEB_PID=${web_pid}" \
    "STYX_DEMO_PASSWORD=${STYX_DEMO_PASSWORD}" > "$state_file"
}

load_state() {
  [ -r "$state_file" ] || return 1
  state_database_name=""
  state_redis_port=""
  state_redis_managed=""
  state_redis_pid=""
  state_api_pid=""
  state_web_pid=""
  state_native_marker=""
  state_api_url=""
  state_web_url=""
  state_demo_password=""

  local key value
  while IFS='=' read -r key value; do
    case "$key" in
      STYX_DEMO_NATIVE) state_native_marker="$value" ;;
      STYX_DEMO_API_URL) state_api_url="$value" ;;
      STYX_DEMO_WEB_URL) state_web_url="$value" ;;
      STYX_DEMO_DATABASE) state_database_name="$value" ;;
      STYX_DEMO_REDIS_PORT) state_redis_port="$value" ;;
      STYX_DEMO_REDIS_MANAGED) state_redis_managed="$value" ;;
      STYX_DEMO_REDIS_PID) state_redis_pid="$value" ;;
      STYX_DEMO_API_PID) state_api_pid="$value" ;;
      STYX_DEMO_WEB_PID) state_web_pid="$value" ;;
      STYX_DEMO_PASSWORD) state_demo_password="$value" ;;
      "") ;;
      *) die "native demo state contains an unrecognized key; remove $state_file only after inspecting it." ;;
    esac
  done < "$state_file"

  [[ "$state_native_marker" == "1" ]] || die "native demo state is missing its marker."
  [[ "$state_database_name" =~ ^[A-Za-z0-9_]+$ ]] || die "native demo state has an invalid database name."
  [[ "$state_redis_port" =~ ^[0-9]+$ ]] || die "native demo state has an invalid Redis port."
  [[ "$state_redis_managed" =~ ^[01]$ ]] || die "native demo state has an invalid Redis ownership marker."
  if [[ "$state_redis_managed" == "1" ]]; then
    [[ "$state_redis_pid" =~ ^[0-9]+$ ]] || die "native demo state has an invalid managed Redis PID."
  else
    [[ -z "$state_redis_pid" ]] || die "native demo state has unexpected external Redis metadata."
  fi
  [[ "$state_api_pid" =~ ^[0-9]+$ ]] || die "native demo state has an invalid API PID."
  [[ "$state_web_pid" =~ ^[0-9]+$ ]] || die "native demo state has an invalid web PID."
  [[ "$state_api_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || die "native demo state has an invalid API URL."
  [[ "$state_web_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || die "native demo state has an invalid web URL."
  [[ -n "$state_demo_password" && "$state_demo_password" != *$'\n'* ]] || die "native demo state has an invalid synthetic password."
}

# A stopped process must not leave a listener behind. The API is started through
# scripts/dev/run-api.mjs, which spawns the Nest server as a child, so signalling
# only the parent reparents a live server to init -- it keeps its port, and the
# next launch's readiness probe then passes against a stale server still bound to
# the database this reset just dropped. Signal the children too, and escalate.
terminate_tree() {
  local pid="$1"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  kill -0 "$pid" 2>/dev/null || return 0
  pkill -TERM -P "$pid" 2>/dev/null || true
  kill -TERM "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 1
  done
  pkill -KILL -P "$pid" 2>/dev/null || true
  kill -KILL "$pid" 2>/dev/null || true
  for _ in 1 2 3; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 1
  done
  return 1
}

stop_pid() {
  local pid="$1" label="$2"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    info "Stopping ${label} (pid ${pid}) ..."
    terminate_tree "$pid" ||
      die "${label} did not stop cleanly (pid ${pid}); inspect it before retrying."
  fi
}

wait_for_http() {
  local url="$1" label="$2"
  for _ in $(seq 1 40); do
    # -q ignores the operator's curlrc. An ambient --http2 there (curl reads
    # $CURL_HOME/.curlrc) makes curl request an h2c upgrade on plain HTTP, which
    # Next answers by closing the connection -- so a perfectly healthy demo reads
    # as "never became ready", and no browser reproduces it because browsers do
    # not attempt h2c over cleartext. This demo speaks local HTTP/1.1; pin that
    # rather than inherit whatever the machine happens to prefer. The same flag
    # also drops an inherited --location and --max-time from the probe.
    if curl -q -fsS --http1.1 --max-time 10 -o /dev/null "$url" 2>/dev/null; then
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
  export NEXT_PUBLIC_STYX_ENV_LABEL=local-native-demo
  export NEXT_PUBLIC_STYX_PRIVATE_BETA=true
  export NEXT_PUBLIC_STYX_TEST_MONEY_MODE=true
  export NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI=true
}

database_exists() {
  psql -d postgres -v ON_ERROR_STOP=1 -v database_name="$database_name" -Atq <<'SQL' | grep -qx 1
SELECT 1 FROM pg_database WHERE datname = :'database_name';
SQL
}

set_synthetic_password() {
  local password_hash
  password_hash="$(node24 node scripts/demo/hash-synthetic-password.mjs)"
  psql -d "$database_name" -v ON_ERROR_STOP=1 -v password_hash="$password_hash" <<'SQL'
UPDATE users SET password_hash = :'password_hash'
WHERE email LIKE '%@demo.styx.protocol' OR email = 'hr.lead@acheron.example';
SQL
}

seed_database() {
  if ! database_exists; then
    info "Creating synthetic database ${database_name} ..."
    createdb "$database_name"
  fi
  info "Applying the canonical migration chain ..."
  node24 npx tsx src/api/database/migrations/migrate.ts
  info "Applying synthetic demo seeds ..."
  psql -d "$database_name" -v ON_ERROR_STOP=1 -f src/api/database/seed.sql
  psql -d "$database_name" -v ON_ERROR_STOP=1 -f scripts/demo/seed-circles.sql
  set_synthetic_password
}

start_redis() {
  redis_managed=0
  redis_pid=""
  if redis-cli -p "$redis_port" ping >/dev/null 2>&1; then
    return 0
  fi
  local redis_runtime_dir
  redis_runtime_dir="$(mktemp -d "${TMPDIR:-/tmp}/styx-demo-native-redis.XXXXXXXX")"
  local redis_pidfile="${redis_runtime_dir}/redis.pid"
  redis-server --port "$redis_port" --save "" --appendonly no --daemonize yes --pidfile "$redis_pidfile"
  redis-cli -p "$redis_port" ping >/dev/null 2>&1 || die "native Redis did not start on ${redis_port}."
  redis_pid="$(cat "$redis_pidfile")"
  [[ "$redis_pid" =~ ^[0-9]+$ ]] || die "native Redis did not provide a valid PID."
  redis_managed=1
}

cleanup_failed_launch() {
  local exit_status="$1"
  [[ "$exit_status" -ne 0 ]] || return 0
  # Wait for these to actually die rather than firing a signal and exiting: an
  # orphan that outlives the failed launch keeps its port, and the operator's
  # next attempt fails somewhere confusingly far from the real cause.
  if [[ "${web_pid:-}" =~ ^[0-9]+$ ]]; then terminate_tree "$web_pid" || true; fi
  if [[ "${api_pid:-}" =~ ^[0-9]+$ ]]; then terminate_tree "$api_pid" || true; fi
  if [[ "${redis_managed:-0}" == "1" && "${redis_pid:-}" =~ ^[0-9]+$ ]] && kill -0 "$redis_pid" 2>/dev/null; then
    redis-cli -p "$redis_port" shutdown nosave 2>/dev/null || true
  fi
}

launch() {
  api_pid=""
  web_pid=""
  redis_managed=0
  redis_pid=""
  trap 'cleanup_failed_launch "$?"' EXIT
  require_native_tools
  require_demo_secrets
  [[ "$database_name" =~ ^[A-Za-z0-9_]+$ ]] || die "STYX_DEMO_NATIVE_DATABASE must contain only letters, numbers, and underscores."
  set_demo_env
  seed_database
  start_redis
  mkdir -p "$state_dir"

  info "Starting local API on ${api_port} ..."
  node_bin="$(node24_path)"
  nohup "$node_bin" "$repo_root/scripts/dev/run-api.mjs" >"$api_log" 2>&1 < /dev/null &
  api_pid=$!
  wait_for_http "http://127.0.0.1:${api_port}/health/ready" "API" || die "API did not become ready; inspect ${api_log}."

  info "Building and starting local web tour on ${web_port} ..."
  NODE_ENV=production node24 npm run build --workspace @styx/web
  cd "$repo_root/src/web"
  nohup "$node_bin" "$repo_root/node_modules/next/dist/bin/next" start -p "$web_port" >"$web_log" 2>&1 < /dev/null &
  web_pid=$!
  cd "$repo_root"
  wait_for_http "http://127.0.0.1:${web_port}/tour" "Web tour" || die "web tour did not become ready; inspect ${web_log}."

  write_state
  trap - EXIT

  # Bring the note/interaction collector up with the demo, so a presenter never has
  # to remember a second command. It keeps its OWN pid file rather than a key in this
  # state file, whose parsers reject unknown keys -- and it is explicitly non-fatal:
  # telemetry failing must never turn a working demo into a failed launch.
  if ! bash "$repo_root/scripts/demo/feedback.sh" start; then
    echo "WARN: notes/interaction collector did not start; the demo is unaffected." >&2
  fi

  ok "Native synthetic, test-money demo is live."
  echo "  Tour: http://127.0.0.1:${web_port}/tour"
  echo "  Share: npm run demo:share"
  echo "  Verify: npm run demo:verify"
  echo "  Stop: bash scripts/demo/native.sh down"
}

down() {
  if load_state; then
    # A persisted state owns the exact resource names that launch created.
    # Use it rather than fresh defaults so a custom demo cannot stop or drop
    # another local demo's database or Redis instance.
    database_name="$state_database_name"
    redis_port="$state_redis_port"
    stop_pid "$state_web_pid" "native web"
    stop_pid "$state_api_pid" "native API"
    if [[ "$state_redis_managed" == "1" ]] && kill -0 "$state_redis_pid" 2>/dev/null; then
      local redis_process
      redis_process="$(ps -p "$state_redis_pid" -o comm= 2>/dev/null || true)"
      if [[ "$redis_process" == *redis-server* ]] && redis-cli -p "$redis_port" ping >/dev/null 2>&1; then
        info "Stopping launcher-managed Redis on ${redis_port} ..."
        redis-cli -p "$redis_port" shutdown nosave
      fi
    fi
  fi
  rm -f "$state_file"
  ok "Native synthetic demo stopped. Database ${database_name} is retained until reset."
}

reset() {
  require_native_tools
  [[ "$database_name" =~ ^[A-Za-z0-9_]+$ ]] || die "STYX_DEMO_NATIVE_DATABASE must contain only letters, numbers, and underscores."
  down
  if database_exists; then
    # `down` owns the API and web parents, but their database pools can take a
    # moment to release child connections.  Terminate only sessions attached to
    # this explicitly named synthetic database so an immediate reset is
    # repeatable without touching any other local PostgreSQL database.
    psql -d postgres -v ON_ERROR_STOP=1 -v database_name="$database_name" <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = :'database_name'
  AND pid <> pg_backend_pid();
SQL
    info "Dropping only synthetic database ${database_name} ..."
    dropdb "$database_name"
  fi
  launch
}

reset_verify() {
  reset
  bash "$repo_root/scripts/demo/verify-live-stack.sh"
}

case "${1:-}" in
  launch) launch ;;
  reset) reset ;;
  reset-verify) reset_verify ;;
  down) down ;;
  *) die "usage: bash scripts/demo/native.sh {launch|reset|reset-verify|down}" ;;
esac
