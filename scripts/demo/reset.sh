#!/usr/bin/env bash
# Recreate only the named Styx demo project from its synthetic seeds.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
source "$repo_root/scripts/demo/local-secrets.sh"
ensure_demo_secrets
verify_after_reset="${1:-}"
if [[ -n "$verify_after_reset" && "$verify_after_reset" != "verify" ]]; then
  echo "usage: bash scripts/demo/reset.sh [verify]" >&2
  exit 1
fi
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  STYX_TEST_MONEY_MODE=true \
    STYX_ENV_LABEL=local-canonical-demo \
    STYX_DEMO_RUNTIME=compose \
    STYX_DEMO_BYPASS_LOGIN_THROTTLE=true \
    bash scripts/deploy.sh reset
  if [[ "$verify_after_reset" == "verify" ]]; then
    exec bash scripts/demo/verify-live-stack.sh
  fi
  exit 0
fi

if [[ "$verify_after_reset" == "verify" ]]; then
  exec bash scripts/demo/native.sh reset-verify
fi
exec bash scripts/demo/native.sh reset
