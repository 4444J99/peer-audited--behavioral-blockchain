#!/usr/bin/env bash
# Recreate only the named Styx demo project from its synthetic seeds.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec bash scripts/deploy.sh reset
fi

exec bash scripts/demo/native.sh reset
