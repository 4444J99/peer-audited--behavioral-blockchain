#!/bin/bash
set -euo pipefail
# classify-all.sh — classifies all UNREAD issues in triage.json in one pass
# Uses label + title heuristics. Writes action field, transitions state.

TRIAGE_FILE="docs/triage.json"
TOTAL=$(jq '.issues | length' "$TRIAGE_FILE")
UNREAD_BEFORE=$(jq '[.issues[] | select(.state == "UNREAD")] | length' "$TRIAGE_FILE")

echo "═══ CLASSIFYING $UNREAD_BEFORE UNREAD ISSUES ═══"

jq -r '.issues | to_entries[] | select(.value.state == "UNREAD") | "\(.key)|||\(.value.title)|||\(.value.labels | join(","))"' "$TRIAGE_FILE" | while IFS='|||' read -r num title labels; do

  classify() {
    local labels="$1" title="$2" num="$3"

    # P2-post-beta → FUTURE
    [[ "$labels" == *"P2-post-beta"* ]] && {
      echo "FUTURE"
      return
    }

    # Already-implemented
    case "$num" in
    29 | 30 | 33 | 162 | 243 | 642 | 187 | 201 | 202 | 203 | 204 | 205 | 242 | 244 | 419 | 420 | 421)
      echo "CLOSE"
      return
      ;;
    esac

    # Blocked in title (regex avoids glob character-class clash with [])
    if [[ "$title" =~ Blocked ]]; then
      echo "WAITING"
      return
    fi

    # Bug label
    [[ "$labels" == *"bug"* ]] && {
      echo "BUG"
      return
    }

    # Epic → FUTURE
    [[ "$labels" == *"epic"* ]] && {
      echo "FUTURE"
      return
    }

    # Blockchain → FUTURE
    [[ "$labels" == *"blockchain"* ]] && {
      echo "FUTURE"
      return
    }

    # Legal/Owner labels with no feat/fix = TRACK
    if [[ "$labels" == *"owner:legal-compliance"* || "$labels" == *"owner:mobile-native"* || "$labels" == *"owner:release-ops"* || "$labels" == *"owner:business-development"* || "$labels" == *"owner:cryptography"* || "$labels" == *"owner:backend-platform"* ]]; then
      [[ "$title" == feat:* || "$title" == fix:* ]] && {
        echo "BUILD"
        return
      }
      echo "TRACK"
      return
    fi

    # Legal label with no feat/fix = TRACK
    if [[ "$labels" == *"legal"* ]]; then
      [[ "$title" == feat:* || "$title" == fix:* ]] && {
        echo "BUILD"
        return
      }
      echo "TRACK"
      return
    fi

    # Purely non-code labels (no api/mobile/desktop/devops/security/testing/enhancement)
    local code_labels="api mobile desktop devops security testing enhancement enterprise b2b recovery"
    local has_code=0
    for cl in $code_labels; do
      [[ "$labels" == *"$cl"* ]] && has_code=1
    done

    if [[ $has_code -eq 0 ]]; then
      # These labels are ALWAYS non-code: documentation, brainstorm-audit, artifact-dissection, business, marketing, product, finance, support, tech-debt, ops, question, audit, research, checklist, milestone
      local noncode_labels="documentation brainstorm-audit artifact-dissection business marketing product finance support tech-debt ops question audit research checklist milestone hiring database"
      for nl in $noncode_labels; do
        if [[ "$labels" == *"$nl"* ]]; then
          # Still BUILD if title starts with feat: or fix: or test:
          [[ "$title" == feat:* || "$title" == fix:* || "$title" == test:* ]] && {
            echo "BUILD"
            return
          }
          echo "TRACK"
          return
        fi
      done
    fi

    # Has code labels — check title prefix
    if [[ $has_code -eq 1 ]]; then
      # Audit sub-issues = TRACK
      [[ "$title" == audit:* ]] && {
        echo "TRACK"
        return
      }
      # Otherwise BUILD
      echo "BUILD"
      return
    fi

    # Unlabeled — check title pattern
    if [[ "$title" == feat:* || "$title" == fix:* || "$title" == test:* ]]; then
      echo "BUILD"
      return
    fi
    # Schema/API/UI/Tests pattern = BUILD
    if [[ "$title" == *"Schema"* || "$title" == *"API"* || "$title" == *"UI"* || "$title" == *"Tests"* ]]; then
      echo "BUILD"
      return
    fi
    # Default: TRACK
    echo "TRACK"
  }

  ACTION=$(classify "$labels" "$title" "$num")

  # Batch classify in triage.json
  jq --arg i "$num" --arg a "$ACTION" \
    '.issues[$i].action = $a' "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"

  # Transition through INSPECTED to terminal state for non-BUILD
  if [[ "$ACTION" != "BUILD" && "$ACTION" != "CLOSE" ]]; then
    jq --arg i "$num" --arg s "$ACTION" --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '.issues[$i].state = $s |
        .issues[$i].state_updated = $ts |
        .issues[$i].history += [{"from": "UNREAD", "to": $s, "at": $ts}]' \
      "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"
  else
    jq --arg i "$num" --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '.issues[$i].state = "INSPECTED" |
        .issues[$i].state_updated = $ts |
        .issues[$i].history += [{"from": "UNREAD", "to": "INSPECTED", "at": $ts}]' \
      "$TRIAGE_FILE" >"${TRIAGE_FILE}.tmp" && mv "${TRIAGE_FILE}.tmp" "$TRIAGE_FILE"
  fi

done

UNREAD_AFTER=$(jq '[.issues[] | select(.state == "UNREAD")] | length' "$TRIAGE_FILE")
BUILD=$(jq '[.issues[] | select(.action == "BUILD")] | length' "$TRIAGE_FILE")
TRACK=$(jq '[.issues[] | select(.action == "TRACK")] | length' "$TRIAGE_FILE")
WAITING=$(jq '[.issues[] | select(.action == "WAITING")] | length' "$TRIAGE_FILE")
FUTURE=$(jq '[.issues[] | select(.action == "FUTURE")] | length' "$TRIAGE_FILE")
BUG=$(jq '[.issues[] | select(.action == "BUG")] | length' "$TRIAGE_FILE")
CLOSE=$(jq '[.issues[] | select(.action == "CLOSE")] | length' "$TRIAGE_FILE")
UNCLASS=$(jq '[.issues[] | select(.action == "UNCLASSIFIED")] | length' "$TRIAGE_FILE")

echo ""
echo "═══ CLASSIFICATION COMPLETE ═══"
echo "  UNREAD remaining: $UNREAD_AFTER (should be 0 for CLOSE, TRACK, WAITING, FUTURE, BUG)"
echo ""
echo "  BUILD:    $BUILD"
echo "  TRACK:    $TRACK"
echo "  WAITING:  $WAITING"
echo "  FUTURE:   $FUTURE"
echo "  CLOSE:    $CLOSE"
echo "  BUG:      $BUG"
echo "  UNCLASS:  $UNCLASS (should be 0)"
