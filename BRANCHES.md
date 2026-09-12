# Branch Constitution

Default branch: `main`
Policy: GitHub Flow on top of a small set of standing program lanes.
Worktrees: one worktree per active working branch. Do not pile unrelated WIP onto a lane.

## Standing branches (always exist)

| Branch | Purpose | Merge into | Green means |
| --- | --- | --- | --- |
| `main` | Production-true trunk. Always releasable. | tags / releases | required CI + tests pass; purpose invariants hold |
| `lane/verify` | Proof: tests, contracts, CI, reproducibility | `main` | verification suite is stricter or equally true |
| `lane/heal` | Repair rot, debt that blocks shipping, broken paths | `main` | fixes apply cleanly, no regressions, tests pass |
| `lane/expand` | Complete already-stated Omega scope | `main` | new coverage is verified, not merely sketched |
| `lane/evolve` | Architecture/platform changes (post-beta) | `main` | structural tests pass, performance holds |

## Rules for lanes

- A lane exists only if there is ongoing, recurring work of that kind for the life of the repo.
- One intention per working branch. Cut FROM the relevant lane or `main`, merge BACK via PR.
- Naming: `work/<lane>/<short-intent>` or `feat|fix|chore|docs|test/<short-intent>`. Never `temp` or `wip`.
- Delete working branch after merge.
- `hotfix/*` from `main` → PR to `main` → back-port.
- If a lane has no work for a long time, mark it "dormant" here.
- **What must never live on a lane:** Code that violates the repository's core invariants, hardcoded credentials, or experimental code that lacks an intention track.

## Exception branches
- `hotfix/*` from main for production breaks, merge to main, then back-port to any living lanes.
- `release/*` only if this repo ships versioned artifacts and already needs a freeze line.
