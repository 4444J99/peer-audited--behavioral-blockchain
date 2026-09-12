#!/usr/bin/env bash
#
# scripts/lanes/sync-lanes.sh
#
# Synchronizes all standing program lanes with the current default branch (`main`).
# Ensures that no standing lane diverges into a permanent stale fork.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
STANDING_LANES=(
  "lane/verify"
  "lane/heal"
  "lane/expand-product"
  "lane/expand-external"
  "lane/evolve-platform"
)

echo "=== Styx Standing Lanes Synchronization ==="
echo "Default trunk: $DEFAULT_BRANCH"

CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")"

for lane in "${STANDING_LANES[@]}"; do
  if ! git show-ref --verify --quiet "refs/heads/$lane"; then
    echo "Creating standing lane: $lane from $DEFAULT_BRANCH"
    git branch "$lane" "$DEFAULT_BRANCH"
  else
    echo "Syncing $lane with $DEFAULT_BRANCH..."
    # Fast-forward or merge default branch into lane
    git checkout -q "$lane"
    git merge -q --no-edit "$DEFAULT_BRANCH" || {
      echo "ERROR: Conflict detected when merging $DEFAULT_BRANCH into $lane!" >&2
      git merge --abort || true
      exit 1
    }
  fi
done

# Return to original branch if it was not detached
if [ "$CURRENT_BRANCH" != "detached" ]; then
  git checkout -q "$CURRENT_BRANCH"
fi

echo "=== All 5 standing lanes are synchronized with $DEFAULT_BRANCH ==="
