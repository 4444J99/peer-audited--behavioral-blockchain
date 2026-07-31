#!/usr/bin/env bash
#
# Branch protection as code — apply it, and detect drift from it.
#
# `.github/rulesets/main.json` is the single source of truth for the default
# branch's protection. GitHub cannot read that file from the repo, so it has to
# be pushed to the API. This script pushes it (`apply`) and verifies the live
# settings still match it (`check`).
#
# Why this exists: this repo spent a week enforcing the inverse of its stated
# policy. The ruleset file required status checks but had never been applied,
# while a separate classic branch-protection rule required conversation
# resolution. GitHub enforces the *union* of the two systems and classic
# protection is invisible from the Rulesets UI, so the effective policy was
# "stale bot threads block merges, but CI need not pass" — and nothing detected
# the divergence.
#
# Usage:
#   scripts/branch-protection.sh check    # compare live settings to the file
#   scripts/branch-protection.sh apply    # push the file to GitHub
#
# Requires: gh, node. `check` works with any token; `apply` needs repo admin.
# Exit codes: 0 ok · 1 drift · 2 usage/dependency error · 3 cannot read
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="$ROOT/.github/rulesets/main.json"

command -v gh   >/dev/null 2>&1 || { echo "FAIL: gh is not installed"   >&2; exit 2; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node is not installed" >&2; exit 2; }
[ -f "$SPEC" ]                  || { echo "FAIL: missing $SPEC"         >&2; exit 2; }

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
BRANCH="${BRANCH:-$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)}"
NAME="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).name)' "$SPEC")"

# Resolve the ruleset by name rather than a hardcoded id, so the script survives
# a delete-and-recreate in the UI. Listing rulesets needs repo admin; a 403 must
# not be read as "the ruleset does not exist", which would report false drift.
# Sets RULESET_ID (possibly empty); returns 3 when the list itself is unreadable.
RULESET_ID=""
ruleset_id() {
  local list
  if ! list="$(gh api "repos/$REPO/rulesets" 2>/dev/null)"; then
    return 3
  fi
  RULESET_ID="$(printf %s "$list" | NAME="$NAME" node -e '
    const rs = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const hit = rs.find((r) => r.name === process.env.NAME);
    process.stdout.write(hit ? String(hit.id) : "");
  ')"
}

# true / false / null(unknown). A 404 "Branch not protected" is a definitive
# absence; a 403 only means this token cannot tell, which is not the same thing.
probe_classic() {
  local out rc=0
  out="$(gh api "repos/$REPO/branches/$BRANCH/protection" 2>&1)" || rc=$?
  if [ "$rc" -eq 0 ]; then echo true; return; fi
  case "$out" in
    *"Branch not protected"*) echo false ;;
    *) echo null ;;
  esac
}

cmd_apply() {
  local rc=0
  ruleset_id || rc=$?
  if [ "$rc" -eq 3 ]; then
    echo "FAIL: cannot list rulesets on $REPO — apply needs a token with repo-admin rights." >&2
    exit 3
  fi

  if [ -n "$RULESET_ID" ]; then
    echo "Updating ruleset '$NAME' (id=$RULESET_ID) on $REPO"
    gh api -X PUT "repos/$REPO/rulesets/$RULESET_ID" --input "$SPEC" >/dev/null
  else
    echo "Creating ruleset '$NAME' on $REPO"
    gh api -X POST "repos/$REPO/rulesets" --input "$SPEC" >/dev/null
  fi
  echo "OK: applied $SPEC"

  if [ "$(probe_classic)" = "true" ]; then
    echo "WARN: classic branch protection is also present on '$BRANCH'." >&2
    echo "      GitHub enforces the union of classic protection and rulesets," >&2
    echo "      so it can silently override this file. Remove it with:" >&2
    echo "      gh api -X DELETE repos/$REPO/branches/$BRANCH/protection" >&2
  fi
}

cmd_check() {
  local effective ruleset="null" classic rc=0

  # Effective ruleset-sourced rules for the branch, with full parameters. This
  # endpoint needs no special permissions, so the core policy is always
  # verifiable — including in CI with the default GITHUB_TOKEN.
  if ! effective="$(gh api "repos/$REPO/rules/branches/$BRANCH" 2>/dev/null)"; then
    echo "FAIL: cannot read effective branch rules for '$BRANCH' on $REPO." >&2
    exit 3
  fi

  # Admin-only enrichments: bypass_actors and enforcement live on the ruleset
  # object, and classic protection is only visible through its own endpoint.
  # Note: classic protection does NOT appear in the effective-rules endpoint
  # above (verified empirically), so without admin it cannot be detected at all.
  # Both are reported as *unverified* rather than silently assumed fine.
  ruleset_id || rc=$?
  if [ "$rc" -eq 0 ] && [ -n "$RULESET_ID" ]; then
    ruleset="$(gh api "repos/$REPO/rulesets/$RULESET_ID" 2>/dev/null || echo null)"
  fi
  classic="$(probe_classic)"

  BRANCH="$BRANCH" node "$ROOT/scripts/branch-protection-diff.mjs" "$SPEC" <<JSON
{ "effective": $effective, "ruleset": $ruleset, "classic": $classic }
JSON
  # node exits non-zero on drift; `set -e` propagates it.
}

case "${1:-}" in
  check) cmd_check ;;
  apply) cmd_apply ;;
  *) echo "usage: $(basename "$0") {check|apply}" >&2; exit 2 ;;
esac
