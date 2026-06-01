#!/bin/bash
set -euo pipefail
# reconcile.sh — MANDATORY gate after every batch
# Usage: reconcile.sh <batch-id>
# Exits 0 only when: all issues accounted for, no CLOSED without evidence,
# no UNREAD remaining, tests passed. HARD STOP on any failure.

BATCH_ID="$1"
TRIAGE_FILE="docs/triage.json"
ERRORS=0

if [[ ! -f "$TRIAGE_FILE" ]]; then
  echo "FAIL: $TRIAGE_FILE not found."
  exit 1
fi

echo "═══ RECONCILE: $BATCH_ID ═══"
echo ""

# 1. Batch exists?
BATCH_EXISTS=$(jq -r ".batches[] | select(.id == \"$BATCH_ID\") | .id" "$TRIAGE_FILE")
if [[ -z "$BATCH_EXISTS" ]]; then
  echo "FAIL: batch $BATCH_ID not found in triage.json."
  exit 2
fi

# 2. Count match: declared vs actual
DECLARED=$(jq -r ".batches[] | select(.id == \"$BATCH_ID\") | .issues | length" "$TRIAGE_FILE")
ACTUAL=$(jq -r "[.issues | to_entries[] | select(.value.batch == \"$BATCH_ID\")] | length" "$TRIAGE_FILE")
echo "  Declared: $DECLARED  Actual: $ACTUAL"
if [[ "$DECLARED" != "$ACTUAL" ]]; then
  echo "  FAIL: count mismatch — $((DECLARED - ACTUAL)) orphans detected"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS: count matches"
fi

# 3. No CLOSED without evidence
NO_EVIDENCE=$(jq -r '[.issues | to_entries[] | select(.value.batch == "'"$BATCH_ID"'" and .value.state == "CLOSED" and .value.evidence == null)] | length' "$TRIAGE_FILE")
echo "  CLOSED without evidence: $NO_EVIDENCE"
if [[ "$NO_EVIDENCE" != "0" ]]; then
  jq -r '.issues | to_entries[] | select(.value.batch == "'"$BATCH_ID"'" and .value.state == "CLOSED" and .value.evidence == null) | "    #\(.key): \(.value.title)"' "$TRIAGE_FILE"
  ERRORS=$((ERRORS + 1))
fi

# 4. No UNREAD remaining
UNREAD=$(jq -r '[.issues | to_entries[] | select(.value.batch == "'"$BATCH_ID"'" and .value.state == "UNREAD")] | length' "$TRIAGE_FILE")
echo "  Still UNREAD: $UNREAD"
if [[ "$UNREAD" != "0" ]]; then
  jq -r '.issues | to_entries[] | select(.value.batch == "'"$BATCH_ID"'" and .value.state == "UNREAD") | "    #\(.key): \(.value.title)"' "$TRIAGE_FILE"
  ERRORS=$((ERRORS + 1))
fi

# 5. Tests must pass
TESTED=$(jq -r ".batches[] | select(.id == \"$BATCH_ID\") | .test_passed" "$TRIAGE_FILE")
echo "  Tests passed: $TESTED"
if [[ "$TESTED" != "true" ]]; then
  echo "  FAIL: tests not verified for this batch"
  ERRORS=$((ERRORS + 1))
fi

echo ""

if [[ "$ERRORS" -eq 0 ]]; then
  # Mark reconciled
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  jq --arg id "$BATCH_ID" --arg ts "$TIMESTAMP" \
    '(.batches[] | select(.id == $id) | .reconciled) = true |
      (.batches[] | select(.id == $id) | .completed) = $ts' \
    "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"
  echo "PASS: batch $BATCH_ID reconciled. 0 errors."
  exit 0
else
  echo "FAIL: $ERRORS error(s) found. Fix before proceeding."
  exit 1
fi
