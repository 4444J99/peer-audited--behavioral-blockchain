#!/usr/bin/env bash
# Records the signed-in rehearsal fallback named by docs/demo/jessica-demo-runbook.md.
# It runs the full live-stack gate first, so the recording cannot exist without a
# passing verification on the same commit. Sessions are established off camera and
# the synthetic password is passed by environment only -- never argv, never stdout.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
native_state="$repo_root/artifacts/styx-demo-native.env"
local_password_file="$repo_root/artifacts/styx-demo-local.env"

# Fail on a missing encoder in one second rather than after the multi-minute gate.
command -v ffmpeg >/dev/null 2>&1 || {
  echo "FAIL: ffmpeg is required to record the signed-in rehearsal. Install ffmpeg, then retry." >&2
  exit 1
}

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
  native_demo_password=""
  local key value
  while IFS='=' read -r key value; do
    case "$key" in
      STYX_DEMO_NATIVE) [ "$value" = "1" ] || { echo "FAIL: invalid native demo state marker." >&2; exit 1; } ;;
      STYX_DEMO_API_URL) native_api_url="$value" ;;
      STYX_DEMO_WEB_URL) native_web_url="$value" ;;
      STYX_DEMO_DATABASE|STYX_DEMO_REDIS_PORT|STYX_DEMO_REDIS_MANAGED|STYX_DEMO_REDIS_PID|STYX_DEMO_API_PID|STYX_DEMO_WEB_PID) ;;
      STYX_DEMO_PASSWORD) native_demo_password="$value" ;;
      "") ;;
      *) echo "FAIL: unrecognized native demo state key: $key" >&2; exit 1 ;;
    esac
  done < "$native_state"
  [[ "$native_api_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || { echo "FAIL: invalid native API URL in state." >&2; exit 1; }
  [[ "$native_web_url" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || { echo "FAIL: invalid native web URL in state." >&2; exit 1; }
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

# The runbook forbids presenting an unverified signed-in route, so the gate is part
# of this command rather than a step a presenter is trusted to have run first.
echo "▸ Running the live-stack gate before recording ..."
bash "$repo_root/scripts/demo/verify-live-stack.sh"

if [ -f "$native_state" ]; then
  read_native_state
  demo_api_url="$native_api_url"
  demo_web_url="$native_web_url"
  demo_password="$native_demo_password"
else
  command -v docker >/dev/null 2>&1 || {
    echo "FAIL: launch the native demo with npm run demo:launch, or install Docker Compose." >&2
    exit 1
  }
  api_port="$(compose_env_value STYX_DOCKER_API_PORT)"
  web_port="$(compose_env_value STYX_DOCKER_WEB_PORT)"
  api_port="${api_port:-3000}"
  web_port="${web_port:-3001}"
  demo_password="${STYX_DEMO_PASSWORD:-}"
  [ -n "$demo_password" ] || read_local_demo_password || {
    echo "FAIL: launch or reset the demo before recording it." >&2
    exit 1
  }
  demo_api_url="http://127.0.0.1:${api_port}"
  demo_web_url="http://127.0.0.1:${web_port}"
fi

demo_commit="$(git -C "$repo_root" rev-parse --short HEAD)"
if ! git -C "$repo_root" diff --quiet HEAD -- || [ -n "$(git -C "$repo_root" ls-files --others --exclude-standard)" ]; then
  demo_commit="${demo_commit} (working tree modified)"
fi

# Match scripts/demo/native.sh: the demo's Node is 24, not whatever `node` on
# PATH happens to be (this machine's default is 22).
node24() {
  if command -v mise >/dev/null 2>&1; then
    mise x node@24 -- "$@"
  else
    "$@"
  fi
}

STYX_DEMO_API_URL="$demo_api_url" \
STYX_DEMO_WEB_URL="$demo_web_url" \
STYX_DEMO_PASSWORD="$demo_password" \
STYX_DEMO_COMMIT="$demo_commit" \
  node24 node "$repo_root/scripts/demo/capture-signed-in-rehearsal.mjs"
