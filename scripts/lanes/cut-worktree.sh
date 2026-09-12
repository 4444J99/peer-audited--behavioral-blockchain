#!/usr/bin/env bash
#
# scripts/lanes/cut-worktree.sh
#
# Automates the creation of an isolated git worktree for an issue or feature intent,
# cutting it directly from the designated standing program lane.
#
# Usage:
#   scripts/lanes/cut-worktree.sh <issue-number> [short-intent]
#   scripts/lanes/cut-worktree.sh <lane> <short-intent>
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OWNERSHIP_FILE="$ROOT/docs/triage/issue-ownership.json"

if [ "$#" -lt 1 ]; then
  echo "Usage:" >&2
  echo "  $0 <issue-number> [short-intent]" >&2
  echo "  $0 <lane> <short-intent>" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  $0 369 dogfood-beta" >&2
  echo "  $0 lane/heal route-404-fix" >&2
  exit 1
fi

ARG1="$1"
ARG2="${2:-}"

LANE=""
BRANCH_NAME=""
INTENT=""

if [[ "$ARG1" =~ ^[0-9]+$ ]]; then
  ISSUE_NUM="$ARG1"
  if [ -f "$OWNERSHIP_FILE" ]; then
    LANE=$(node -e "
      const data = JSON.parse(require('fs').readFileSync('$OWNERSHIP_FILE', 'utf8'));
      const entry = data['$ISSUE_NUM'];
      if (entry) process.stdout.write(entry.owningLane || '');
    ")
  fi

  if [ -z "$LANE" ] || [ "$LANE" = "SUPERSEDED" ]; then
    echo "Warning: Issue #$ISSUE_NUM not found in ownership directory or is SUPERSEDED." >&2
    echo "Defaulting to lane/expand-product. Provide explicit lane if different." >&2
    LANE="lane/expand-product"
  fi

  if [ -n "$ARG2" ]; then
    INTENT="$ARG2"
  else
    INTENT="issue-$ISSUE_NUM"
  fi

  BRANCH_NAME="work/${LANE#lane/}/#${ISSUE_NUM}-${INTENT}"
else
  LANE="$ARG1"
  INTENT="$ARG2"
  if [ -z "$INTENT" ]; then
    echo "ERROR: Short intent required when specifying lane directly." >&2
    exit 1
  fi
  BRANCH_NAME="work/${LANE#lane/}/${INTENT}"
fi

# Ensure the parent lane exists
if ! git show-ref --verify --quiet "refs/heads/$LANE"; then
  echo "ERROR: Standing lane '$LANE' does not exist! Run scripts/lanes/sync-lanes.sh first." >&2
  exit 1
fi

# Determine sanitized worktree path outside or inside worktrees directory
WORKTREE_DIR="$ROOT/.worktrees/$(echo "$BRANCH_NAME" | tr '/' '-')"
mkdir -p "$ROOT/.worktrees"

echo "=== Cutting Agent Worktree ==="
echo "Owning Lane:   $LANE"
echo "Work Branch:   $BRANCH_NAME"
echo "Worktree Path: $WORKTREE_DIR"

if [ -d "$WORKTREE_DIR" ]; then
  echo "Notice: Worktree directory already exists at $WORKTREE_DIR"
else
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$LANE"
  echo "Created worktree successfully."
fi

# Copy or symlink .env if root .env exists
if [ -f "$ROOT/.env" ] && [ ! -f "$WORKTREE_DIR/.env" ]; then
  cp "$ROOT/.env" "$WORKTREE_DIR/.env"
  echo "Copied local .env configuration into worktree."
fi

echo ""
echo "Agent Ready! To start work:"
echo "  cd $WORKTREE_DIR"
echo "  npm run dev (or run targeted tests)"
echo ""
echo "Before opening a PR, run from inside the worktree:"
echo "  bash $ROOT/scripts/lanes/verify-agent-pr.sh"
