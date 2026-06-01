#!/bin/bash
set -euo pipefail
# classify-batch.sh — reads a batch of issues from triage.json and classifies them
# based on label patterns + title heuristics. Writes action field, transitions state.
# Usage: classify-batch.sh <batch-id> <phase>

BATCH_ID="$1"
PHASE="$2"
TRIAGE_FILE="docs/triage.json"

# Classification rules (ordered by priority — first match wins)
classify() {
  local labels="$1"
  local title="$2"
  local num="$3"

  # P2-pre-beta
  if echo "$labels" | jq -e 'index("P2-post-beta")' >/dev/null 2>&1; then
    echo "FUTURE"
    return
  fi

  # Already-implemented issues (from Phase 1 exploration)
  case "$num" in
  29 | 30 | 33 | 162 | 243 | 642 | 187 | 201 | 202 | 203 | 204 | 205 | 242 | 244 | 419 | 420 | 421)
    echo "CLOSE"
    return
    ;;
  esac

  # Blocked explicitly in title
  if [[ "$title" == *"[Blocked]"* ]] || [[ "$title" == *"Blocked"* ]]; then
    echo "WAITING"
    return
  fi

  # Bug label
  if echo "$labels" | jq -e 'index("bug")' >/dev/null 2>&1; then
    echo "BUG"
    return
  fi

  # Legal label issues are tracking (need counsel)
  if echo "$labels" | jq -e 'index("legal") or index("owner:legal-compliance")' >/dev/null 2>&1; then
    if [[ "$title" == feat:* ]] || [[ "$title" == fix:* ]]; then
      echo "BUILD"
      return
    fi
    echo "TRACK"
    return
  fi

  # Owner labels are tracking (hiring, business dev, release ops)
  if echo "$labels" | jq -e 'index("owner:mobile-native") or index("owner:release-ops") or index("owner:business-development")' >/dev/null 2>&1; then
    echo "TRACK"
    return
  fi

  # Blockchain/crypto — blocked or future
  if echo "$labels" | jq -e 'index("blockchain")' >/dev/null 2>&1; then
    echo "FUTURE"
    return
  fi

  # Epic — future phase gates
  if echo "$labels" | jq -e 'index("epic")' >/dev/null 2>&1; then
    echo "FUTURE"
    return
  fi

  # Documentation label with no feat:/fix: prefix = tracking
  if echo "$labels" | jq -e 'index("documentation")' >/dev/null 2>&1; then
    if [[ "$title" == feat:* ]] || [[ "$title" == fix:* ]]; then
      echo "BUILD"
      return
    fi
    echo "TRACK"
    return
  fi

  # Brainstorm-audit with feat: prefix = build
  if echo "$labels" | jq -e 'index("brainstorm-audit")' >/dev/null 2>&1; then
    if [[ "$title" == feat:* ]] || [[ "$title" == fix:* ]]; then
      echo "BUILD"
      return
    fi
    echo "TRACK"
    return
  fi

  # Artifact-dissection with feat:/test:/fix: = build, else track
  if echo "$labels" | jq -e 'index("artifact-dissection")' >/dev/null 2>&1; then
    if [[ "$title" == feat:* ]] || [[ "$title" == test:* ]] || [[ "$title" == fix:* ]]; then
      echo "BUILD"
      return
    fi
    echo "TRACK"
    return
  fi

  # Business/finance/marketing/product/support labels = tracking
  if echo "$labels" | jq -e 'index("business") or index("finance") or index("marketing") or index("product") or index("support") or index("hiring")' >/dev/null 2>&1; then
    echo "TRACK"
    return
  fi

  # Tech-debt with docs:/audit: = track
  if echo "$labels" | jq -e 'index("tech-debt")' >/dev/null 2>&1; then
    if [[ "$title" == docs:* ]] || [[ "$title" == audit:* ]]; then
      echo "TRACK"
      return
    fi
    echo "BUILD"
    return
  fi

  # Ops/checklist labels = tracking
  if echo "$labels" | jq -e 'index("ops") or index("checklist")' >/dev/null 2>&1; then
    echo "TRACK"
    return
  fi

  # Desktop/devops/api/security/enhancement/mobile/testing = BUILD if feat/fix/test prefix
  if echo "$labels" | jq -e 'index("desktop") or index("devops") or index("api") or index("security") or index("mobile") or index("testing")' >/dev/null 2>&1; then
    if [[ "$title" == feat:* ]] || [[ "$title" == fix:* ]] || [[ "$title" == test:* ]] || [[ "$title" == chore:* ]]; then
      echo "BUILD"
      return
    fi
    # Audit sub-issues with these labels are tracking
    if [[ "$title" == audit:* ]]; then
      echo "TRACK"
      return
    fi
    echo "BUILD"
    return
  fi

  # Enhancement with feat:/fix: = BUILD
  if echo "$labels" | jq -e 'index("enhancement")' >/dev/null 2>&1; then
    echo "BUILD"
    return
  fi

  # Enterprise label = BUILD (sub-issues of B2B features)
  if echo "$labels" | jq -e 'index("enterprise") or index("b2b")' >/dev/null 2>&1; then
    echo "BUILD"
    return
  fi

  # Unlabeled with feat:/test:/fix: = BUILD, with Schema/API/UI/Tests = BUILD, else TRACK
  if [[ "$title" == feat:* ]] || [[ "$title" == test:* ]] || [[ "$title" == fix:* ]]; then
    echo "BUILD"
    return
  fi
  if [[ "$title" == *"Schema"* ]] || [[ "$title" == *"API"* ]] || [[ "$title" == *"UI"* ]] || [[ "$title" == *"Tests"* ]]; then
    echo "BUILD"
    return
  fi

  # Default: if code-ish (has api/mobile/desktop/web/devops labels), BUILD; else TRACK
  if echo "$labels" | jq -e 'length > 0' >/dev/null 2>&1; then
    echo "TRACK"
    return
  fi

  echo "BUILD"
}

# Process each issue in the batch
ISSUE_LIST=$(jq -r ".batches[] | select(.id == \"$BATCH_ID\") | .issues[]" "$TRIAGE_FILE")

for num in $ISSUE_LIST; do
  TITLE=$(jq -r ".issues[\"$num\"].title" "$TRIAGE_FILE")
  LABELS=$(jq -r ".issues[\"$num\"].labels" "$TRIAGE_FILE")
  CURRENT_STATE=$(jq -r ".issues[\"$num\"].state" "$TRIAGE_FILE")

  if [[ "$CURRENT_STATE" != "UNREAD" ]]; then
    continue
  fi

  ACTION=$(classify "$LABELS" "$TITLE" "$num")

  # Set action field
  jq --arg i "$num" --arg a "$ACTION" '.issues[$i].action = $a' \
    "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"

  # Transition to INSPECTED
  bash scripts/triage/state-transition.sh "$num" INSPECTED >/dev/null 2>&1

  # For non-code categories, transition to terminal state
  case "$ACTION" in
  TRACK)
    bash scripts/triage/state-transition.sh "$num" TRACKING >/dev/null 2>&1
    ;;
  WAITING)
    bash scripts/triage/state-transition.sh "$num" WAITING >/dev/null 2>&1
    ;;
  FUTURE)
    bash scripts/triage/state-transition.sh "$num" FUTURE >/dev/null 2>&1
    ;;
  BUG)
    bash scripts/triage/state-transition.sh "$num" BUG >/dev/null 2>&1
    ;;
  esac

  echo "  #$num → $ACTION ($(echo "$TITLE" | cut -c1-60)...)"
done

echo ""
echo "CLASSIFIED batch $BATCH_ID"
