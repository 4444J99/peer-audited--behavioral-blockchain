# Styx #990 / PR #991 continuation capsule

This is the durable prompt index for the verified local-demo login-throttle
slice. It carries no second implementation mandate: issue #990, PR #991, and
the repository triage ledger remain the implementation owners.

Read these tracked modules in order:

1. [`workstream.json`](workstream.json) — finite, provider-neutral runway and authorization;
2. [`intent.md`](intent.md) — the single-purpose objective and authority boundary;
3. [`runtime.md`](runtime.md) — live probes and state derivation;
4. [`closeout.md`](closeout.md) — owner and terminal-receipt rules;
5. [`done.sh`](done.sh) — executable fixed-point predicate;
6. [`switch.sh`](switch.sh) — executable session-switch predicate;
7. [`RELAY.md`](RELAY.md) — concise handoff receipt.

The ignored `.limen-workstream/` directory contains the private prompt modules
rendered by Limen's canonical launcher. This tracked directory contains only
the redacted contract and public repository receipts.

## Current durable evidence

- Implementation head: `41e63855170994da52f12cca5d1ebdb9f9e8d0b0`
- Implementation branch: `work/verify/990-local-demo-login-throttle`
- Pull request: [#991](https://github.com/4444J99/peer-audited--behavioral-blockchain/pull/991) to `lane/verify`
- Issue: [#990](https://github.com/4444J99/peer-audited--behavioral-blockchain/issues/990), with parent tracker [#369](https://github.com/4444J99/peer-audited--behavioral-blockchain/issues/369) intentionally open
- Triage: `PR_CREATED`, reconciled batch `verify-login-throttle-2026-09-16`

An open, exact-head PR is a valid lifecycle owner; it is not a merge or
deployment receipt. This capsule does not authorize merging, deployment,
credential changes, founder decisions, or unrelated backlog work.

## One launch command

Run from this capsule worktree:

```bash
bash docs/continuations/styx-990-pr991-closeout/launch.sh
```

Before launching a provider, validate the same command surface without
starting a new session:

```bash
bash docs/continuations/styx-990-pr991-closeout/launch.sh --check
```
