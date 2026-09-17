#!/usr/bin/env bash
# PR-only adapter. Never use this adapter to authorize beta promotion.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
set +e
bash scripts/smoke/beta-readiness.sh
code=$?
set -e
if [[ "$code" -eq 2 && "${READINESS_REQUIRE_TARGETS:-true}" == false ]]; then
  # Do not turn an unexpected exit 2 or missing/corrupt receipt into a green gate.
  node - "${READINESS_OUTPUT_PATH:-artifacts/beta-readiness-summary.json}" <<'JS'
const fs = require('node:fs');
const result = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (result.overallStatus !== 'incomplete' || !Array.isArray(result.gates) ||
    !result.gates.some(g => g.required && g.status === 'skipped') ||
    result.gates.some(g => g.required && g.status === 'failed')) {
  throw new Error('Exit 2 does not match an incomplete readiness receipt');
}
JS
  echo '::warning::Beta readiness INCOMPLETE. PR offline checks may proceed; no live readiness or promotion claim.'
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo 'Beta readiness: **INCOMPLETE**. See beta-readiness-summary.json. This is not a beta promotion receipt.' >> "$GITHUB_STEP_SUMMARY"
  fi
  exit 0
fi
exit "$code"
