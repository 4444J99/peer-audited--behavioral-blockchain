#!/usr/bin/env bash
set -euo pipefail

: "${STAGING_API_URL:?STAGING_API_URL is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export API_URL="${STAGING_API_URL}"
export EXPECTED_ENV_LABEL="${STAGING_ENV_LABEL:-staging}"
bash "${SCRIPT_DIR}/check-api-ready.sh"
bash "${SCRIPT_DIR}/check-api-release.sh"

if [ -n "${STAGING_WEB_URL:-}" ]; then
  export WEB_URL="${STAGING_WEB_URL}"
  bash "${SCRIPT_DIR}/check-web.sh"
else
  echo "::warning::STAGING_WEB_URL not set; skipping staging web smoke."
fi
