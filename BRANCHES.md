# Branches

This repository follows the canonical branch model in
[`docs/architecture/branching-and-release-strategy.md`](docs/architecture/branching-and-release-strategy.md).
This file is the root-level summary for human readers and local review.

## Policy at a glance

- `main` is the only long-lived branch and the sole deploy trunk.
- `main` must stay releasable and green.
- Work happens in short-lived branches that are merged by PR into `main`.
- Merges use squash-merge only.
- Branches are deleted after merge.
- Production releases are triggered by pushing a `vX.Y.Z` tag or via manual `workflow_dispatch` on `main`.

## Branch families

### `main`

Purpose: releasable trunk and default branch.

Rules:
- protected and cannot be pushed directly
- required CI must pass before merging
- branch deletion and force-push are blocked
- production deploys are triggered by pushing a `vX.Y.Z` tag or via manual `workflow_dispatch` on `main`

### Feature and maintenance branches

Use short-lived names that describe the change, not the person or a vague label.

Allowed prefixes:
- `feat/<slug>` for user-facing or product features
- `fix/<slug>` for bug fixes and regression repair
- `docs/<slug>` for docs-only work
- `chore/<slug>` for maintenance and tooling
- `refactor/<slug>` for structural cleanup without behavior change
- `perf/<slug>` for performance work
- `claude/<slug>` for agent-generated work

Examples:
- `feat/agent-action-evidence`
- `fix/restore-ts6-and-pages-checkout`
- `docs/activation-ci-evidence-20260908`
- **Exception:** `formal-repair-starter-2026-09-02` predates this naming policy and does not match the standard prefixes above. It is a one-off, intentional exception for a temporary repair lane and should still be treated as short-lived — merge or retire it promptly rather than treating it as a new precedent.

## Repo evidence: current branch inventory

This section is intentionally live-check guidance, not a hardcoded snapshot. Use
the repo itself to inspect the current branch and PR posture:

```bash
git fetch --all --prune
git branch -a --sort=-committerdate
gh pr list --state open
```

GitHub UI shortcuts:

- Branches: <https://github.com/4444J99/peer-audited--behavioral-blockchain/branches>
- Open PRs: <https://github.com/4444J99/peer-audited--behavioral-blockchain/pulls>

When you check the live inventory, the expected posture is still the same: one
stable trunk (`main`) plus a small number of short-lived, focused work branches
that are merged through PRs into `main`.

## Working rules for this repo

1. Branch off the latest `main`.
2. Keep the lifecycle short: hours to days, not months.
3. Keep one logical change per branch.
4. Rebase or merge `main` frequently.
5. Use descriptive, human-readable names; avoid generic labels like `A`, `B`, `C`.
6. Open a PR against `main` before merge.
7. Require green checks before merge.
8. Squash-merge into `main` so the trunk remains linear.
9. Delete the branch after merge or explicitly archive the work if it remains intentionally deferred.

## Verification and release gates

Branch hygiene is not a substitute for CI. The repo’s release and promotion flow still governs correctness:

- required CI on PRs
- production release triggered by pushing a `vX.Y.Z` tag or via manual `workflow_dispatch` on `main`
- staging / beta / production gates
- no direct main pushes

## Notes for future work

This repo is a prototype for Styx, and branch discipline is part of the evidence-first operating posture. The branch model exists to keep the default branch releaseable, the work traceable, and the inspection story credible.

For deeper policy and deployment rules, see:
- `docs/architecture/branching-and-release-strategy.md`
- `docs/triage.json`
- `AGENTS.md`
