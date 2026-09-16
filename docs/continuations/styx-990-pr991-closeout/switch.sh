#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CAPSULE_PATH="docs/continuations/styx-990-pr991-closeout"
EXPECTED_HEAD="41e63855170994da52f12cca5d1ebdb9f9e8d0b0"
EXPECTED_URL="https://github.com/4444J99/peer-audited--behavioral-blockchain/pull/991"
cd "$ROOT"

launch_status=0
launch_output="$(bash "$CAPSULE_PATH/launch.sh" --check 2>&1)" || launch_status=$?
if [[ "$launch_status" -eq 75 ]]; then
  printf '%s\n' "switch: workstream runway is near expiry or expired; emit a finite successor"
  exit 0
fi
if [[ "$launch_status" -ne 0 ]]; then
  printf '%s\n' "invalid: capsule contract or launch surface failed validation" >&2
  printf '%s\n' "$launch_output" >&2
  exit 2
fi

if ! PR_JSON="$(gh pr view 991 --json state,isDraft,headRefOid,headRefName,baseRefName,mergeStateStatus,reviewDecision,statusCheckRollup,url)"; then
  printf '%s\n' "invalid: PR #991 could not be read" >&2
  exit 2
fi
if ! pr_fields="$(jq -er '
  if
    (.state | type) == "string" and
    (.isDraft | type) == "boolean" and
    (.headRefOid | type) == "string" and
    (.headRefName | type) == "string" and
    (.baseRefName | type) == "string" and
    (.mergeStateStatus | type) == "string" and
    ((.reviewDecision // "") | type) == "string" and
    (.statusCheckRollup | type) == "array" and
    (.url | type) == "string"
  then
    [.state, (.isDraft | tostring), .headRefOid, .headRefName, .baseRefName,
     .mergeStateStatus, (.reviewDecision // ""), .url] | join("\u001f")
  else
    error("invalid PR payload")
  end
' <<<"$PR_JSON")"; then
  printf '%s\n' "invalid: PR #991 returned malformed owner data" >&2
  exit 2
fi
if ! IFS=$'\x1f' read -r state is_draft head_sha head_name base merge_status review url <<<"$pr_fields"; then
  printf '%s\n' "invalid: PR #991 owner fields could not be decoded" >&2
  exit 2
fi

if [[ "$state" == "MERGED" ]]; then
  printf '%s\n' "switch: post-merge triage, landing proof, and cleanup lane required"
  exit 0
fi

if [[ "$state" != "OPEN" || "$base" != "lane/verify" || "$head_name" != "work/verify/990-local-demo-login-throttle" || "$url" != "$EXPECTED_URL" ]]; then
  printf '%s\n' "invalid: PR #991 owner identity, state, or base is contradictory" >&2
  exit 2
fi

if [[ "$head_sha" != "$EXPECTED_HEAD" ]]; then
  printf '%s\n' "switch: PR head changed; re-derive the implicated verification shard"
  exit 0
fi

if [[ "$is_draft" == "true" ]]; then
  printf '%s\n' "switch: PR #991 returned to draft and needs a bounded readiness lane"
  exit 0
fi

if [[ "$review" == "CHANGES_REQUESTED" ]]; then
  printf '%s\n' "switch: review correction lane required"
  exit 0
fi

case "$merge_status" in
  CLEAN | BEHIND | BLOCKED) ;;
  *)
    printf '%s\n' "switch: PR merge state requires a bounded diagnostic lane"
    exit 0
    ;;
esac

if ! jq -e '
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
' >/dev/null <<<"$PR_JSON"; then
  printf '%s\n' "switch: failed or pending PR evidence requires a bounded diagnostic lane"
  exit 0
fi

printf '%s\n' "wait_relay: exact-head PR remains the durable owner; do not poll"
exit 1
