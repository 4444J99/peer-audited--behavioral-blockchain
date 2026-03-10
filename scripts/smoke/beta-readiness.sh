#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

PROFILE="${READINESS_PROFILE:-beta}"
REQUIRE_TARGETS="${READINESS_REQUIRE_TARGETS:-false}"
OUTPUT_PATH="${READINESS_OUTPUT_PATH:-${REPO_ROOT}/artifacts/beta-readiness-summary.json}"
RUN_ID="${READINESS_RUN_ID:-beta-readiness-$(date -u +%Y%m%dT%H%M%SZ)}"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

TARGET_API_URL=""
TARGET_WEB_URL=""
TARGET_ENV_LABEL=""

case "${PROFILE}" in
  beta)
    TARGET_API_URL="${BETA_API_URL:-}"
    TARGET_WEB_URL="${BETA_WEB_URL:-}"
    TARGET_ENV_LABEL="${BETA_ENV_LABEL:-beta}"
    ;;
  staging)
    TARGET_API_URL="${STAGING_API_URL:-}"
    TARGET_WEB_URL="${STAGING_WEB_URL:-}"
    TARGET_ENV_LABEL="${STAGING_ENV_LABEL:-staging}"
    ;;
  *)
    TARGET_API_URL="${API_URL:-}"
    TARGET_WEB_URL="${WEB_URL:-}"
    TARGET_ENV_LABEL="${EXPECTED_ENV_LABEL:-${PROFILE}}"
    ;;
esac

mkdir -p "$(dirname "${OUTPUT_PATH}")"
GATE_ROWS_FILE="$(mktemp)"

cleanup() {
  rm -f "${GATE_ROWS_FILE}"
}
trap cleanup EXIT

OVERALL_STATUS="pass"

add_gate() {
  local name="$1"
  local status="$2"
  local duration_ms="$3"
  local message="$4"

  printf '%s\t%s\t%s\t%s\n' "${name}" "${status}" "${duration_ms}" "${message}" >> "${GATE_ROWS_FILE}"
}

mark_failure_if_required() {
  local required="$1"
  if [[ "${required}" == "true" ]]; then
    OVERALL_STATUS="fail"
  fi
}

mark_incomplete_if_required() {
  local required="$1"
  if [[ "${required}" == "true" && "${OVERALL_STATUS}" != "fail" ]]; then
    OVERALL_STATUS="incomplete"
  fi
}

run_gate() {
  local name="$1"
  local required="$2"
  shift 2

  local started_epoch ended_epoch duration_ms code status message
  started_epoch="$(date +%s)"

  set +e
  "$@"
  code=$?
  set -e

  ended_epoch="$(date +%s)"
  duration_ms=$(((ended_epoch - started_epoch) * 1000))

  if [[ "${code}" -eq 0 ]]; then
    status="passed"
    message="ok"
  elif [[ "${code}" -eq 2 ]]; then
    status="skipped"
    message="not verified (exit code 2)"
    if [[ "${required}" == "true" && "${REQUIRE_TARGETS}" == "true" ]]; then
      OVERALL_STATUS="fail"
    else
      mark_incomplete_if_required "${required}"
    fi
  else
    status="failed"
    message="exit code ${code}"
    mark_failure_if_required "${required}"
  fi

  add_gate "${name}" "${status}" "${duration_ms}" "${message}"
}

skip_gate() {
  local name="$1"
  local required="$2"
  local message="$3"

  add_gate "${name}" "skipped" "0" "${message}"
  if [[ "${required}" == "true" && "${REQUIRE_TARGETS}" == "true" ]]; then
    OVERALL_STATUS="fail"
  else
    mark_incomplete_if_required "${required}"
  fi
}

cd "${REPO_ROOT}"

echo ""
echo "-------------------------------------------"
echo "  Styx Beta Readiness"
echo "  Profile: ${PROFILE}"
echo "  Require targets: ${REQUIRE_TARGETS}"
echo "-------------------------------------------"
echo ""

# ── Remote target gates (require deployed environment) ──

if [[ -z "${TARGET_API_URL}" ]]; then
  skip_gate "target_api" "true" "missing target API URL for profile '${PROFILE}'"
else
  export API_URL="${TARGET_API_URL%/}"
  export EXPECTED_ENV_LABEL="${TARGET_ENV_LABEL}"

  run_gate "api_ready" "true" bash "${SCRIPT_DIR}/check-api-ready.sh"
  run_gate "api_release_meta" "true" bash "${SCRIPT_DIR}/check-api-release.sh"

  if [[ -n "${TARGET_WEB_URL}" ]]; then
    export WEB_URL="${TARGET_WEB_URL%/}"
    run_gate "web_availability" "false" bash "${SCRIPT_DIR}/check-web.sh"
  else
    skip_gate "web_availability" "false" "missing optional web URL"
  fi

  run_gate "critical_endpoints" "true" bash "${SCRIPT_DIR}/check-endpoints.sh"

  # Integration gates (require live API)
  run_gate "ledger_invariant" "true" npx tsx scripts/validation/01-phantom-money-check.ts
  run_gate "behavioral_constants" "false" npx tsx scripts/validation/05-behavioral-physics-check.ts
fi

# ── Local gates (run regardless of remote targets) ──

run_gate "build_check" "true" bash scripts/validation/04-redacted-build-check.sh
run_gate "security_invariants" "true" npx tsx scripts/validation/06-security-invariant-check.ts
run_gate "claim_drift" "true" node scripts/validation/07-claim-drift-check.js

FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

python3 - "${GATE_ROWS_FILE}" "${OUTPUT_PATH}" "${RUN_ID}" "${PROFILE}" "${STARTED_AT}" "${FINISHED_AT}" "${OVERALL_STATUS}" <<'PY'
import json
import sys
from pathlib import Path

rows_path, output_path, run_id, profile, started_at, finished_at, overall_status = sys.argv[1:8]

gates = []
with open(rows_path, "r", encoding="utf-8") as handle:
    for raw in handle:
        raw = raw.rstrip("\n")
        if not raw:
            continue
        name, status, duration_ms, message = raw.split("\t", 3)
        gates.append(
            {
                "name": name,
                "status": status,
                "durationMs": int(duration_ms),
                "message": message,
            }
        )

payload = {
    "runId": run_id,
    "profile": profile,
    "startedAt": started_at,
    "finishedAt": finished_at,
    "overallStatus": overall_status,
    "gates": gates,
}

Path(output_path).parent.mkdir(parents=True, exist_ok=True)
with open(output_path, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, indent=2)
    handle.write("\n")
PY

PASSED_COUNT="$(awk -F '\t' '$2=="passed"{c++} END{print c+0}' "${GATE_ROWS_FILE}")"
FAILED_COUNT="$(awk -F '\t' '$2=="failed"{c++} END{print c+0}' "${GATE_ROWS_FILE}")"
SKIPPED_COUNT="$(awk -F '\t' '$2=="skipped"{c++} END{print c+0}' "${GATE_ROWS_FILE}")"

echo ""
echo "-------------------------------------------"
echo "  Beta Readiness Summary"
echo "  Passed:  ${PASSED_COUNT}"
echo "  Failed:  ${FAILED_COUNT}"
echo "  Skipped: ${SKIPPED_COUNT}"
echo "  Overall: ${OVERALL_STATUS}"
echo "  Artifact: ${OUTPUT_PATH}"
echo "-------------------------------------------"
echo ""

if [[ "${OVERALL_STATUS}" == "fail" ]]; then
  exit 1
fi

exit 0
