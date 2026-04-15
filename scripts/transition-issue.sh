#!/usr/bin/env bash
set -euo pipefail

# transition-issue.sh — The gatekeeper for issue state changes.
#
# All writes to issue metadata flow through this script.
# It validates the transition is legal, writes to the board,
# and appends to the append-only audit log.
#
# Reads all instance-specific values from board.config.json.
# The scripts are the process; the config is the instance.
#
# Usage:
#   bash scripts/transition-issue.sh <issue#> --status <STATUS> --reason "why"
#   bash scripts/transition-issue.sh <issue#> --field <FIELD> --value <VALUE> [--reason "..."]
#   bash scripts/transition-issue.sh <issue#> --gate-met --reason "gate criterion evidence"
#
# Override config: BOARD_CONFIG=/path/to/other/board.config.json bash scripts/transition-issue.sh ...

# --- Config Loading ---

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${BOARD_CONFIG:-${SCRIPT_DIR}/../board.config.json}"

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: board.config.json not found at: $CONFIG" >&2
  echo "  Set BOARD_CONFIG env var or place config alongside scripts." >&2
  exit 1
fi

# Load simple config values (no special chars in these)
eval "$(python3 -c "
import json
with open('$CONFIG') as f:
    cfg = json.load(f)
print(f'OWNER=\"{cfg[\"owner\"]}\"')
print(f'REPO=\"{cfg[\"repo\"]}\"')
print(f'PROJECT_NUM={cfg[\"project_num\"]}')
print(f'PROJECT_ID=\"{cfg[\"project_id\"]}\"')
print(f'AUDIT_LOG=\"{cfg[\"audit_log\"]}\"')
for fname, fdata in cfg['fields'].items():
    var = fname.upper() + '_FIELD'
    print(f'{var}=\"{fdata[\"id\"]}\"')
")"

# --- Helpers ---

log_event() {
  local issue="$1" event_type="$2" detail="$3" reason="${4:-}"
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local entry="${ts} | #${issue} | ${event_type} | ${detail}"
  if [[ -n "$reason" ]]; then
    entry="${entry} | reason: ${reason}"
  fi
  echo "$entry" >> "$AUDIT_LOG"
  echo "  LOGGED: $entry"
}

get_item_id() {
  local issue_num="$1"
  gh project item-list "$PROJECT_NUM" --owner "$OWNER" --format json --limit 200 2>/dev/null \
    | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('items', []):
    content = item.get('content', {})
    if content and content.get('number') == ${issue_num}:
        print(item['id'])
        sys.exit(0)
sys.exit(1)
" 2>/dev/null
}

get_current_status() {
  local issue_num="$1"
  gh project item-list "$PROJECT_NUM" --owner "$OWNER" --format json --limit 200 2>/dev/null \
    | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('items', []):
    content = item.get('content', {})
    if content and content.get('number') == ${issue_num}:
        print(item.get('status', ''))
        sys.exit(0)
sys.exit(1)
" 2>/dev/null
}

set_single_select() {
  local item_id="$1" field_id="$2" option_id="$3"
  gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" \
    --field-id "$field_id" --single-select-option-id "$option_id" > /dev/null 2>&1
}

set_text_field() {
  local item_id="$1" field_id="$2" text="$3"
  gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" \
    --field-id "$field_id" --text "$text" > /dev/null 2>&1
}

resolve_option_id() {
  local field_name="$1" option_name="$2"
  python3 -c "
import json
with open('$CONFIG') as f:
    cfg = json.load(f)
field = cfg['fields'].get('$field_name', {})
opts = field.get('options', {})
oid = opts.get('$option_name', '')
if not oid:
    import sys
    sys.exit(1)
print(oid)
" 2>/dev/null
}

usage() {
  echo "Usage:"
  echo "  transition-issue.sh <issue#> --status <STATUS> --reason \"...\""
  echo "  transition-issue.sh <issue#> --gate-met [--reason \"...\"]"
  echo "  transition-issue.sh <issue#> --field <field-name> --value <value> [--reason \"...\"]"
  echo ""
  echo "Settable fields: Phase, Issue Type, Priority, Next Action, External Party"
  echo "Config: $CONFIG"
  exit 1
}

# --- Parse args ---

if [[ $# -lt 2 ]]; then
  usage
fi

ISSUE_NUM="$1"
shift

ACTION=""
TARGET_STATUS=""
FIELD_NAME=""
FIELD_VALUE=""
REASON=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status)   ACTION="status"; TARGET_STATUS="$2"; shift 2 ;;
    --gate-met) ACTION="gate"; shift ;;
    --field)    ACTION="field"; FIELD_NAME="$2"; shift 2 ;;
    --value)    FIELD_VALUE="$2"; shift 2 ;;
    --reason)   REASON="$2"; shift 2 ;;
    *)          echo "Unknown arg: $1"; usage ;;
  esac
done

# --- Execute ---

echo "=== Transition: Issue #${ISSUE_NUM} ==="

ITEM_ID=$(get_item_id "$ISSUE_NUM")
if [[ -z "$ITEM_ID" ]]; then
  echo "ERROR: Issue #${ISSUE_NUM} not found on project board." >&2
  exit 1
fi

case "$ACTION" in
  status)
    OPTION_ID=$(resolve_option_id "status" "$TARGET_STATUS")
    if [[ -z "$OPTION_ID" ]]; then
      echo "ERROR: Unknown status '${TARGET_STATUS}'." >&2
      exit 1
    fi

    CURRENT=$(get_current_status "$ISSUE_NUM")
    echo "  Current: ${CURRENT:-UNSET}"
    echo "  Target:  ${TARGET_STATUS}"

    # Validate transition via config
    if [[ -n "$CURRENT" ]]; then
      ALLOWED=$(python3 -c "
import json
with open('$CONFIG') as f:
    cfg = json.load(f)
t = cfg['transitions'].get('$CURRENT', [])
print(' '.join(t))
" 2>/dev/null)
      if [[ "$CURRENT" == "CLOSED" ]]; then
        echo "ERROR: CLOSED is terminal." >&2
        log_event "$ISSUE_NUM" "REJECTED" "CLOSED → ${TARGET_STATUS} (terminal)" "$REASON"
        exit 1
      fi
      if [[ -n "$ALLOWED" ]] && [[ ! " $ALLOWED " =~ " $TARGET_STATUS " ]]; then
        echo "ERROR: Illegal transition ${CURRENT} → ${TARGET_STATUS}" >&2
        echo "  Allowed from ${CURRENT}: ${ALLOWED}" >&2
        log_event "$ISSUE_NUM" "REJECTED" "${CURRENT} → ${TARGET_STATUS} (illegal)" "$REASON"
        exit 1
      fi
    fi

    if [[ -z "$REASON" ]]; then
      echo "ERROR: --reason is required for status transitions." >&2
      exit 1
    fi

    set_single_select "$ITEM_ID" "$STATUS_FIELD" "$OPTION_ID"

    if [[ "$TARGET_STATUS" == "CLOSED" ]]; then
      gh issue close "$ISSUE_NUM" --repo "$REPO" --reason completed > /dev/null 2>&1 || true
      echo "  GitHub issue #${ISSUE_NUM} closed"
    fi

    log_event "$ISSUE_NUM" "STATUS" "${CURRENT:-UNSET} → ${TARGET_STATUS}" "$REASON"
    echo "  ✅ Status: ${CURRENT:-UNSET} → ${TARGET_STATUS}"
    ;;

  gate)
    OPTION_ID=$(resolve_option_id "gate_met" "Yes")
    set_single_select "$ITEM_ID" "${GATE_MET_FIELD}" "$OPTION_ID"
    log_event "$ISSUE_NUM" "GATE_MET" "Gate Met = Yes" "$REASON"
    echo "  ✅ Gate Met = Yes"
    ;;

  field)
    if [[ -z "$FIELD_NAME" ]] || [[ -z "$FIELD_VALUE" ]]; then
      echo "ERROR: --field and --value are both required." >&2
      exit 1
    fi

    # Map display names to config keys
    case "$FIELD_NAME" in
      "Phase")          CONFIG_KEY="phase" ;;
      "Issue Type")     CONFIG_KEY="issue_type" ;;
      "Priority")       CONFIG_KEY="priority" ;;
      "Next Action")    CONFIG_KEY="next_action" ;;
      "External Party") CONFIG_KEY="external_party" ;;
      *)
        echo "ERROR: Unknown field '${FIELD_NAME}'." >&2
        echo "  Settable: Phase, Issue Type, Priority, Next Action, External Party" >&2
        exit 1
        ;;
    esac

    FIELD_ID_VAR="${CONFIG_KEY^^}_FIELD"
    FIELD_ID="${!FIELD_ID_VAR}"

    # Check if field has options (single-select) or is text
    OPTION_ID=$(resolve_option_id "$CONFIG_KEY" "$FIELD_VALUE" 2>/dev/null) || true

    if [[ -n "$OPTION_ID" ]]; then
      set_single_select "$ITEM_ID" "$FIELD_ID" "$OPTION_ID"
    else
      set_text_field "$ITEM_ID" "$FIELD_ID" "$FIELD_VALUE"
    fi

    log_event "$ISSUE_NUM" "FIELD" "${FIELD_NAME} = ${FIELD_VALUE}" "$REASON"
    echo "  ✅ ${FIELD_NAME} = ${FIELD_VALUE}"
    ;;

  *)
    usage
    ;;
esac

echo "=== Done ==="
