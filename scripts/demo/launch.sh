#!/usr/bin/env bash
# Start the private, synthetic Styx demo. Prefer the Docker Compose package when
# available; otherwise use the isolated native PostgreSQL/Redis fallback.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec bash scripts/deploy.sh local
fi

exec bash scripts/demo/native.sh launch
