#!/usr/bin/env bash
# Full local-demo gate: API/browser behavior is verified over HTTP and the
# seeded database is checked from inside the same named Compose project.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
native_state="$repo_root/artifacts/styx-demo-native.env"

if [ -f "$native_state" ]; then
  source "$native_state"
  STYX_DEMO_API_URL="$STYX_DEMO_API_URL" STYX_DEMO_WEB_URL="$STYX_DEMO_WEB_URL" node "$repo_root/scripts/demo/verify-live-stack.mjs"
  database_count="$(psql -d "$STYX_DEMO_DATABASE" -Atqc "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email = 'hr.lead@acheron.example';")"
else
  compose_file="$repo_root/.config/docker/docker-compose.yml"
  defaults_env="$repo_root/.config/docker/compose.defaults.env"
  project_name="${STYX_DEMO_COMPOSE_PROJECT:-styx-demo}"
  command -v docker >/dev/null 2>&1 || {
    echo "FAIL: launch the native demo with npm run demo:launch, or install Docker Compose." >&2
    exit 1
  }
  node "$repo_root/scripts/demo/verify-live-stack.mjs"
  database_count="$(docker compose --project-name "$project_name" --env-file "$defaults_env" -f "$compose_file" exec -T styx-postgres psql -Atq -v ON_ERROR_STOP=1 -U styx -d styx -c "SELECT count(*) FROM users WHERE email LIKE '%@demo.styx.protocol' OR email = 'hr.lead@acheron.example';")"
fi
if [ "$database_count" -lt 12 ]; then
  echo "FAIL: synthetic database seed is incomplete (expected at least 12 demo users, got $database_count)." >&2
  exit 1
fi

echo "PASS: synthetic database contains $database_count demo identities; no live payment data was queried."
