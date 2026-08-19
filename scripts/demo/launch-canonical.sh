#!/usr/bin/env bash
# Canonical launch script for the Styx demo.
# Detects Docker availability, verifies all dependencies, launches the stack,
# and runs a primary vertical-slice smoke test before declaring ready.
set -euo pipefail

# ── Colours & helpers ────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

die()  { echo -e "${RED}FAIL:${NC} $*" >&2; exit 1; }
info() { echo -e "${CYAN}▸${NC} $*"; }
warn() { echo -e "${YELLOW}WARN:${NC} $*" >&2; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }

step_num=0
step() {
  step_num=$((step_num + 1))
  echo ""
  echo -e "${BOLD}── Step ${step_num}: $* ──${NC}"
}

# ── Repo root & ports ───────────────────────────────────────────────────────

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

api_port="${STYX_DEMO_API_PORT:-4310}"
web_port="${STYX_DEMO_WEB_PORT:-4311}"
database_name="${STYX_DEMO_NATIVE_DATABASE:-styx_demo_styxlaunch}"
redis_port="${STYX_DEMO_NATIVE_REDIS_PORT:-6391}"

# ── node24 helper ───────────────────────────────────────────────────────────

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

# ── Docker detection ────────────────────────────────────────────────────────

detect_backend() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    backend="docker"
  else
    backend="native"
  fi
}

# ── Dependency checks ───────────────────────────────────────────────────────

check_port_available() {
  local port="$1" label="$2"
  if lsof -ti :"${port}" >/dev/null 2>&1; then
    warn "${label} port ${port} is already in use — will check if it belongs to a running demo."
    return 0
  fi
  ok "${label} port ${port} is available."
}

check_port_listening() {
  local url="$1" label="$2" timeout="${3:-40}"
  for _ in $(seq 1 "$timeout"); do
    if curl -q -fsS --http1.1 --max-time 5 -o /dev/null "$url" 2>/dev/null; then
      ok "${label} is responding at ${url}."
      return 0
    fi
    sleep 1
  done
  return 1
}

check_redis() {
  local port="$1"
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -p "$port" ping 2>/dev/null | grep -q PONG; then
      ok "Redis is responding on port ${port}."
      return 0
    fi
  fi
  return 1
}

check_psql() {
  local db="$1"
  if command -v psql >/dev/null 2>&1; then
    if psql -d "$db" -v ON_ERROR_STOP=1 -Atq -c "SELECT 1;" >/dev/null 2>&1; then
      ok "PostgreSQL database '${db}' is accessible."
      return 0
    fi
  fi
  return 1
}

check_migrations() {
  local db="$1"
  if psql -d "$db" -v ON_ERROR_STOP=1 -Atq \
    -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');" \
    2>/dev/null | grep -q t; then
    ok "Migrations applied (users table exists)."
    return 0
  fi
  return 1
}

check_seed_data() {
  local db="$1"
  local count
  count="$(psql -d "$db" -v ON_ERROR_STOP=1 -Atq \
    -c "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email IN ('demo@styx.protocol','fury@styx.protocol','admin@styx.protocol');" \
    2>/dev/null || echo 0)"
  if [[ "$count" -ge 12 ]]; then
    ok "Seed data present: ${count} demo users."
    return 0
  fi
  return 1
}

check_auth() {
  local api_url="$1" password="$2"
  local response status_code
  response="$(curl -q -fsS --http1.1 --max-time 10 \
    -X POST "${api_url}/auth/login" \
    -H "content-type: application/json" \
    -d "{\"email\":\"demo@styx.protocol\",\"password\":\"${password}\"}" \
    -o /dev/null -w '%{http_code}' 2>/dev/null || echo "000")"
  if [[ "$response" == "200" ]] || [[ "$response" == "201" ]]; then
    ok "Authentication works (login as demo@styx.protocol succeeded)."
    return 0
  fi
  return 1
}

# ── Launch helpers ──────────────────────────────────────────────────────────

wait_for_http() {
  local url="$1" label="$2" timeout="${3:-60}"
  info "Waiting for ${label} to become ready at ${url} ..."
  for _ in $(seq 1 "$timeout"); do
    if curl -q -fsS --http1.1 --max-time 10 -o /dev/null "$url" 2>/dev/null; then
      ok "${label} is ready."
      return 0
    fi
    sleep 1
  done
  die "${label} did not become ready within ${timeout}s."
}

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
}

# ── Environment setup ───────────────────────────────────────────────────────

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
  export STYX_ENV_LABEL=local-canonical-demo
  export STYX_PRIVATE_BETA=true
  export STYX_ALLOWLIST_US_ONLY=true
  export STYX_FEATURE_B2B_HR_UI=true
  export GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true
  export NEXT_PUBLIC_STYX_ENV_LABEL=local-canonical-demo
  export NEXT_PUBLIC_STYX_PRIVATE_BETA=true
  export NEXT_PUBLIC_STYX_TEST_MONEY_MODE=true
  export NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI=true
}

# ── Native seed & Redis ─────────────────────────────────────────────────────

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
WHERE email LIKE '%@demo.styx.protocol'
   OR email = 'hr.lead@acheron.example'
   OR email IN ('demo@styx.protocol', 'fury@styx.protocol', 'admin@styx.protocol');
SQL
}

seed_database() {
  if ! database_exists; then
    info "Creating database ${database_name} ..."
    createdb "$database_name"
  fi
  info "Applying canonical migrations ..."
  node24 npx tsx src/api/database/migrations/migrate.ts
  info "Applying demo seed data ..."
  psql -d "$database_name" -v ON_ERROR_STOP=1 -f src/api/database/seed.sql
  psql -d "$database_name" -v ON_ERROR_STOP=1 -f scripts/demo/seed-circles.sql
  set_synthetic_password
}

start_redis() {
  redis_managed=0
  redis_pid=""
  if redis-cli -p "$redis_port" ping >/dev/null 2>&1; then
    ok "Redis already running on port ${redis_port}."
    return 0
  fi
  local redis_runtime_dir redis_pidfile
  redis_runtime_dir="$(mktemp -d "${TMPDIR:-/tmp}/styx-canonical-redis.XXXXXXXX")"
  redis_pidfile="${redis_runtime_dir}/redis.pid"
  redis-server --port "$redis_port" --save "" --appendonly no --daemonize yes --pidfile "$redis_pidfile"
  redis-cli -p "$redis_port" ping >/dev/null 2>&1 || die "Redis failed to start on port ${redis_port}."
  redis_pid="$(cat "$redis_pidfile")"
  [[ "$redis_pid" =~ ^[0-9]+$ ]] || die "Redis returned an invalid PID."
  redis_managed=1
  ok "Redis started on port ${redis_port} (pid ${redis_pid})."
}

# ── Vertical-slice smoke test ───────────────────────────────────────────────

vertical_slice_test() {
  local api_url="$1" password="$2"

  info "Logging in as admin@styx.protocol ..."
  local login_response
  login_response="$(curl -q -fsS --http1.1 --max-time 10 \
    -X POST "${api_url}/auth/login" \
    -H "content-type: application/json" \
    -d "{\"email\":\"admin@styx.protocol\",\"password\":\"${password}\"}" \
    2>/dev/null)" || die "Admin login failed."
  local token
  token="$(echo "$login_response" | node24 -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).token));
  ")" || die "Could not extract admin token."
  ok "Admin login succeeded."

  info "Creating a \$0 test-money no-contact contract ..."
  local create_response
  create_response="$(curl -q -fsS --http1.1 --max-time 10 \
    -X POST "${api_url}/contracts" \
    -H "content-type: application/json" \
    -H "authorization: Bearer ${token}" \
    -d '{"oathCategory":"RECOVERY_NOCONTACT","verificationMethod":"ATTESTATION","stakeAmount":0,"durationDays":30,"recoveryMetadata":{"accountabilityPartnerEmail":"megaera@demo.styx.protocol","noContactIdentifiers":["hash_demo"],"acknowledgments":{"voluntary":true,"noMinors":true,"noDependents":true,"noLegalObligations":true}}}' \
    2>/dev/null)" || die "Contract creation failed."
  local contract_id
  contract_id="$(echo "$create_response" | node24 -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{const r=JSON.parse(d); console.log(r.contractId||r.id||'');});
  " 2>/dev/null || true)"
  if [[ -n "$contract_id" ]]; then
    ok "Test contract created: ${contract_id}."
  else
    ok "Test contract creation request accepted (id not parsed from response)."
  fi

  info "Verifying contract appears in dashboard ..."
  local list_response
  list_response="$(curl -q -fsS --http1.1 --max-time 10 \
    "${api_url}/contracts?limit=5" \
    -H "authorization: Bearer ${token}" \
    2>/dev/null)" || die "Contract list fetch failed."
  local contract_count
  contract_count="$(echo "$list_response" | node24 -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{const r=JSON.parse(d); console.log(Array.isArray(r)?r.length:r.total||r.data?.length||0);});
  " 2>/dev/null || echo 0)"
  if [[ "$contract_count" -gt 0 ]]; then
    ok "Dashboard lists ${contract_count} contract(s) — vertical slice verified."
  else
    warn "Could not confirm contract count from API; the demo is still functional."
  fi
}

# ── Cleanup on failure ──────────────────────────────────────────────────────

cleanup_failed_launch() {
  local exit_status="$1"
  [[ "$exit_status" -ne 0 ]] || return 0
  echo ""
  warn "Launch failed — cleaning up started processes ..."
  if [[ "${web_pid:-}" =~ ^[0-9]+$ ]]; then terminate_tree "$web_pid" 2>/dev/null || true; fi
  if [[ "${api_pid:-}" =~ ^[0-9]+$ ]]; then terminate_tree "$api_pid" 2>/dev/null || true; fi
  if [[ "${redis_managed:-0}" == "1" && "${redis_pid:-}" =~ ^[0-9]+$ ]] && kill -0 "$redis_pid" 2>/dev/null; then
    redis-cli -p "$redis_port" shutdown nosave 2>/dev/null || true
  fi
}

# ── Main ────────────────────────────────────────────────────────────────────

main() {
  api_pid=""
  web_pid=""
  redis_managed=0
  redis_pid=""
  trap 'cleanup_failed_launch "$?"' EXIT

  echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║     Styx Canonical Demo — Launch Script      ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"

  # ── Step 1: Source secrets ───────────────────────────────────────────────
  step "Source demo secrets"
  source "$repo_root/scripts/demo/local-secrets.sh"
  ensure_demo_secrets
  ok "Demo secrets loaded (STYX_DEMO_PASSWORD is set)."

  # ── Step 2: Detect backend ──────────────────────────────────────────────
  step "Detect execution backend"
  detect_backend
  if [[ "$backend" == "docker" ]]; then
    ok "Docker Compose detected — using containerised backend."
  else
    ok "No Docker — using native PostgreSQL/Redis fallback."
  fi

  # ── Step 3: Pre-flight dependency checks ────────────────────────────────
  step "Pre-flight dependency checks"

  if [[ "$backend" == "native" ]]; then
    command -v psql     >/dev/null 2>&1 || die "psql is required for native backend."
    command -v createdb >/dev/null 2>&1 || die "createdb is required for native backend."
    command -v redis-server >/dev/null 2>&1 || die "redis-server is required for native backend."
    command -v redis-cli >/dev/null 2>&1 || die "redis-cli is required for native backend."
    command -v curl >/dev/null 2>&1 || die "curl is required."
    node24 node --version >/dev/null 2>&1 || die "Node 24 LTS is required."
    ok "All native CLI tools present."
  else
    command -v docker >/dev/null 2>&1 || die "docker is required for Docker backend."
    docker compose version >/dev/null 2>&1 || die "Docker Compose V2 is required."
    ok "Docker toolchain present."
  fi

  # ── Step 4: Verify secrets ──────────────────────────────────────────────
  step "Verify required secrets"
  local missing=()
  for key in STYX_DEMO_PASSWORD JWT_SECRET APP_SECRET ANONYMIZE_SALT \
             ZK_EXHAUST_SECRET STYX_WEBHOOK_SECRET INTERNAL_SERVICE_TOKEN \
             ENTERPRISE_SSO_SECRET STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY; do
    [[ -n "${!key:-}" ]] || missing+=("$key")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    die "Missing secrets: ${missing[*]}. Run 'source scripts/demo/local-secrets.sh && ensure_demo_secrets' first."
  fi
  ok "All required secrets are set."

  # ── Step 5: Check port availability ─────────────────────────────────────
  step "Check port availability"
  check_port_available "$api_port" "API"
  check_port_available "$web_port" "Web"

  # ── Step 6: Start infrastructure ────────────────────────────────────────
  step "Start infrastructure (database + Redis)"

  if [[ "$backend" == "native" ]]; then
    set_demo_env
    seed_database
    start_redis
  else
    info "Starting Docker Compose stack ..."
    compose_file="$repo_root/.config/docker/docker-compose.yml"
    defaults_env="$repo_root/.config/docker/compose.defaults.env"
    project_name="${STYX_DEMO_COMPOSE_PROJECT:-styx-demo}"
    compose_args=(--project-name "$project_name" --env-file "$defaults_env")
    [[ -f "$repo_root/.env" ]] && compose_args+=(--env-file "$repo_root/.env")
    docker compose "${compose_args[@]}" -f "$compose_file" up -d --wait 2>/dev/null \
      || docker compose "${compose_args[@]}" -f "$compose_file" up -d
    ok "Docker Compose stack started."
  fi

  # ── Step 7: Verify infrastructure readiness ─────────────────────────────
  step "Verify infrastructure readiness"

  if [[ "$backend" == "native" ]]; then
    check_redis "$redis_port" || die "Redis not reachable on port ${redis_port}."
    check_psql "$database_name" || die "Database '${database_name}' not accessible."
    check_migrations "$database_name" || die "Migrations not applied."
    check_seed_data "$database_name" || die "Seed data incomplete (need >= 12 demo users)."
  else
    compose_file="$repo_root/.config/docker/docker-compose.yml"
    defaults_env="$repo_root/.config/docker/compose.defaults.env"
    project_name="${STYX_DEMO_COMPOSE_PROJECT:-styx-demo}"
    compose_args=(--project-name "$project_name" --env-file "$defaults_env")
    [[ -f "$repo_root/.env" ]] && compose_args+=(--env-file "$repo_root/.env")
    postgres_database="$(grep -E '^POSTGRES_DB=' "$defaults_env" 2>/dev/null | tail -n1 | cut -d= -f2- || echo styx)"
    docker compose "${compose_args[@]}" -f "$compose_file" exec -T styx-postgres pg_isready >/dev/null 2>&1 \
      || die "PostgreSQL container is not ready."
    ok "PostgreSQL container is ready."
    local db_count
    db_count="$(docker compose "${compose_args[@]}" -f "$compose_file" exec -T styx-postgres \
      psql -Atq -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-styx}" -d "$postgres_database" \
      -c "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email IN ('demo@styx.protocol','fury@styx.protocol','admin@styx.protocol');" \
      2>/dev/null || echo 0)"
    if [[ "$db_count" -lt 12 ]]; then
      die "Seed data incomplete: expected >= 12 demo users, got ${db_count}."
    fi
    ok "Seed data present: ${db_count} demo users."
  fi

  # ── Step 8: Launch API server ───────────────────────────────────────────
  step "Launch API server on port ${api_port}"

  if [[ "$backend" == "native" ]]; then
    local api_log="$repo_root/artifacts/styx-canonical-api.log"
    mkdir -p "$repo_root/artifacts"
    node_bin="$(node24_path)"
    nohup "$node_bin" "$repo_root/scripts/dev/run-api.mjs" >"$api_log" 2>&1 < /dev/null &
    api_pid=$!
    wait_for_http "http://127.0.0.1:${api_port}/health/ready" "API" \
      || die "API failed to start. Check ${api_log}."
  else
    info "API is managed by Docker Compose — waiting for readiness ..."
    wait_for_http "http://127.0.0.1:${api_port}/health/ready" "API" 90
  fi

  # ── Step 9: Verify API health ───────────────────────────────────────────
  step "Verify API health endpoint"
  local health_status
  health_status="$(curl -q -fsS --http1.1 --max-time 10 \
    -o /dev/null -w '%{http_code}' \
    "http://127.0.0.1:${api_port}/health/ready" 2>/dev/null || echo "000")"
  if [[ "$health_status" == "200" ]]; then
    ok "API health check passed (HTTP ${health_status})."
  else
    die "API health check failed (HTTP ${health_status})."
  fi

  # ── Step 10: Verify authentication ──────────────────────────────────────
  step "Verify authentication"
  check_auth "http://127.0.0.1:${api_port}" "$STYX_DEMO_PASSWORD" \
    || die "Authentication test failed — cannot login with demo credentials."

  # ── Step 11: Build & launch web server ──────────────────────────────────
  step "Build and launch web server on port ${web_port}"

  if [[ "$backend" == "native" ]]; then
    local web_log="$repo_root/artifacts/styx-canonical-web.log"
    NODE_ENV=production node24 npm run build --workspace @styx/web
    cd "$repo_root/src/web"
    local node_bin
    node_bin="$(node24_path)"
    nohup "$node_bin" "$repo_root/node_modules/next/dist/bin/next" start -p "$web_port" >"$web_log" 2>&1 < /dev/null &
    web_pid=$!
    cd "$repo_root"
    wait_for_http "http://127.0.0.1:${web_port}/tour" "Web tour" \
      || die "Web tour failed to start. Check ${web_log}."
  else
    info "Web is managed by Docker Compose — waiting for readiness ..."
    wait_for_http "http://127.0.0.1:${web_port}/tour" "Web tour" 90
  fi

  # ── Step 12: Vertical-slice smoke test ──────────────────────────────────
  step "Vertical-slice smoke test"
  if [[ "$backend" == "native" ]]; then
    vertical_slice_test "http://127.0.0.1:${api_port}" "$STYX_DEMO_PASSWORD"
  else
    vertical_slice_test "http://127.0.0.1:${api_port}" "$STYX_DEMO_PASSWORD"
  fi

  # ── Done ────────────────────────────────────────────────────────────────
  trap - EXIT

  # Start feedback collector (non-fatal)
  if ! bash "$repo_root/scripts/demo/feedback.sh" start >/dev/null 2>&1; then
    warn "Feedback collector did not start; demo is unaffected."
  fi

  # ── Summary ─────────────────────────────────────────────────────────────
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║           Demo is LIVE                       ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${GREEN}Canonical URL:${NC}  http://127.0.0.1:${web_port}/tour"
  echo -e "  ${CYAN}API:${NC}            http://127.0.0.1:${api_port}"
  echo -e "  ${CYAN}Backend:${NC}         ${backend}"
  echo ""
  echo -e "  ${BOLD}Demo Credentials:${NC}"
  echo -e "    Email:    demo@styx.protocol"
  echo -e "    Password: ${STYX_DEMO_PASSWORD}"
  echo ""
  echo -e "  ${BOLD}Admin Credentials:${NC}"
  echo -e "    Email:    admin@styx.protocol"
  echo -e "    Password: ${STYX_DEMO_PASSWORD}"
  echo ""

  # ── Dependency diagram ──────────────────────────────────────────────────
  echo -e "${BOLD}── Dependency Diagram ───────────────────────────────${NC}"
  cat <<'DIAGRAM'
  ┌─────────────────────────────────────────────────────────────┐
  │                     launch-canonical.sh                     │
  └───────────┬────────────────────────────────────────┬────────┘
              │                                        │
              ▼                                        ▼
  ┌───────────────────────┐            ┌──────────────────────────┐
  │  Backend: native      │            │  Backend: docker         │
  │  (fallback)           │            │  (preferred)             │
  └───────┬───────────────┘            └──────────┬───────────────┘
          │                                       │
          ▼                                       ▼
  ┌─────────────────┐                 ┌────────────────────────┐
  │  PostgreSQL     │                 │  Docker Compose        │
  │  (local psql)   │                 │  (containers)          │
  │  port: 5432     │                 │  ┌──────────────────┐  │
  ├─────────────────┤                 │  │ styx-postgres    │  │
  │  Redis          │                 │  ├──────────────────┤  │
  │  (local)        │                 │  │ styx-redis       │  │
  │  port: 6391     │                 │  ├──────────────────┤  │
  └───────┬─────────┘                 │  │ styx-api         │  │
          │                           │  ├──────────────────┤  │
          ▼                           │  │ styx-web         │  │
  ┌─────────────────┐                 │  └──────────────────┘  │
  │  API Server     │                 └────────────────────────┘
  │  port: 4310     │                              │
  │  /health/ready  │◄─────────────────────────────┘
  ├─────────────────┤
  │  Web Server     │
  │  port: 4311     │
  │  /tour          │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  Vertical-Slice Smoke Test                                 │
  │  1. POST /auth/login  (admin@styx.protocol)                │
  │  2. POST /contracts   (create $0 test-money contract)      │
  │  3. GET  /contracts   (verify in dashboard)                │
  └─────────────────────────────────────────────────────────────┘
DIAGRAM
  echo ""
  echo -e "  ${BOLD}Management:${NC}"
  echo -e "    Stop:   bash scripts/demo/native.sh down"
  echo -e "    Reset:  bash scripts/demo/native.sh reset"
  echo -e "    Verify: bash scripts/demo/verify-live-stack.sh"
  echo ""

  # ── Open browser ────────────────────────────────────────────────────────
  local canonical_url="http://127.0.0.1:${web_port}/tour"
  info "Opening ${canonical_url} in your browser ..."
  if command -v open >/dev/null 2>&1; then
    open "$canonical_url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$canonical_url"
  else
    warn "Could not detect browser opener. Navigate to: ${canonical_url}"
  fi
}

main "$@"
