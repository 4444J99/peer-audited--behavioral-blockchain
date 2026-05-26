# Branch protection as code

`main.json` is the GitHub **ruleset** that protects `main`. It is the source of
truth for branch protection so the policy is reviewable and versioned rather
than living only in repo settings. See
[`docs/architecture/branching-and-release-strategy.md`](../../docs/architecture/branching-and-release-strategy.md)
§4 for the rationale.

> GitHub branch protection cannot be set from the repo contents alone — it must
> be applied to the repository settings once (and re-applied when this file
> changes). Do it via the UI import or the API below.

## Apply via UI

Settings → **Rules** → **Rulesets** → **New ruleset** → **Import a ruleset** →
upload `main.json`.

## Apply / update via API

```bash
OWNER=a-organvm
REPO=peer-audited--behavioral-blockchain

# Create (first time)
gh api -X POST "repos/$OWNER/$REPO/rulesets" \
  -H "Accept: application/vnd.github+json" \
  --input .github/rulesets/main.json

# Update (subsequent changes — replace <id> with the ruleset id)
gh api -X PUT "repos/$OWNER/$REPO/rulesets/<id>" \
  -H "Accept: application/vnd.github+json" \
  --input .github/rulesets/main.json

# List existing rulesets to find the id
gh api "repos/$OWNER/$REPO/rulesets"
```

## What it enforces

- No direct pushes / force-pushes / deletion of `main`.
- PR required: 1+ approval, **CODEOWNERS** review, stale-approval dismissal,
  conversation resolution; **squash** is the only allowed merge method.
- Required, strict (up-to-date) status checks: `build_and_test`,
  `Analyze (javascript-typescript)`, `Secret Pattern Detection`.
- Linear history + merge queue (squash, all-green grouping).

## Keeping check names in sync

The `required_status_checks[].context` values must exactly match GitHub
**job/check names**. If you rename a job in `.github/workflows/*.yml`, update
this file and re-apply, or merges will block forever waiting on a check that
never reports. Current mapping:

| Context here | Produced by |
|--------------|-------------|
| `build_and_test` | `.github/workflows/ci.yml` job `build_and_test` |
| `Analyze (javascript-typescript)` | `.github/workflows/codeql.yml` |
| `Secret Pattern Detection` | `.github/workflows/secret-scan.yml` job name |
