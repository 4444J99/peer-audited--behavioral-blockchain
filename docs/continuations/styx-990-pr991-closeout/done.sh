#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

CAPSULE_BRANCH="chore/styx-990-pr991-closeout"
CAPSULE_PATH="docs/continuations/styx-990-pr991-closeout"
IMPLEMENTATION_BRANCH="work/verify/990-local-demo-login-throttle"
IMPLEMENTATION_HEAD="41e63855170994da52f12cca5d1ebdb9f9e8d0b0"
PR_URL="https://github.com/4444J99/peer-audited--behavioral-blockchain/pull/991"

fail() {
  printf 'closeout predicate: FAIL: %s\n' "$1" >&2
  exit 1
}

[[ "$(git branch --show-current)" == "$CAPSULE_BRANCH" ]] || fail "wrong branch"
[[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || fail "working tree is not clean"

head_sha="$(git rev-parse HEAD)"
remote_capsule_head="$(git ls-remote --heads origin "$CAPSULE_BRANCH" | awk '{print $1}')"
[[ "$remote_capsule_head" == "$head_sha" ]] || fail "capsule head is not pushed exactly"

remote_implementation_head="$(git ls-remote --heads origin "$IMPLEMENTATION_BRANCH" | awk '{print $1}')"
[[ "$remote_implementation_head" == "$IMPLEMENTATION_HEAD" ]] || fail "implementation head drifted"
git merge-base --is-ancestor "$IMPLEMENTATION_HEAD" HEAD || fail "capsule does not descend from implementation head"

unexpected_paths="$(git diff --name-only "$IMPLEMENTATION_HEAD" HEAD -- | awk -v prefix="$CAPSULE_PATH/" 'index($0, prefix) != 1 {print}')"
[[ -z "$unexpected_paths" ]] || fail "capsule branch changes non-capsule paths"
git diff --check "$IMPLEMENTATION_HEAD" HEAD || fail "diff check failed"

bash "$CAPSULE_PATH/launch.sh" --check || fail "capsule launch surface is invalid or expiring"

pr_json="$(gh pr view 991 --json state,isDraft,headRefOid,headRefName,baseRefName,mergeStateStatus,reviewDecision,statusCheckRollup,url)"
jq -e --arg head "$IMPLEMENTATION_HEAD" --arg url "$PR_URL" '
  .state == "OPEN" and
  .isDraft == false and
  .headRefOid == $head and
  .headRefName == "work/verify/990-local-demo-login-throttle" and
  .baseRefName == "lane/verify" and
  .mergeStateStatus as $merge_status |
  (["CLEAN", "BEHIND", "BLOCKED"] | index($merge_status)) != null and
  .reviewDecision != "CHANGES_REQUESTED" and
  .url == $url and
  (.statusCheckRollup | length) > 0 and
  all(.statusCheckRollup[];
    if .__typename == "CheckRun" then
      .conclusion as $conclusion |
      .status == "COMPLETED" and (["SUCCESS", "SKIPPED", "NEUTRAL"] | index($conclusion)) != null
    elif .__typename == "StatusContext" then
      .state == "SUCCESS"
    else
      false
    end)
' >/dev/null <<<"$pr_json" || fail "PR #991 is not an exact-head ready owner"

[[ "$(gh issue view 990 --json state --jq .state)" == "OPEN" ]] || fail "issue #990 is not open"
[[ "$(gh issue view 369 --json state --jq .state)" == "OPEN" ]] || fail "parent issue #369 is not open"
gh issue view 2670 --repo 4444J99/limen --json number,url >/dev/null || fail "Render credential owner is missing"
gh issue view 267 --repo 4444J99/limen --json number,url >/dev/null || fail "founder decision owner is missing"

jq -e --arg pr "$PR_URL" '
  .issues["990"].state == "PR_CREATED" and
  .issues["990"].pr == $pr and
  .issues["990"].evidence == "src/api/src/common/guards/app-throttler.guard.spec.ts:118" and
  any(.batches[];
    .id == "verify-login-throttle-2026-09-16" and
    .reconciled == true and
    .test_passed == true)
' docs/triage.json >/dev/null || fail "triage owner drifted"

bash scripts/triage/report.sh >/dev/null || fail "triage report failed"

printf '%s\n' \
  "capsule custody: exact local and remote head" \
  "implementation custody: exact pushed head $IMPLEMENTATION_HEAD" \
  "owner state: issue #990 OPEN, PR #991 exact-head/non-draft with terminal checks, parent #369 OPEN" \
  "triage state: PR_CREATED, reconciled, tested" \
  "external gates: durably owned" \
  "closeout predicate: PASS"
