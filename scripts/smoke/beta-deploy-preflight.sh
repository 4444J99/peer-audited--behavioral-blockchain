#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

GITHUB_REPO="${GITHUB_REPO:-organvm-iii-ergon/peer-audited--behavioral-blockchain}"
GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-beta}"
OUTPUT_PATH="${BETA_DEPLOY_PREFLIGHT_OUTPUT_PATH:-${REPO_ROOT}/artifacts/release/evidence--beta-deploy-preflight.md}"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

required_env_secrets=(
  "RENDER_API_KEY"
  "RENDER_BETA_API_SERVICE_ID"
  "RENDER_BETA_WEB_SERVICE_ID"
  "BETA_API_URL"
  "BETA_WEB_URL"
  "BETA_DATABASE_URL"
)

optional_env_secrets=(
  "BETA_ENV_LABEL"
)

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 1
  fi
}

has_name() {
  local haystack="$1"
  local needle="$2"
  [[ -n "${haystack}" ]] && printf '%s\n' "${haystack}" | grep -qx "${needle}"
}

secret_command() {
  local name="$1"
  printf "printf 'REPLACE_ME' | gh secret set %s --env %s --repo %s" "${name}" "${GITHUB_ENVIRONMENT}" "${GITHUB_REPO}"
}

require_cmd gh
require_cmd python3

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated." >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_PATH}")"

ENVIRONMENT_EXISTS="no"
if gh api "repos/${GITHUB_REPO}/environments/${GITHUB_ENVIRONMENT}" >/dev/null 2>&1; then
  ENVIRONMENT_EXISTS="yes"
fi

REPO_SECRET_NAMES="$(gh secret list --repo "${GITHUB_REPO}" 2>/dev/null | awk 'NF {print $1}' || true)"
ENV_SECRET_NAMES="$(gh secret list --env "${GITHUB_ENVIRONMENT}" --repo "${GITHUB_REPO}" 2>/dev/null | awk 'NF {print $1}' || true)"
ENV_VARIABLE_NAMES="$(gh variable list --env "${GITHUB_ENVIRONMENT}" --repo "${GITHUB_REPO}" 2>/dev/null | awk 'NF {print $1}' || true)"

REPO_SECRET_COUNT="$(printf '%s\n' "${REPO_SECRET_NAMES}" | awk 'NF{c++} END{print c+0}')"
ENV_SECRET_COUNT="$(printf '%s\n' "${ENV_SECRET_NAMES}" | awk 'NF{c++} END{print c+0}')"
ENV_VARIABLE_COUNT="$(printf '%s\n' "${ENV_VARIABLE_NAMES}" | awk 'NF{c++} END{print c+0}')"

readiness_summary="$(
python3 - "${REPO_ROOT}/artifacts/beta-readiness-summary.json" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.exists():
    print("missing|0|0|0")
    raise SystemExit(0)

payload = json.loads(path.read_text())
gates = payload.get("gates", [])
passed = sum(1 for gate in gates if gate.get("status") == "passed")
failed = sum(1 for gate in gates if gate.get("status") == "failed")
skipped = sum(1 for gate in gates if gate.get("status") == "skipped")
print(f"{payload.get('overallStatus', 'unknown')}|{passed}|{failed}|{skipped}")
PY
)"

IFS='|' read -r READINESS_STATUS READINESS_PASSED READINESS_FAILED READINESS_SKIPPED <<< "${readiness_summary}"

{
  echo "# Beta Deploy Preflight ($(date +%F))"
  echo ""
  echo "- repo: \`${GITHUB_REPO}\`"
  echo "- environment: \`${GITHUB_ENVIRONMENT}\`"
  echo "- started: \`${STARTED_AT}\`"
  echo "- readiness artifact status: \`${READINESS_STATUS}\`"
  echo "- readiness counts: passed \`${READINESS_PASSED}\`, failed \`${READINESS_FAILED}\`, skipped \`${READINESS_SKIPPED}\`"
  echo ""
  echo "## Environment State"
  echo ""
  echo "- GitHub environment exists: \`${ENVIRONMENT_EXISTS}\`"
  echo "- repo-level secrets visible via CLI: \`${REPO_SECRET_COUNT}\`"
  echo "- environment secrets visible via CLI: \`${ENV_SECRET_COUNT}\`"
  echo "- environment variables visible via CLI: \`${ENV_VARIABLE_COUNT}\`"
  echo ""
  echo "## Required Environment Secrets"
  echo ""
  echo "| Name | Present | Next CLI command if missing |"
  echo "|---|---|---|"
  for secret_name in "${required_env_secrets[@]}"; do
    if has_name "${ENV_SECRET_NAMES}" "${secret_name}" || has_name "${REPO_SECRET_NAMES}" "${secret_name}"; then
      present="yes"
      next_command="already set"
    else
      present="no"
      next_command="\`$(secret_command "${secret_name}")\`"
    fi
    echo "| \`${secret_name}\` | \`${present}\` | ${next_command} |"
  done
  echo ""
  echo "## Optional Environment Secrets"
  echo ""
  echo "| Name | Present | Next CLI command if missing |"
  echo "|---|---|---|"
  for secret_name in "${optional_env_secrets[@]}"; do
    if has_name "${ENV_SECRET_NAMES}" "${secret_name}" || has_name "${REPO_SECRET_NAMES}" "${secret_name}"; then
      present="yes"
      next_command="already set"
    else
      present="no"
      next_command="\`$(secret_command "${secret_name}")\`"
    fi
    echo "| \`${secret_name}\` | \`${present}\` | ${next_command} |"
  done
  echo ""
  echo "## Notes"
  echo ""
  echo "- The beta promotion workflow now checks \`RENDER_API_KEY\`, \`RENDER_BETA_API_SERVICE_ID\`, \`RENDER_BETA_WEB_SERVICE_ID\`, \`BETA_API_URL\`, \`BETA_WEB_URL\`, and \`BETA_DATABASE_URL\` before deploy."
  echo "- \`npm run beta:readiness\` now runs local gates even without deployed targets; strict mode still fails until target URLs exist."
  echo "- This audit only checks GitHub configuration presence. It cannot prove that the secret values point to live Render or database resources."
} > "${OUTPUT_PATH}"

echo "Wrote ${OUTPUT_PATH}"
