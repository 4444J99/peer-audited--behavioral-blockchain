# Branch protection as code

`main.json` is the GitHub **ruleset** that protects `main`, and it is the _only_
layer of protection on this repo (see [One layer, not two](#one-layer-not-two)).
It is the source of truth so the policy is reviewable and versioned rather than
living only in repo settings. See
[`docs/architecture/branching-and-release-strategy.md`](../../docs/architecture/branching-and-release-strategy.md)
§4 for the rationale.

> GitHub cannot read this file from the repo contents — it must be pushed to the
> API whenever it changes. `scripts/branch-protection.sh` does that, and its
> `check` mode detects when the live settings have drifted away from this file.

## Apply / verify

```bash
scripts/branch-protection.sh check   # does live match this file?
scripts/branch-protection.sh apply   # push this file to GitHub
```

Both need a token with **repo-admin** rights; `gh auth login` as the repo owner
covers it. `check` resolves the ruleset by **name**, so deleting and recreating
it in the UI does not break the script.

To import through the UI instead: Settings → **Rules** → **Rulesets** →
**New ruleset** → **Import a ruleset** → upload `main.json`.

### Running `check` in CI

`.github/workflows/branch-protection.yml` runs it on changes to this directory,
on pushes to `main`, and weekly.

Reading rulesets requires repo-admin rights, and `administration` is **not** a
grantable `GITHUB_TOKEN` scope — the default workflow token can never do it. To
make the CI check authoritative, add a repository secret:

| Secret                    | Value                                                              |
| ------------------------- | ------------------------------------------------------------------ |
| `BRANCH_PROTECTION_TOKEN` | Fine-grained PAT scoped to this repo with **Administration: read** |

Without it the job emits a warning and passes, so a missing secret never blocks
a merge — but drift is then only caught by running `check` locally. The job is
deliberately **not** a required status check: it reports on repository
configuration, not on the code in the PR.

## What it enforces

- No direct pushes, force-pushes, or deletion of `main`; linear history.
- A PR is required. **Squash** is the only allowed merge method.
- Required status checks: `build_and_test`, `Analyze (javascript-typescript)`,
  `Secret Pattern Detection`.
- Repo **admins can bypass**, so the owner can never be locked out of their own
  repository.

Deliberately **not** enforced, and why:

| Not required               | Why                                                                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approving reviews          | Solo maintainer. GitHub does not let you approve your own PR, so requiring even one approval makes every PR permanently unmergeable.                                                                                                                           |
| CODEOWNERS review          | Same reason.                                                                                                                                                                                                                                                   |
| Conversation resolution    | Three review bots (CodeRabbit, Sourcery, CodeQL) post threads automatically. Those threads stay merge-blocking even after they go `outdated`, so this gates merges on stale bot chatter while carrying no safety signal — reviews themselves are not required. |
| Strict (up-to-date) checks | Forces every open PR to rebase after each merge to `main`. Real value only with concurrent contributors landing conflicting work.                                                                                                                              |
| Merge queue                | Same — needs contention to be worth its latency.                                                                                                                                                                                                               |

Promote any of these the moment the repo gains a second regular committer. They
are the right controls for a team and pure friction for one person.

## One layer, not two

GitHub has **two independent** protection systems — classic _branch protection_
and _rulesets_ — and enforces the **union** of both. A rule relaxed here stays in
force if classic protection still sets it, and classic protection is invisible
from the Rulesets UI.

This is not hypothetical. Until 2026-07-30 this repo had both:

- this file requiring status checks (**never applied** — the live ruleset was a
  stripped-down copy), and
- classic protection requiring conversation resolution.

The effective policy was therefore "stale bot threads block merges, but CI does
not have to pass" — the exact inverse of the intent, and the reason `main` could
sit red for a week while merges stayed blocked on resolved-but-outdated threads.

**Do not re-add classic branch protection.** `scripts/branch-protection.sh check`
fails if it reappears.

## Keeping check names in sync

The `required_status_checks[].context` values must exactly match GitHub
**job/check names**. If you rename a job in `.github/workflows/*.yml`, update
this file and re-apply, or merges will block forever waiting on a check that
never reports. Current mapping:

| Context here                      | Produced by                                     |
| --------------------------------- | ----------------------------------------------- |
| `build_and_test`                  | `.github/workflows/ci.yml` job `build_and_test` |
| `Analyze (javascript-typescript)` | `.github/workflows/codeql.yml`                  |
| `Secret Pattern Detection`        | `.github/workflows/secret-scan.yml` job name    |

Verify a context actually reports before adding it:

```bash
gh pr checks <pr-number>          # names reported on a PR
gh api repos/{owner}/{repo}/commits/main/check-runs --jq '.check_runs[].name'
```
