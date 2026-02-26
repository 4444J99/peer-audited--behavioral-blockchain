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
  bash "${SCRIPT_DIR}/check-web.sh"
else
  echo "::warning::BETA_WEB_URL not set; skipping beta web smoke."
fi
