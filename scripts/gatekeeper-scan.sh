#!/usr/bin/env bash
set -euo pipefail

# Gatekeeper Scan — Validation Gate #4
# Scans built binaries and bundles for forbidden gambling terminology.
# In "Redacted Mode" builds (iOS/Android), themed terms must be replaced
# by the Linguistic Middleware with neutral equivalents.
#
# Usage: ./scripts/gatekeeper-scan.sh [directory]
# Default directory: dist/

SCAN_DIR="${1:-dist/}"
EXIT_CODE=0

# Forbidden terms → neutral replacements (reference only; this script detects, doesn't replace)
declare -A FORBIDDEN_TERMS=(
  ["Fury"]="Reviewer"
  ["Bounty"]="Reward"
  ["Stake"]="Deposit"
  ["Wager"]="Commitment"
  ["Gamble"]="Challenge"
  ["Betting"]="Contracting"
  ["Casino"]="Platform"
  ["Jackpot"]="Bonus"
  ["Odds"]="Probability"
  ["Payout"]="Distribution"
)

echo "╔══════════════════════════════════════════════════╗"
echo "║          STYX GATEKEEPER SCAN v1.0              ║"
echo "║     Redacted Mode Terminology Validator         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Scanning: ${SCAN_DIR}"
echo "────────────────────────────────────────────────────"

if [[ ! -d "$SCAN_DIR" ]]; then
  echo "⚠️  Directory '${SCAN_DIR}' does not exist. Build first."
  echo "   Run: make build"
  exit 1
fi

TOTAL_VIOLATIONS=0

for term in "${!FORBIDDEN_TERMS[@]}"; do
  neutral="${FORBIDDEN_TERMS[$term]}"
  
  # Search for the term (case-insensitive) in JS/HTML/CSS bundles
  # Exclude: source maps, node_modules, .git, images, fonts
  matches=$(grep -rli "${term}" "${SCAN_DIR}" \
    --include="*.js" \
    --include="*.html" \
    --include="*.css" \
    --include="*.json" \
    --exclude-dir="node_modules" \
    --exclude-dir=".git" \
    --exclude="*.map" \
    2>/dev/null || true)

  if [[ -n "$matches" ]]; then
    count=$(echo "$matches" | wc -l | tr -d ' ')
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + count))
    echo "❌ FORBIDDEN: '${term}' found in ${count} file(s) (should be '${neutral}')"
    echo "$matches" | head -5 | sed 's/^/   → /'
    if [[ $count -gt 5 ]]; then
      echo "   → ... and $((count - 5)) more"
    fi
    EXIT_CODE=1
  else
    echo "✅ CLEAN: '${term}' — not found"
  fi
done

echo ""
echo "────────────────────────────────────────────────────"
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅ GATEKEEPER PASSED — No forbidden terminology detected."
  echo "   Binary is safe for App Store submission."
else
  echo "❌ GATEKEEPER FAILED — ${TOTAL_VIOLATIONS} violation(s) found."
  echo "   Run the Linguistic Middleware to replace forbidden terms."
  echo "   See: docs/architecture/linguistic-middleware.md"
fi

exit $EXIT_CODE
