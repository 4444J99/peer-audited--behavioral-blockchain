#!/usr/bin/env bash
set -euo pipefail

# detect-redundancy.sh — Finds duplicate and near-duplicate issues.
# Reads from board.config.json (portable).
#
# Usage:
#   bash scripts/detect-redundancy.sh                    # default threshold 0.6
#   bash scripts/detect-redundancy.sh --threshold 0.5    # lower = more matches

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${BOARD_CONFIG:-${SCRIPT_DIR}/../board.config.json}"

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: board.config.json not found at: $CONFIG" >&2
  exit 1
fi

OWNER=$(python3 -c "import json; print(json.load(open('$CONFIG'))['owner'])")
PROJECT_NUM=$(python3 -c "import json; print(json.load(open('$CONFIG'))['project_num'])")

THRESHOLD="0.6"
STATUS_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold) THRESHOLD="$2"; shift 2 ;;
    --status)    STATUS_FILTER="$2"; shift 2 ;;
    *)           echo "Unknown: $1"; exit 1 ;;
  esac
done

tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

gh project item-list "$PROJECT_NUM" --owner "$OWNER" --format json --limit 500 > "$tmpfile" 2>/dev/null

if [[ ! -s "$tmpfile" ]]; then
  echo "ERROR: Could not fetch board items." >&2
  exit 1
fi

python3 "${SCRIPT_DIR}/detect-redundancy.py" "$tmpfile" "$THRESHOLD" "$STATUS_FILTER"
