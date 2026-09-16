# Runtime decision contract

Read `workstream.json` before acting. Recheck the finite runway at packet
boundaries and emit a successor before expiry rather than resetting its clock.

## First probes

```bash
git status --short --branch
git rev-parse HEAD
git ls-remote --heads origin work/verify/990-local-demo-login-throttle chore/styx-990-pr991-closeout
gh pr view 991 --json state,isDraft,headRefOid,baseRefName,mergeStateStatus,reviewDecision,statusCheckRollup,url
gh issue view 990 --json state,url
bash docs/continuations/styx-990-pr991-closeout/done.sh
bash docs/continuations/styx-990-pr991-closeout/switch.sh
```

Run each command separately on a judged shell rail. Do not synchronously wait,
poll, retrigger checks, or rewrite a green exact head merely because the base
branch moved.

## State derivation

- `settled`: `done.sh` passes twice with identical output and no repository change;
- `wait_relay`: PR #991 remains open at the verified head with no correction request;
- `switch`: the PR merged, its head changed, a review requested changes, or a check failed;
- `invalid`: owner, branch, receipt, or repository state contradicts the capsule.

`switch.sh` exits `0` only when another bounded lane is now required, `1` for
the stable `wait_relay` state, and `2` for invalid state. A merged PR requires a
new, post-merge triage/cleanup lane; it is never inferred from a clean merge
status.

## External owner receipts

- Render credential recovery is homed on the credential Wall at
  [Limen #2670](https://github.com/4444J99/limen/issues/2670). No value is stored here.
- The unratified September founder package is bound to the existing human
  decision lever at [Limen #267](https://github.com/4444J99/limen/issues/267#issuecomment-5704120549).

Those owners are outside this capsule's execution scope.
