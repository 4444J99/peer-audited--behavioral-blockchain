#!/usr/bin/env bash
# ============================================================================
# Styx — one-command deploy
# ============================================================================
# Single entrypoint for bringing Styx up. Pick a target:
#
#   bash scripts/deploy.sh local          Build + run the full stack locally
#                                          (API + Web + PostgreSQL + Redis) via
#                                          Docker Compose. Zero config needed.
#   bash scripts/deploy.sh render         Trigger a production deploy on Render
#                                          (mirrors .github/workflows/deploy.yml).
#   bash scripts/deploy.sh build          Build the API + Web Docker images only.
#   bash scripts/deploy.sh down           Stop and remove the local stack.
#   bash scripts/deploy.sh help           Show this help.
#
# The local target reads .config/docker/compose.defaults.env for sane defaults;
# a present repo-root .env is layered on top and wins (override any value there).
# ----------------------------------------------------------------------------
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/.config/docker/docker-compose.yml"
DEFAULTS_ENV="${REPO_ROOT}/.config/docker/compose.defaults.env"
ROOT_ENV="${REPO_ROOT}/.env"

# --- pretty output -----------------------------------------------------------
info()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()   { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Styx — one-command deploy

Usage: bash scripts/deploy.sh <target>

Targets:
  local     Build + run the full stack locally (API + Web + PostgreSQL + Redis)
            via Docker Compose. Zero config needed.
  render    Trigger a production deploy on Render (mirrors deploy.yml).
            Requires RENDER_API_KEY, RENDER_API_SERVICE_ID, RENDER_WEB_SERVICE_ID.
  build     Build the API + Web Docker images only.
  down      Stop and remove the local stack.
  logs      Tail logs from the local stack.
  help      Show this help.

The local target reads .config/docker/compose.defaults.env for sane defaults;
a present repo-root .env is layered on top and wins (override any value there).
EOF
}

# --- compose helpers ---------------------------------------------------------
require_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed or not on PATH."
  docker compose version >/dev/null 2>&1 || die "docker compose v2 is required (got an older docker)."
}

# Build the `docker compose` argument list: defaults env first, then .env so a
# user-provided .env overrides the defaults.
compose() {
  local args=(--env-file "$DEFAULTS_ENV")
  if [ -f "$ROOT_ENV" ]; then
    args+=(--env-file "$ROOT_ENV")
  fi
  args+=(-f "$COMPOSE_FILE")
  docker compose "${args[@]}" "$@"
}

# Read a value from the resolved env (defaults overridden by .env).
env_value() {
  local key="$1" val=""
  [ -f "$DEFAULTS_ENV" ] && val="$(grep -E "^${key}=" "$DEFAULTS_ENV" | tail -n1 | cut -d= -f2- || true)"
  if [ -f "$ROOT_ENV" ]; then
    local override
    override="$(grep -E "^${key}=" "$ROOT_ENV" | tail -n1 | cut -d= -f2- || true)"
    [ -n "$override" ] && val="$override"
  fi
  printf '%s' "$val"
}

wait_for_http() {
  local url="$1" name="$2" attempts="${3:-30}" i
  info "Waiting for ${name} at ${url} ..."
  for i in $(seq 1 "$attempts"); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      ok "${name} is up."
      return 0
    fi
    sleep 3
  done
  warn "${name} did not become healthy after $((attempts * 3))s — check logs with: bash scripts/deploy.sh logs"
  return 1
}

# --- targets -----------------------------------------------------------------
deploy_local() {
  require_docker
  [ -f "$COMPOSE_FILE" ] || die "compose file not found: $COMPOSE_FILE"
  [ -f "$DEFAULTS_ENV" ] || die "defaults env not found: $DEFAULTS_ENV"

  if [ -f "$ROOT_ENV" ]; then
    info "Layering repo-root .env over compose defaults."
  else
    warn "No repo-root .env found — using local dev defaults from compose.defaults.env."
  fi

  info "Building images and starting the Styx stack ..."
  compose up -d --build

  local api_port web_port
  api_port="$(env_value STYX_DOCKER_API_PORT)"; api_port="${api_port:-3000}"
  web_port="$(env_value STYX_DOCKER_WEB_PORT)"; web_port="${web_port:-3001}"

  wait_for_http "http://localhost:${api_port}/health" "API" 40 || true
  wait_for_http "http://localhost:${web_port}/" "Web" 40 || true

  echo
  ok "Styx is live:"
  printf '   API   → http://localhost:%s  (health: /health, docs: /api/docs)\n' "$api_port"
  printf '   Web   → http://localhost:%s\n' "$web_port"
  echo
  info "Logs:  bash scripts/deploy.sh logs    Stop:  bash scripts/deploy.sh down"
}

deploy_build() {
  require_docker
  info "Building API + Web images ..."
  compose build
  ok "Images built."
}

deploy_down() {
  require_docker
  info "Stopping the Styx stack ..."
  compose down
  ok "Stack stopped."
}

deploy_logs() {
  require_docker
  compose logs -f --tail=100
}

# Trigger a production deploy on Render. Mirrors .github/workflows/deploy.yml so
# you can deploy from a laptop without pushing a tag.
deploy_render() {
  : "${RENDER_API_KEY:?Set RENDER_API_KEY (Render dashboard → Account → API Keys).}"
  : "${RENDER_API_SERVICE_ID:?Set RENDER_API_SERVICE_ID (the styx-api service id, srv-...).}"
  : "${RENDER_WEB_SERVICE_ID:?Set RENDER_WEB_SERVICE_ID (the styx-web service id, srv-...).}"

  command -v curl >/dev/null 2>&1 || die "curl is required for Render deploys."

  trigger_render() {
    local service_id="$1" label="$2" code
    info "Triggering Render deploy for ${label} (${service_id}) ..."
    code="$(curl -sS -o /dev/null -w '%{http_code}' \
      -X POST "https://api.render.com/v1/services/${service_id}/deploys" \
      -H "Authorization: Bearer ${RENDER_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"clearCache":"do_not_clear"}')"
    case "$code" in
      2*) ok "${label} deploy accepted (HTTP ${code})." ;;
      *)  die "${label} deploy request failed (HTTP ${code}). Check RENDER_API_KEY / service id." ;;
    esac
  }

  trigger_render "$RENDER_API_SERVICE_ID" "styx-api"
  trigger_render "$RENDER_WEB_SERVICE_ID" "styx-web"

  echo
  ok "Render deploys triggered. Track progress in the Render dashboard."
  info "Migrations run via Render's pre-deploy command; verify with scripts/smoke/check-api-ready.sh."
}

# --- dispatch ----------------------------------------------------------------
main() {
  local target="${1:-help}"
  case "$target" in
    local)        deploy_local ;;
    render)       deploy_render ;;
    build)        deploy_build ;;
    down)         deploy_down ;;
    logs)         deploy_logs ;;
    help|-h|--help) usage ;;
    *) warn "Unknown target: ${target}"; echo; usage; exit 1 ;;
  esac
}

main "$@"
