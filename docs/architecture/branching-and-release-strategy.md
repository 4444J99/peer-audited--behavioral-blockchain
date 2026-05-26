# Branching, Merge & Release Strategy

Canonical reference for how code moves from a developer's machine to production
in Styx. This is the single source of truth; `CONTRIBUTING.md` summarizes the
day-to-day commands and links here for the full model.

> **TL;DR** — Trunk-based development on a protected `main`. Short-lived
> branches → PR → required CI → squash-merge. Production ships by tagging a
> SemVer release on `main`, which runs staging → beta → prod promotion gates
> before a Render deploy. No one pushes to `main` directly.

---

## 1. Branching model — trunk-based

We use **trunk-based development**, not GitFlow. `main` is the trunk and is
always in a releasable state. We deliberately avoid long-lived `develop`/
`release` branches because environment promotion is **gate-based** (workflow
gates + tags), not branch-based — a long-lived `develop` would just be a second
trunk that drifts.

| Branch | Purpose | Lifetime | Protected |
|--------|---------|----------|-----------|
| `main` | Releasable trunk; only source of deploys | Permanent | **Yes** |
| `feat/<slug>` | New feature | Short (hours–days) | No |
| `fix/<slug>` | Bug fix | Short | No |
| `docs/<slug>`, `chore/<slug>`, `refactor/<slug>`, `perf/<slug>` | Maintenance | Short | No |
| `claude/<slug>` | Automated-agent branches | Short | No |

Rules:
- Branch off the latest `main`; keep branches **short-lived** (rebase or merge
  `main` in frequently to avoid drift).
- One logical change per branch/PR. Split large work into stacked PRs.
- Delete the branch after merge (automatic on squash-merge).

## 2. Commits — Conventional Commits

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): subject`. Types: `feat`, `fix`, `docs`, `test`, `chore`,
`refactor`, `perf`, `style`. The commit/PR **labels drive SemVer** via
`release-drafter.yml` (see §6), so the type matters:

- `feat` → minor bump
- `fix` / `chore` / `perf` / `refactor` → patch bump
- a `major` label (or `!`/`BREAKING CHANGE`) → major bump

## 3. Pull requests & merge strategy

1. Open a PR into `main` using the PR template. Start it as a **draft** while
   iterating; mark **ready for review** when CI is green and self-review is done.
2. PRs must be **small and focused**. Large diffs get split.
3. **Squash-and-merge only.** This keeps `main` a clean, linear, one-commit-per-
   change history. Merge commits and rebase-merge are disabled.
4. The squash commit title must be a valid Conventional Commit (the PR title is
   used) so release-drafter categorizes it correctly.
5. Merging requires **all required checks green**, **1+ approving review
   including CODEOWNERS**, **all conversations resolved**, and the branch
   **up to date with `main`** (enforced by the merge queue / strict checks).

### Merge queue
`main` uses GitHub's **merge queue**. The queue re-runs required checks against
the post-merge result (`merge_group` event in `ci.yml`), eliminating "green PR
breaks main because it was behind" races. Authors click *Merge when ready*; the
queue serializes and validates.

## 4. Branch protection (enforced as code)

Protection for `main` is defined as a GitHub **ruleset** in
`.github/rulesets/main.json` (import via *Settings → Rules → Rulesets → Import*,
or `gh api` — see `.github/rulesets/README.md`). It encodes:

- Require a pull request before merging — **no direct pushes to `main`**.
- Require **1+ approving review** + **CODEOWNERS review** + **dismiss stale
  approvals on new commits** + **require conversation resolution**.
- Require **status checks to pass** and the branch to be **up to date**
  (strict). Required contexts:
  - `build_and_test` (unit tests + build + lint + validation gates 04/06/07)
  - `Analyze (javascript-typescript)` (CodeQL)
  - `Secret Pattern Detection`
- Require **linear history** (pairs with squash-merge).
- Block **force-pushes** and **branch deletion** on `main`.

Advisory (not required) checks — promote to required once stabilized: `e2e`
(browser flakiness), `beta_readiness` (needs live infra URLs), `terraform_validate`.

## 5. Environments & promotion flow

Three deployment environments, all on Render, each a GitHub **Environment** with
its own secrets and (for `production`) **required reviewers**:

```
 PR ──required CI──▶ main ──tag vX.Y.Z──▶ deploy.yml
                                             │
                                             ├─ staging_promotion_gate  (deploy staging + smoke)
                                             ├─ beta_promotion_gate      (deploy beta + smoke)
                                             ├─ preflight  (only main / refs/tags/v*)
                                             ├─ deploy_api + deploy_web  (env: production)
                                             ├─ migrate                  (env: production)
                                             └─ smoke_test               (env: production, rollback on failure)
```

- **staging** — first stop; validated by `staging-promotion.yml`.
- **beta** — gated by `beta-promotion.yml` (optional manual-approval pause,
  optional migrations).
- **production** — `deploy.yml`; the `production` Environment should require
  manual reviewer approval, so a human approves every prod deploy.

Promotion gates are reusable workflows (`workflow_call`) and can also be run
manually via `workflow_dispatch` for out-of-band validation.

## 6. Releasing to production

Production deploys are **tag-driven** (`deploy.yml` triggers on `refs/tags/v*`),
never on a raw push to `main`.

1. Merge all intended PRs into `main`. `release-drafter.yml` keeps a **draft
   release** updated with categorized notes and the next SemVer version.
2. When ready to ship, **publish the drafted release** (or push a `vX.Y.Z` tag
   on `main`). SemVer per §2.
3. `deploy.yml` runs: staging gate → beta gate → preflight (asserts ref is a
   `v*` tag or `main`) → deploy API/Web → migrate → smoke test.
4. A manual `workflow_dispatch` of `deploy.yml` is allowed **only from `main`**
   (enforced in `preflight`).

### Database migrations
Migrations run in the `migrate` job **after** the API deploys, against the
production `DATABASE_URL`. Write migrations to be **forward-only and
backward-compatible** with the previously-deployed code (expand/contract
pattern): add columns/tables in one release, backfill, switch reads, drop in a
later release. Never ship a migration that the currently-running code can't
tolerate, since deploy and migrate are not perfectly simultaneous.

## 7. Rollback

Current `smoke_test` does a **best-effort redeploy** on health-check failure —
this is *not* a deterministic rollback. Target state (tracked as follow-up):

- **API/Web:** roll back to the previous **known-good Render deploy id** (Render
  "rollback to deploy") rather than re-deploying the same bad commit; or
  re-deploy the previous `vX.Y.Z` tag.
- **DB:** because migrations are forward-only, a code rollback must remain
  compatible with the already-applied schema — this is exactly why §6 mandates
  expand/contract. Never auto-run "down" migrations in prod.
- Cutting a hotfix: branch `fix/<slug>` off `main`, PR, squash-merge, tag a new
  patch release.

## 8. Hotfix path

There is no separate hotfix branch line. A production incident is fixed the same
way as any change — `fix/<slug>` → PR → required CI → squash-merge → patch tag —
just expedited. Because `main` is always releasable, the trunk *is* the hotfix
base.

## 9. Why these choices

- **Trunk-based + squash** keeps history bisectable and avoids merge-hell; it
  matches the small-PR, fast-review culture and the gate-based promotion already
  in place.
- **Required, blocking CI** (the previous pipeline ran every job
  `continue-on-error: true`, so a red build still reported success and could
  merge) is the single most important correctness fix: required checks must be
  able to **fail a merge**.
- **Tag-driven, human-approved prod** gives an auditable, deliberate release
  event for a platform that moves real money.
