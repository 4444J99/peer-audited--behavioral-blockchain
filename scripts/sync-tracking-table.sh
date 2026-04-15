#!/usr/bin/env bash
set -euo pipefail

# sync-tracking-table.sh — Materializer.
#
# Generates SOP-SS-TRK-001 tracking table from the GitHub Project board.
# The board is the single source of truth. This file is a read-only view.
#
# Reads all instance-specific values from board.config.json.
#
# Usage:
#   bash scripts/sync-tracking-table.sh              # print to stdout
#   bash scripts/sync-tracking-table.sh --write      # overwrite SOP file
#
# Override config: BOARD_CONFIG=/path/to/board.config.json bash scripts/sync-tracking-table.sh

# --- Config Loading ---

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${BOARD_CONFIG:-${SCRIPT_DIR}/../board.config.json}"

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: board.config.json not found at: $CONFIG" >&2
  exit 1
fi

OWNER=$(python3 -c "import json; print(json.load(open('$CONFIG'))['owner'])")
PROJECT_NUM=$(python3 -c "import json; print(json.load(open('$CONFIG'))['project_num'])")
SOP_FILE="docs/sops/SOP-SS-TRK-001_001-ontology_issue_tracking.md"

WRITE_MODE=false
if [[ "${1:-}" == "--write" ]]; then
  WRITE_MODE=true
fi

tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

gh project item-list "$PROJECT_NUM" --owner "$OWNER" --format json --limit 200 > "$tmpfile" 2>/dev/null

if [[ ! -s "$tmpfile" ]]; then
  echo "ERROR: Could not fetch project items." >&2
  exit 1
fi

output=$(python3 - "$tmpfile" << 'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

items = data.get('items', [])
rows = []
status_counts = {}

for item in items:
    content = item.get('content', {})
    if not content or content.get('number') is None:
        continue

    num = content['number']
    status = item.get('status', '') or ''
    phase = item.get('phase', '') or ''
    issue_type = item.get('issue Type', item.get('issueType', '')) or ''
    priority = item.get('priority', '') or ''
    gate_met = item.get('gate Met', item.get('gateMet', '')) or ''
    next_action = item.get('next Action', item.get('nextAction', '')) or ''
    ext_party = item.get('external Party', item.get('externalParty', '')) or ''

    s = status or 'UNSET'
    status_counts[s] = status_counts.get(s, 0) + 1

    notes_parts = []
    if next_action:
        notes_parts.append(next_action[:55])
    if ext_party:
        notes_parts.append(f'Ext: {ext_party}')
    note_str = '; '.join(notes_parts)

    gate_display = '✅' if gate_met in ('Yes', 'yes') else ''

    rows.append({
        'num': num, 'phase': phase, 'priority': priority,
        'type': issue_type, 'status': status, 'gate': gate_display,
        'notes': note_str,
    })

phase_order = {'α': 0, 'β': 1, 'γ': 2, 'ω': 3, 'IRF': 4, '': 5}
priority_order = {'P0-blocker': 0, 'P1-high': 1, 'P2-medium': 2, 'P3-backlog': 3, '': 4}
rows.sort(key=lambda r: (phase_order.get(r['phase'], 5), priority_order.get(r['priority'], 4), r['num']))

print('TABLE_START')
print('| Issue # | Phase | Priority | Type | Status | Gate Met | Notes |')
print('|---------|-------|----------|------|--------|----------|-------|')
for r in rows:
    print(f'| #{r["num"]} | {r["phase"]} | {r["priority"]} | {r["type"]} | {r["status"]} | {r["gate"]} | {r["notes"]} |')
print('TABLE_END')

print('METRICS_START')
print(f'| Total Issues | {len(rows)} |')
for s in ['GATED', 'SPEC', 'WIP', 'DONE', 'CLOSED']:
    print(f'| {s} | {status_counts.get(s, 0)} |')
unset = status_counts.get('UNSET', 0) + status_counts.get('', 0)
if unset > 0:
    print(f'| UNSET | {unset} |')
print('METRICS_END')
PYEOF
)

table=$(echo "$output" | sed -n '/TABLE_START/,/TABLE_END/p' | grep -v 'TABLE_START\|TABLE_END')
metrics=$(echo "$output" | sed -n '/METRICS_START/,/METRICS_END/p' | grep -v 'METRICS_START\|METRICS_END')
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ "$WRITE_MODE" == true ]]; then
  cat > "$SOP_FILE" << SOPEOF
# SOP-SS-TRK-001_001-ontology_issue_tracking

**Title:** Issue Tracking Matrix
**Domain:** Sovereign Systems Issue Management
**Ordinal:** 001
**Version:** 002
**Status:** ACTIVE
**Created:** 2026-04-03
**Owner:** Orchestrator (AI Agent)

---

## Purpose

Provide a single **read-only view** of project issue state. This table is **auto-generated** from the GitHub Project board (project #${PROJECT_NUM}), which is the single source of truth.

**Do not edit this table by hand.** Run \`bash scripts/sync-tracking-table.sh --write\` to regenerate.

## Authority Model

\`\`\`
GitHub Project Board (#${PROJECT_NUM})  ← EDIT HERE (via transition-issue.sh only)
       │
       ├── written by → scripts/transition-issue.sh (the gatekeeper)
       ├── audited by → scripts/audit-board.sh (the drift detector)
       ├── generates → this tracking table (read-only view)
       ├── referenced by → spec files in docs/superpowers/specs/
       └── referenced by → IRF entries (pointers, not copies)
\`\`\`

- **Unique ID:** The GitHub issue number (e.g., #13). One number, one record, everywhere.
- **Config:** \`board.config.json\` — all instance-specific IDs. Scripts are the portable process.
- **Edit location:** Via \`scripts/transition-issue.sh\` only. This file is regenerated, never hand-edited.

## Tracking Table

<!-- GENERATED:START — do not edit below this line -->
${table}
<!-- GENERATED:END -->

## Metrics

| Metric | Value |
|--------|-------|
${metrics}

## Status Legend

| Status | Meaning |
|--------|---------|
| GATED | Waiting on external decision (client) |
| SPEC | Specification complete, ready for work |
| WIP | Work actively in progress |
| DONE | All work complete, awaiting gate verification |
| CLOSED | Gate met, issue resolved |

## Type Legend

| Type | Meaning |
|------|---------|
| DECISION | Requires external input before work |
| WORK | Can be executed once spec complete |
| BLOCKER | P0 item blocking multiple downstream |

## Phase Legend

| Phase | Description |
|-------|-------------|
| α | Blocking / foundational decisions |
| β | Core build / implementation |
| γ | Future-phase / deferred decisions |
| ω | Content fix / maintenance |
| IRF | Legacy IRF items |

## Blocking Issues

- #13 (node architecture): Blocks #15, #8, #6
- #5 (revenue): Blocks all revenue work
- #3 (domains): Blocks production deployment

## Update Protocol

All updates via gatekeeper. Then regenerate:

\`\`\`bash
bash scripts/transition-issue.sh <issue#> --status <STATUS> --reason "why"
bash scripts/sync-tracking-table.sh --write
\`\`\`

## Related SOPs

- SOP-SS-ISS-001_001-ontology_issue_specification.md
- SOP-SS-PRC-001_001-ontology_meta_process.md
- SOP-SS-CLT-001_001-ontology_client_decisions.md
- SOP-SS-QAB-001_001-project-board-qa.md

---

**Last Synced:** ${timestamp}
**Config:** \`board.config.json\`
**Generated by:** \`scripts/sync-tracking-table.sh --write\`
SOPEOF

  echo "✅ SOP-SS-TRK-001 regenerated (${timestamp})"
else
  echo "# Tracking Table (from GitHub Project #${PROJECT_NUM})"
  echo ""
  echo "$table"
  echo ""
  echo "## Metrics"
  echo ""
  echo "| Metric | Value |"
  echo "|--------|-------|"
  echo "$metrics"
  echo ""
  echo "Generated: ${timestamp}"
fi
