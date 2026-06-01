#!/bin/bash
# report.sh — print the current triage dashboard
set -euo pipefail

TRIAGE_FILE="docs/triage.json"

if [[ ! -f "$TRIAGE_FILE" ]]; then
  echo "No triage.json found. Run batch-init.sh first."
  exit 1
fi

TOTAL=$(jq '.issues | length' "$TRIAGE_FILE")
CLOSED=$(jq '[.issues[] | select(.state == "CLOSED")] | length' "$TRIAGE_FILE")
UNREAD=$(jq '[.issues[] | select(.state == "UNREAD")] | length' "$TRIAGE_FILE")
INSPECTED=$(jq '[.issues[] | select(.state == "INSPECTED")] | length' "$TRIAGE_FILE")
BUILD_STARTED=$(jq '[.issues[] | select(.state == "BUILD_STARTED")] | length' "$TRIAGE_FILE")
BUILD_DONE=$(jq '[.issues[] | select(.state == "BUILD_DONE")] | length' "$TRIAGE_FILE")
TESTED=$(jq '[.issues[] | select(.state == "TESTED")] | length' "$TRIAGE_FILE")
PR=$(jq '[.issues[] | select(.state == "PR_CREATED" or .state == "PR_MERGED")] | length' "$TRIAGE_FILE")
TRACKING=$(jq '[.issues[] | select(.state == "TRACKING")] | length' "$TRIAGE_FILE")
WAITING=$(jq '[.issues[] | select(.state == "WAITING")] | length' "$TRIAGE_FILE")
FUTURE=$(jq '[.issues[] | select(.state == "FUTURE")] | length' "$TRIAGE_FILE")
BUG=$(jq '[.issues[] | select(.state == "BUG")] | length' "$TRIAGE_FILE")

NO_EVIDENCE=$(jq '[.issues[] | select(.state == "CLOSED" and .evidence == null)] | length' "$TRIAGE_FILE")
BATCHES=$(jq '.batches | length' "$TRIAGE_FILE")
RECONCILED=$(jq '[.batches[] | select(.reconciled == true)] | length' "$TRIAGE_FILE")

PROCESSED=$((TOTAL - UNREAD))

echo "═══ Triage Dashboard ═══"
echo ""
printf "  %-20s %5d\n" "UNREAD" "$UNREAD"
printf "  %-20s %5d\n" "INSPECTED" "$INSPECTED"
printf "  %-20s %5d\n" "BUILD_STARTED" "$BUILD_STARTED"
printf "  %-20s %5d\n" "BUILD_DONE" "$BUILD_DONE"
printf "  %-20s %5d\n" "TESTED" "$TESTED"
printf "  %-20s %5d\n" "PR_CREATED/MERGED" "$PR"
printf "  %-20s %5d\n" "CLOSED" "$CLOSED"
printf "  %-20s %5d\n" "TRACKING" "$TRACKING"
printf "  %-20s %5d\n" "WAITING" "$WAITING"
printf "  %-20s %5d\n" "FUTURE" "$FUTURE"
printf "  %-20s %5d\n" "BUG" "$BUG"
echo "  ──────────────────────────"
printf "  %-20s %5d\n" "TOTAL" "$TOTAL"
printf "  %-20s %5d\n" "PROCESSED" "$PROCESSED"
echo ""
printf "  Batches: %d (%d reconciled)\n" "$BATCHES" "$RECONCILED"
printf "  CLOSED without evidence: %d" "$NO_EVIDENCE"
if [[ "$NO_EVIDENCE" != "0" ]]; then
  echo " ⚠️  RED FLAG"
else
  echo " ✓"
fi
echo ""

# Action breakdown
echo "═══ By Action ═══"
echo ""
for action in BUILD TRACK WAITING CLOSE FUTURE BUG UNCLASSIFIED; do
  count=$(jq -r "[.issues[] | select(.action == \"$action\")] | length" "$TRIAGE_FILE")
  if [[ "$count" != "0" ]]; then
    printf "  %-15s %5d\n" "$action" "$count"
  fi
done
echo ""

# Last 5 batches
echo "═══ Recent Batches ═══"
echo ""
jq -r '.batches[-5:] | .[] | "  \(.id) | \(.phase) | \(.issues | length) issues | reconciled: \(.reconciled) | tests: \(.test_passed)"' "$TRIAGE_FILE"
