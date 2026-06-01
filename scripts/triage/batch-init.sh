#!/bin/bash
set -euo pipefail
# batch-init.sh — declare a new batch and seed all issues into triage.json
# Usage: batch-init.sh <batch-id> <phase> <issue-number...>

BATCH_ID="$1"
PHASE="$2"
shift 2
ISSUES=("$@")

TRIAGE_FILE="docs/triage.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ ! -f "$TRIAGE_FILE" ]]; then
  echo '{"issues":{},"batches":[]}' >"$TRIAGE_FILE"
fi

# Check if batch already exists
EXISTS=$(jq -r ".batches[] | select(.id == \"$BATCH_ID\") | .id" "$TRIAGE_FILE" 2>/dev/null || echo "")
if [[ -n "$EXISTS" ]]; then
  echo "FAIL: batch $BATCH_ID already exists."
  exit 1
fi

# Seed any issues not yet in triage.json
for i in "${ISSUES[@]}"; do
  IN_FILE=$(jq -r ".issues[\"$i\"] // empty" "$TRIAGE_FILE")
  if [[ -z "$IN_FILE" ]]; then
    # Fetch issue title from GitHub
    TITLE=$(gh issue view "$i" --json title --jq '.title' 2>/dev/null || echo "Unknown")
    LABELS=$(gh issue view "$i" --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || echo "")
    jq --arg i "$i" --arg t "$TITLE" --arg l "$LABELS" --arg b "$BATCH_ID" \
      '.issues[$i] = {
          "title": $t,
          "labels": ($l | split(",")),
          "action": "UNCLASSIFIED",
          "state": "UNREAD",
          "batch": $b,
          "history": [],
          "evidence": null,
          "pr": null,
          "state_updated": null,
          "closed_at": null
        }' "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"
  else
    # Update existing issue to point to this batch
    jq --arg i "$i" --arg b "$BATCH_ID" '.issues[$i].batch = $b' \
      "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"
  fi
done

# Create the batch record
jq --arg id "$BATCH_ID" --arg phase "$PHASE" --arg ts "$TIMESTAMP" \
  --argjson issues "$(printf '%s\n' "${ISSUES[@]}" | jq -R . | jq -s 'map(tonumber)')" \
  '.batches += [{
      "id": $id,
      "phase": $phase,
      "issues": $issues,
      "started": $ts,
      "completed": null,
      "reconciled": false,
      "test_passed": false
    }]' "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"

echo "BATCH INIT: $BATCH_ID ($PHASE) — ${#ISSUES[@]} issues"
echo "  ${ISSUES[*]}"

# Print next steps
echo ""
echo "Next: for each issue, run:"
echo "  scripts/triage/state-transition.sh <num> INSPECTED"
echo "Then verify or build, then run:"
echo "  scripts/triage/reconcile.sh $BATCH_ID"
