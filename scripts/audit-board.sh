#!/usr/bin/env bash
set -euo pipefail

# audit-board.sh — Drift detector.
#
# Compares the audit log (expected state from sanctioned transitions)
# against the live board state. Flags field values that changed
# without going through transition-issue.sh.
#
# Reads all instance-specific values from board.config.json.
#
# Usage:
#   bash scripts/audit-board.sh           # check for drift
#   bash scripts/audit-board.sh --fix     # also regenerate tracking table after
#
# Override config: BOARD_CONFIG=/path/to/board.config.json bash scripts/audit-board.sh

# --- Config Loading ---

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${BOARD_CONFIG:-${SCRIPT_DIR}/../board.config.json}"

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: board.config.json not found at: $CONFIG" >&2
  exit 1
fi

OWNER=$(python3 -c "import json; print(json.load(open('$CONFIG'))['owner'])")
PROJECT_NUM=$(python3 -c "import json; print(json.load(open('$CONFIG'))['project_num'])")
AUDIT_LOG=$(python3 -c "import json; print(json.load(open('$CONFIG'))['audit_log'])")

FIX_MODE=false
if [[ "${1:-}" == "--fix" ]]; then
  FIX_MODE=true
fi

tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

gh project item-list "$PROJECT_NUM" --owner "$OWNER" --format json --limit 200 > "$tmpfile" 2>/dev/null

if [[ ! -s "$tmpfile" ]]; then
  echo "ERROR: Could not fetch board state." >&2
  exit 1
fi

python3 - "$tmpfile" "$AUDIT_LOG" << 'PYEOF'
import json, sys, os

board_file = sys.argv[1]
audit_file = sys.argv[2]

with open(board_file) as f:
    data = json.load(f)

live = {}
for item in data.get('items', []):
    content = item.get('content', {})
    if not content or content.get('number') is None:
        continue
    num = content['number']
    live[num] = {
        'status': item.get('status', ''),
        'phase': item.get('phase', ''),
        'issue_type': item.get('issue Type', item.get('issueType', '')),
        'priority': item.get('priority', ''),
        'gate_met': item.get('gate Met', item.get('gateMet', '')),
        'next_action': item.get('next Action', item.get('nextAction', '')),
        'external_party': item.get('external Party', item.get('externalParty', '')),
    }

expected_status = {}
if os.path.isfile(audit_file):
    with open(audit_file) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split('|')]
            if len(parts) < 4:
                continue
            issue_str = parts[1]
            event_type = parts[2]
            detail = parts[3]
            try:
                issue_num = int(issue_str.replace('#', ''))
            except ValueError:
                continue
            if event_type == 'STATUS' and '→' in detail:
                target = detail.split('→')[-1].strip().split()[0]
                expected_status[issue_num] = target

drift_found = False
issues_clean = 0
issues_drift = 0

print("=" * 60)
print("BOARD AUDIT — Drift Detection Report")
print("=" * 60)
print()

print("## Field Completeness Check")
print()
missing_fields = []
for num in sorted(live.keys()):
    state = live[num]
    missing = []
    if not state['status']:
        missing.append('Status')
    if not state['phase']:
        missing.append('Phase')
    if not state['issue_type']:
        missing.append('Issue Type')
    if not state['priority']:
        missing.append('Priority')
    if state['status'] == 'GATED' and not state['external_party']:
        missing.append('External Party (required for GATED)')
    if not state['next_action']:
        missing.append('Next Action')
    if missing:
        missing_fields.append((num, missing))
        print(f"  ⚠️  #{num}: missing {', '.join(missing)}")

if not missing_fields:
    print("  ✅ All issues have required fields filled")

print()
print("## Status Drift Check")
print()
if not expected_status:
    print("  ℹ️  No status transitions in audit log yet — no drift baseline to compare")
else:
    for num in sorted(expected_status.keys()):
        if num not in live:
            print(f"  ⚠️  #{num}: in audit log but not on board (deleted?)")
            issues_drift += 1
            continue
        expected = expected_status[num]
        actual = live[num]['status']
        if expected != actual:
            print(f"  🔴 #{num}: DRIFT — expected {expected} (from audit log), found {actual} on board")
            issues_drift += 1
            drift_found = True
        else:
            issues_clean += 1
    if not drift_found:
        print(f"  ✅ All {issues_clean} audited issues match expected state")

print()
print("## Summary")
print()
print(f"  Total issues on board: {len(live)}")
print(f"  Issues with audit trail: {len(expected_status)}")
print(f"  Issues with missing fields: {len(missing_fields)}")
print(f"  Status drift detected: {issues_drift}")
print()

if drift_found:
    print("⚠️  DRIFT DETECTED — board was edited outside transition-issue.sh")
    sys.exit(1)
elif missing_fields:
    print("⚠️  INCOMPLETE — some issues are missing required fields")
    sys.exit(0)
else:
    print("✅ CLEAN — no drift, all fields complete")
    sys.exit(0)
PYEOF

audit_result=$?

if [[ "$FIX_MODE" == true ]]; then
  echo ""
  echo "Regenerating tracking table..."
  bash "${SCRIPT_DIR}/sync-tracking-table.sh" --write
fi

exit $audit_result
