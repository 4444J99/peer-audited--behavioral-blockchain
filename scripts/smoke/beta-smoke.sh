#!/usr/bin/env bash
set -euo pipefail

: "${BETA_API_URL:?BETA_API_URL is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export API_URL="${BETA_API_URL}"
export EXPECTED_ENV_LABEL="${BETA_ENV_LABEL:-beta}"
bash "${SCRIPT_DIR}/check-api-ready.sh"
bash "${SCRIPT_DIR}/check-api-release.sh"

if [ -n "${BETA_WEB_URL:-}" ]; then
  export WEB_URL="${BETA_WEB_URL}"
  # Render deploys can remain in a transient 502 state for a couple of minutes
  # while the new web instance is still building and warming.
  MAX_ATTEMPTS="${BETA_WEB_MAX_ATTEMPTS:-24}" \
  INTERVAL_SECONDS="${BETA_WEB_INTERVAL_SECONDS:-10}" \
    bash "${SCRIPT_DIR}/check-web.sh"
else
  echo "::warning::BETA_WEB_URL not set; skipping beta web smoke."
fi

bash "${SCRIPT_DIR}/check-endpoints.sh"
