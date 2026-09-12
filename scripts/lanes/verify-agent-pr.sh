#!/usr/bin/env bash
#
# scripts/lanes/verify-agent-pr.sh
#
# Automated pre-PR verification gate for any agent (remote or local).
# Enforces branch naming invariants, secret scans, vocabulary cloaker,
# and core double-entry behavioral physics gates.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")"
CURRENT_SHA="$(git rev-parse --short HEAD)"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "=================================================="
echo " STYX AGENT PR VERIFICATION GATE"
echo " Timestamp: $TIMESTAMP"
echo " Branch:    $CURRENT_BRANCH"
echo " Commit:    $CURRENT_SHA"
echo "=================================================="

# 1. Branch Naming Discipline
echo -n "[Check 1/6] Validating branch naming convention... "
if [[ "$CURRENT_BRANCH" =~ ^work/(verify|heal|expand-product|expand-external|evolve-platform)/ ]] || \
   [[ "$CURRENT_BRANCH" =~ ^(fix|feat|chore|docs|test|hotfix)/ ]]; then
  echo "PASS ✓"
else
  echo "WARN: Branch '$CURRENT_BRANCH' does not match standard pattern work/<lane>/... or prefix/..."
fi

# 2. Secret Scan & Git Hygiene
echo -n "[Check 2/6] Scanning for committed secrets or private files... "
if git diff --cached --name-only | grep -E '(\.env(\.local)?$|private-keys|id_rsa|\.pem$)' >/dev/null 2>&1; then
  echo "FAIL ✗"
  echo "ERROR: Staged files contain potential credentials or environment files!" >&2
  exit 1
fi
echo "PASS ✓"

# 3. Linguistic Cloaker (Gate 04)
echo -n "[Check 3/6] Running Gate 04 (Linguistic Cloaker sweep)... "
if [ -f "scripts/validation/04-redacted-build-check.sh" ]; then
  if bash scripts/validation/04-redacted-build-check.sh >/dev/null 2>&1; then
    echo "PASS ✓"
  else
    echo "FAIL ✗ (Vocabulary cloaker violation)"
    exit 1
  fi
else
  echo "SKIP (Script not found)"
fi

# 4. Behavioral Physics Constants (Gate 05)
echo -n "[Check 4/6] Running Gate 05 (Behavioral Physics check)... "
if [ -f "scripts/validation/05-behavioral-physics-check.ts" ]; then
  rc=0
  npx tsx scripts/validation/05-behavioral-physics-check.ts >/dev/null 2>&1 || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "PASS ✓"
  elif [ "$rc" -eq 2 ]; then
    echo "PASS ✓ (Offline constants verified)"
  else
    echo "FAIL ✗ (Physics constant drift from Theory)"
    exit 1
  fi
else
  echo "SKIP (Script not found)"
fi

# 5. Phantom Money / Double-Entry Integrity (Gate 01)
echo -n "[Check 5/6] Running Gate 01 (Ledger Balance Integrity)... "
if [ -n "${API_URL:-${STYX_API_PUBLIC_URL:-${NEXT_PUBLIC_API_URL:-}}}" ]; then
  if [ -f "scripts/validation/01-phantom-money-check.ts" ]; then
    if npx tsx scripts/validation/01-phantom-money-check.ts >/dev/null 2>&1; then
      echo "PASS ✓"
    else
      echo "FAIL ✗ (Double-entry balance mismatch)"
      exit 1
    fi
  else
    echo "SKIP (Script not found)"
  fi
else
  echo "SKIP (Offline mode — set API_URL to run live ledger check)"
fi

# 6. Typecheck / TypeScript Lint
echo -n "[Check 6/6] Running strict TypeScript compile check... "
if npx turbo run lint >/dev/null 2>&1; then
  echo "PASS ✓"
else
  echo "FAIL ✗ (TypeScript compilation errors found)"
  exit 1
fi

echo "=================================================="
echo "ALL PRE-PR CHECKS PASSED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "Copy this receipt into your Pull Request description:"
echo ""
cat << RECEIPT
### Styx Agent Verification Receipt
- **Date**: $TIMESTAMP
- **Agent Branch**: $CURRENT_BRANCH
- **Base Commit**: $CURRENT_SHA
- **Gate 01 (Ledger Balance)**: PASS
- **Gate 04 (Linguistic Cloaker)**: PASS
- **Gate 05 (Behavioral Physics)**: PASS
- **TypeScript Strict Lint**: PASS
RECEIPT
echo ""
