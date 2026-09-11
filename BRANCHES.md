# Branch Constitution

Default branch: `main`
Policy: GitHub Flow on top of a small set of standing program lanes.
Worktrees: one worktree per active working branch. Do not pile unrelated WIP onto a lane.

## Standing branches (always exist)

| Branch | Purpose | Merge into | Green means |
| --- | --- | --- | --- |
| `main` | Production-true trunk. Always releasable. | tags / releases | required CI + tests pass; purpose invariants hold |
| `lane/heal` | Repair rot, tech debt that blocks shipping, broken paths | `main` | fixes apply cleanly, no regressions, tests pass |
| `lane/expand-product` | Completing the stated product feature coverage | `main` | new features match PRD, no regressions |
| `lane/expand-external` | Unlocking external vendor/legal dependencies | `main` | dependencies licensed/mocked, CI passes |
| `lane/evolve` | Architecture/platform changes (post-beta) | `main` | structural tests pass, performance holds |

## Rules for lanes

- A lane exists only if there is ongoing, recurring work of that kind for the life of the repo.
- One intention per working branch. Working branches are cut FROM the relevant lane (or from main if no lane is needed), and merge BACK to that lane or to main via PR.
- Prefer worktrees over extra long-lived clones of the same lane: one worktree per active working branch.
- Naming for work branches:
  - `work/<lane>/<short-intent>` or `feat|fix|chore|docs|test/<short-intent>`
  - never `fix-stuff`, `wip`, `temp`, `asdf`
- After merge, delete the working branch. Keep the lane.
- If a lane has no work for a long time, mark it "dormant" here.
- **What must never live on a lane:** Code that violates the repository's core invariants, hardcoded credentials, or experimental code that lacks an intention track.

## Exception branches
- `hotfix/*` from main for production breaks, merge to main, then back-port to any living lanes.
- `release/*` only if this repo ships versioned artifacts and already needs a freeze line.
