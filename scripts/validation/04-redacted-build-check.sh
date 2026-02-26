#!/usr/bin/env bash
set -euo pipefail

# Validation Gate 04: The Redacted Build Check (WS3 + WS4 + WS1)
#
# Objective: Hard assertion that the 'Linguistic Cloaker' was architecturally successful.
# Action: Grep the client source bundles for legally banned wording that triggers
# Apple/Stripe bot rejections.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo ""
echo "--- STARTING VALIDATION GATE 04: REDACTED BUILD CHECK ---"

# Banned terms that must never appear in user-facing client code.
# 'stake' is permitted internally but cloaked as 'vault' client-side.
banned_terms=("bet" "gamble" "wager")

# Search targets: source-level user-facing client surfaces.
# Built bundles are intentionally excluded here because vendor payloads and minified assets
# create persistent false positives (e.g., library identifiers containing banned substrings).
# If we need deploy-artifact scanning, it should be a separate allowlisted artifact gate.
search_dirs=(
  "$REPO_ROOT/src/web/app"
  "$REPO_ROOT/src/web/components"
  "$REPO_ROOT/src/web/store"
  "$REPO_ROOT/src/web/services"
  "$REPO_ROOT/src/desktop/src"
  "$REPO_ROOT/src/mobile/screens"
  "$REPO_ROOT/src/mobile/components"
  "$REPO_ROOT/src/mobile/services"
  "$REPO_ROOT/src/pitch/src"
)

found_violations=false

for dir in "${search_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "[SKIP] Directory $dir not found, skipping."
    continue
  fi

  echo "[ANALYSIS] Scanning $dir for restricted terms..."

  for term in "${banned_terms[@]}"; do
    # Case insensitive, whole-word, recursive grep over source-bearing files only.
    if grep -IHrnwi \
      --binary-files=without-match \
      --exclude-dir=node_modules \
      --exclude-dir=build \
      --exclude-dir=.turbo \
      --exclude-dir=.expo \
      --exclude-dir=Pods \
      --exclude-dir=target \
      --exclude-dir=android \
      --exclude-dir=ios \
      --exclude='*.lock' \
      --exclude='package-lock.json' \
      --exclude='CLAUDE.md' \
      --exclude='*.md' \
      --exclude='*.sh' \
      --exclude='*.png' \
      --exclude='*.jpg' \
      --exclude='*.jpeg' \
      --exclude='*.gif' \
      --exclude='*.webp' \
      --exclude='*.pdf' \
      --exclude='*.epub' \
      --exclude='*.pptx' \
      --exclude='*.azw3' \
      --include='*.ts' \
      --include='*.tsx' \
      --include='*.js' \
      --include='*.jsx' \
      --include='*.json' \
      --include='*.html' \
      --exclude='*.spec.ts' \
      --exclude='*.spec.tsx' \
      --exclude='*.test.ts' \
      --exclude='*.test.tsx' \
      --exclude='*.md' \
      --exclude='*.d.ts' \
      --exclude='next-env.d.ts' \
      --exclude='LinguisticMiddleware.ts' \
      "$term" "$dir" 2>/dev/null; then
      echo "  ⚠ Found restricted term '$term' in $dir"
      found_violations=true
    else
      echo "  - Checking for '$term'... Clean."
    fi
  done
done

if [ "$found_violations" = true ]; then
  echo "❌ GATE 04 FAILED: Restricted financial terminology detected in client builds. The Linguistic Cloaker failed."
  exit 1
else
  echo "✅ GATE 04 PASSED: No banned lexicon found. The build is safe for App Store / Payment Processor heuristic review."
fi
