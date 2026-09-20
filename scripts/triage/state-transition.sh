#!/bin/bash
set -euo pipefail
# state-transition.sh — the ONLY way to modify triage.json
# Usage: state-transition.sh <issue-number> <to-state> [--evidence <file:line>] [--pr <url>] [--reason <reopening reason>]
# Enforces the legal state machine. Rejects illegal transitions.

ISSUE="$1"
TO_STATE="$2"
shift 2

EVIDENCE=""
PR=""
REASON=""
while [[ $# -gt 0 ]]; do
  case "$1" in
  --evidence)
    EVIDENCE="$2"
    shift 2
    ;;
  --reason)
    REASON="$2"
    shift 2
    ;;
  --pr)
    PR="$2"
    shift 2
    ;;
  *)
    echo "Unknown flag: $1"
    exit 1
    ;;
  esac
done

TRIAGE_FILE="docs/triage.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ ! -f "$TRIAGE_FILE" ]]; then
  echo '{"issues":{},"batches":[]}' >"$TRIAGE_FILE"
fi

FROM_STATE=$(jq -r ".issues[\"$ISSUE\"].state // \"UNREAD\"" "$TRIAGE_FILE")

# State machine: legal transitions
valid_transition() {
  case "$1→$2" in
  "UNREAD→INSPECTED") return 0 ;;
  "INSPECTED→CLOSED") return 0 ;;
  "INSPECTED→SUPERSEDED") return 0 ;;
  "INSPECTED→BUILD_STARTED") return 0 ;;
  "INSPECTED→TRACKING") return 0 ;;
  "INSPECTED→WAITING") return 0 ;;
  "INSPECTED→FUTURE") return 0 ;;
  "INSPECTED→BUG") return 0 ;;
  "TRACKING→BUILD_STARTED") return 0 ;;
  "TRACKING→WAITING") return 0 ;;
  # Legacy "TRACK" state (pre-dates the current state machine; mirrors TRACKING)
  "TRACK→BUILD_STARTED") return 0 ;;
  "TRACK→WAITING") return 0 ;;
  "TRACK→SUPERSEDED") return 0 ;;
  "TRACK→TRACKING") return 0 ;;
  "FUTURE→BUILD_STARTED") return 0 ;;
  "WAITING→BUILD_STARTED") return 0 ;;
  "WAITING→SUPERSEDED") return 0 ;;
  "FUTURE→SUPERSEDED") return 0 ;;
  "TRACKING→SUPERSEDED") return 0 ;;
  "CLOSED→BUILD_STARTED") return 0 ;; # recovery; requires an explicit reason
  "BUG→BUILD_STARTED") return 0 ;;
  "BUILD_STARTED→BUILD_DONE") return 0 ;;
  "BUILD_DONE→TESTED") return 0 ;;
  "TESTED→PR_CREATED") return 0 ;;
  "PR_CREATED→PR_MERGED") return 0 ;;
  "PR_MERGED→CLOSED") return 0 ;;
  *) return 1 ;;
  esac
}

if [[ "$FROM_STATE" == CLOSED && -z "$REASON" ]]; then
  echo 'REJECTED: reopening CLOSED requires --reason (history is preserved)'
  exit 2
fi

# CLOSED requires evidence
if [[ "$TO_STATE" == "CLOSED" && -z "$EVIDENCE" ]]; then
  echo "REJECTED: CLOSED state requires --evidence <file:line>"
  exit 2
fi

if valid_transition "$FROM_STATE" "$TO_STATE"; then
  echo "OK: #$ISSUE $FROM_STATE → $TO_STATE"
else
  echo "REJECTED: illegal transition #$ISSUE $FROM_STATE → $TO_STATE"
  exit 3
fi

# Update the issue state
jq --arg i "$ISSUE" --arg to "$TO_STATE" --arg from "$FROM_STATE" --arg ts "$TIMESTAMP" \
  --arg ev "$EVIDENCE" --arg pr "$PR" --arg reason "$REASON" \
  '.issues[$i].state = $to |
    .issues[$i].state_updated = $ts |
    .issues[$i].history += [{"from": $from, "to": $to, "at": $ts} + (if $reason != "" then {"reason": $reason} else {} end)] |
    (if $from == "CLOSED" then .issues[$i].closed_at = null else . end) |
    (if $to == "WAITING" then .issues[$i].action = "WAITING" else . end) |
    (if $ev != "" then .issues[$i].evidence = $ev else . end) |
    (if $pr != "" then .issues[$i].pr = $pr else . end)' \
  "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"

echo "TRANSITION OK: #$ISSUE now $TO_STATE"
