#!/usr/bin/env bash
# Only an explicitly absent target permits offline-only PR validation.
set -uo pipefail
if [[ "$#" -eq 0 ]]; then set -- npx tsx scripts/validation/05-behavioral-physics-check.ts; fi
"$@"
code=$?
if [[ "$code" -eq 2 && -z "${API_URL:-}" ]]; then
  echo 'Gate 05: offline constants checked; live integration NOT VERIFIED (no target configured)'
  exit 0
fi
exit "$code"
