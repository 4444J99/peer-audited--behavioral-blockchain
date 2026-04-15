#!/usr/bin/env bash
set -euo pipefail

# setup-board.sh — Stands up a project board from board.config.json.
#
# Takes a blank template board and creates:
#   1. Custom fields (from config)
#   2. Status options (from config)
#   3. Views (from config)
#
# This is the instantiation script. Run once per new project.
# After this, use transition-issue.sh for all state changes.
#
# Usage:
#   bash scripts/setup-board.sh                # full setup
#   bash scripts/setup-board.sh --fields-only  # just fields, skip views
#   bash scripts/setup-board.sh --views-only   # just views, skip fields
#   bash scripts/setup-board.sh --dry-run      # show what would be created

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${BOARD_CONFIG:-${SCRIPT_DIR}/../board.config.json}"

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: board.config.json not found at: $CONFIG" >&2
  exit 1
fi

OWNER=$(python3 -c "import json; print(json.load(open('$CONFIG'))['owner'])")
PROJECT_NUM=$(python3 -c "import json; print(json.load(open('$CONFIG'))['project_num'])")
PROJECT_ID=$(python3 -c "import json; print(json.load(open('$CONFIG'))['project_id'])")

DO_FIELDS=true
DO_VIEWS=true
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fields-only) DO_VIEWS=false; shift ;;
    --views-only)  DO_FIELDS=false; shift ;;
    --dry-run)     DRY_RUN=true; shift ;;
    *)             echo "Unknown: $1"; exit 1 ;;
  esac
done

echo "=== Board Setup: Project #${PROJECT_NUM} (${OWNER}) ==="
echo "  Config: $CONFIG"
echo "  Dry run: $DRY_RUN"
echo ""

# --- Fields ---

if [[ "$DO_FIELDS" == true ]]; then
  echo "## Fields"
  echo ""

  # Get existing fields (skip if rate-limited or dry-run)
  existing_names=""
  if [[ "$DRY_RUN" == false ]]; then
    existing=$(gh project field-list "$PROJECT_NUM" --owner "$OWNER" --format json 2>/dev/null || echo '{"fields":[]}')
    existing_names=$(echo "$existing" | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(f['name'] for f in d['fields']))" 2>/dev/null || echo "")
  fi

  # Read desired fields from config
  python3 -c "
import json
with open('$CONFIG') as f:
    cfg = json.load(f)

field_display = {
    'phase': 'Phase',
    'issue_type': 'Issue Type',
    'gate_met': 'Gate Met',
}

for key, fdata in cfg['fields'].items():
    name = field_display.get(key, key.replace('_', ' ').title())
    opts = fdata.get('options', {})
    if opts:
        opt_str = ','.join(opts.keys())
        print(f'SINGLE_SELECT|{name}|{opt_str}')
    elif fdata.get('id', '').startswith('PVTF_'):
        print(f'TEXT|{name}|')
" | while IFS='|' read -r dtype name opts; do
    if echo "$existing_names" | grep -qx "$name"; then
      echo "  ✓ $name (exists)"
    else
      echo "  + $name ($dtype) [$opts]"
      if [[ "$DRY_RUN" == false ]]; then
        if [[ "$dtype" == "SINGLE_SELECT" ]]; then
          gh project field-create "$PROJECT_NUM" --owner "$OWNER" \
            --name "$name" --data-type "$dtype" \
            --single-select-options "$opts" > /dev/null 2>&1 && echo "    created" || echo "    FAILED"
        else
          gh project field-create "$PROJECT_NUM" --owner "$OWNER" \
            --name "$name" --data-type "$dtype" > /dev/null 2>&1 && echo "    created" || echo "    FAILED"
        fi
      fi
    fi
  done

  echo ""
fi

# --- Views ---

if [[ "$DO_VIEWS" == true ]]; then
  echo "## Views"
  echo ""
  echo "  Create at: https://github.com/orgs/${OWNER}/projects/${PROJECT_NUM}/views"
  echo ""
  echo "  For each: click '+ New view', set name/layout, paste the filter query."
  echo ""

  python3 -c "
import json
with open('$CONFIG') as f:
    cfg = json.load(f)

views = cfg.get('views', [])
if not views:
    print('  No views defined in config')
else:
    for i, v in enumerate(views, 1):
        name = v['name']
        layout = v.get('layout', 'TABLE')
        filt = v.get('filter', '')
        group = v.get('group')
        sort_q = v.get('sort', '')

        print(f'  {i}. {name} ({layout})')
        q = filt
        if sort_q:
            q = f'{q} {sort_q}'.strip()
        if q:
            print(f'     {q}')
        if group:
            print(f'     group by: {group}')
        print()
"
fi

echo ""
echo "=== Setup complete ==="
