#!/usr/bin/env bash
#
# Branch protection as code — apply it, and detect drift from it.
#
# `.github/rulesets/main.json` is the single source of truth for `main`'s
# protection. GitHub cannot read that file from the repo contents, so it has to
# be pushed to the API. This script pushes it (`apply`) and verifies the live
# settings still match it (`check`).
#
# `check` also fails when *classic* branch protection exists on `main`. Classic
# protection and rulesets are independent systems and GitHub enforces the union
# of both, so a leftover classic rule silently overrides anything relaxed here.
# That is not hypothetical: this repo spent a week requiring stale bot review
# threads to be resolved (classic) while not requiring CI to pass (neither
# layer), because the ruleset in this file had never actually been applied.
#
# Usage:
#   scripts/branch-protection.sh check    # compare live settings to the file
#   scripts/branch-protection.sh apply    # push the file to GitHub
#
# Requires: gh (authenticated with repo admin), node.
# Exit codes: 0 ok · 1 drift · 2 usage/dependency error · 3 cannot read (no admin)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="$ROOT/.github/rulesets/main.json"

command -v gh   >/dev/null 2>&1 || { echo "FAIL: gh is not installed"   >&2; exit 2; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node is not installed" >&2; exit 2; }
[ -f "$SPEC" ]                  || { echo "FAIL: missing $SPEC"         >&2; exit 2; }

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
NAME="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).name)' "$SPEC")"

# Resolve the ruleset by name, not by a hardcoded id, so the script survives a
# delete-and-recreate in the GitHub UI.
ruleset_id() {
  gh api "repos/$REPO/rulesets" --jq ".[] | select(.name==\"$NAME\") | .id" 2>/dev/null | head -1
}

cmd_apply() {
  local id; id="$(ruleset_id)"
  if [ -n "$id" ]; then
    echo "Updating ruleset '$NAME' (id=$id) on $REPO"
    gh api -X PUT "repos/$REPO/rulesets/$id" --input "$SPEC" >/dev/null
  else
    echo "Creating ruleset '$NAME' on $REPO"
    gh api -X POST "repos/$REPO/rulesets" --input "$SPEC" >/dev/null
  fi
  echo "OK: applied $SPEC"

  if gh api "repos/$REPO/branches/main/protection" >/dev/null 2>&1; then
    echo "WARN: classic branch protection is also present on 'main'." >&2
    echo "      GitHub enforces the union of classic protection and rulesets," >&2
    echo "      so it can silently override this file. Remove it with:" >&2
    echo "      gh api -X DELETE repos/$REPO/branches/main/protection" >&2
  fi
}

cmd_check() {
  local id live
  id="$(ruleset_id)"
  if [ -z "$id" ]; then
    echo "FAIL: no ruleset named '$NAME' on $REPO — run: scripts/branch-protection.sh apply" >&2
    exit 1
  fi

  if ! live="$(gh api "repos/$REPO/rulesets/$id" 2>/dev/null)"; then
    echo "SKIP: cannot read rulesets on $REPO (token lacks 'administration: read')." >&2
    exit 3
  fi

  # Classic protection is the failure mode this check exists to catch: it is
  # invisible in the ruleset UI but unioned into the effective policy.
  local classic=0
  if gh api "repos/$REPO/branches/main/protection" >/dev/null 2>&1; then
    classic=1
  fi

  printf %s "$live" | CLASSIC="$classic" node "$ROOT/scripts/branch-protection-diff.mjs" "$SPEC"
  # node exits non-zero on drift; `set -e` propagates it.
}

case "${1:-}" in
  check) cmd_check ;;
  apply) cmd_apply ;;
  *) echo "usage: $(basename "$0") {check|apply}" >&2; exit 2 ;;
esac
