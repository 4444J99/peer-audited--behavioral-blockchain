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
- Production releases are tag-driven (`vX.Y.Z`) from `main`.

## Branch families

### `main`

Purpose: releasable trunk and default branch.

Rules:
- protected and cannot be pushed directly
- required CI must pass before merging
- branch deletion and force-push are blocked
- production deploys are triggered from tagged releases on `main`

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
- `formal-repair-starter-2026-09-02` is a descriptive branch name for a temporary repair lane; it should still be treated as short-lived and merged or retired promptly.

## Repo evidence: current branch inventory

Verified against the live repo state on 2026-09-10:

- `main` — canonical trunk and protected deployment branch
- `4444j99-behavioral-blockchain-audit` — local audit/review branch for investigation and evidence gathering
- `capture/main-deferred` — older deferred branch that remains explicitly outside the current default work path
- `docs/activation-ci-evidence-20260908` — branch backing an open PR for evidence and CI classification work (`#967`)
- `feat/agent-action-evidence` — branch backing an open feature PR (`#956`)
- `fix/restore-ts6-and-pages-checkout` — branch backing an open fix PR (`#952`)
- `formal-repair-starter-2026-09-02` — short-lived repair lane still in progress via PR `#961`
- `dependabot/...` — automated dependency update branches, some still open and some already merged or closed

The current branch posture is consistent with the repo’s documented model: a stable trunk plus a small number of short-lived, focused work branches that are merged through PRs into `main`.

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
- tag-based production release from `main`
- staging / beta / production gates
- no direct main pushes

## Notes for future work

This repo is a prototype for Styx, and branch discipline is part of the evidence-first operating posture. The branch model exists to keep the default branch releaseable, the work traceable, and the inspection story credible.

For deeper policy and deployment rules, see:
- `docs/architecture/branching-and-release-strategy.md`
- `docs/triage.json`
- `AGENTS.md`
