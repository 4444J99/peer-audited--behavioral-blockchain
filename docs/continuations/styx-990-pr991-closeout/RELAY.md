# RELAY

**What changed:** The local-demo login-throttle implementation was narrowed,
verified, pushed, and submitted as Styx PR #991. This continuation capsule
homes its exact-head review boundary and the two external owner receipts found
during closeout.

**Proof:** implementation head
`41e63855170994da52f12cca5d1ebdb9f9e8d0b0`; issue #990 is `PR_CREATED` in a
reconciled, tested triage batch; PR #991 is open against `lane/verify`; the
capsule's `done.sh` is the live fixed-point predicate.

**Launch:** `bash docs/continuations/styx-990-pr991-closeout/launch.sh`

**Authority boundary:** Anthony retains merge and deployment authority. Render
credential recovery is owned by Limen #2670. The unratified founder package is
owned by the existing Limen #267 human-decision lever. This capsule may respond
to a concrete review correction only; it may not decide or execute either
external gate. Merge is permitted only with Anthony's explicit authorization
for the exact verified head, after the requested `jtenen` review is resolved
and no requested correction or required check remains outstanding. Head
movement invalidates this receipt and requires re-review.

**Closeout tooling owners:** [Limen #2671](https://github.com/4444J99/limen/issues/2671)
owns the stale editable `organvm` runtime without authorizing loss of its local
commits; [organvm-engine #203](https://github.com/organvm/organvm-engine/issues/203)
owns relocated `CODEX_HOME` discovery; [organvm-engine #70](https://github.com/organvm/organvm-engine/issues/70)
owns the bounded plans-discovery hang; and
[corpvs #352](https://github.com/organvm/organvm-corpvs-testamentvm/issues/352)
owns the missing prompt-distillation input contract. These are outside this
capsule's execution scope.
