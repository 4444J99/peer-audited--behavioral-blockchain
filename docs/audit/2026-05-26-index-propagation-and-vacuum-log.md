# Index Propagation & Vacuum Log — 2026-05-26

Close-out record for the security-remediation + release-engineering work merged to
`main` as squash **`f45c80c`** (PR #607). This file exists because the canonical
**IRF** registry
(`meta-organvm/organvm-corpvs-testamentvm/INST-INDEX-RERUM-FACIENDARUM.md`) lives in
a **different repository** that this session's GitHub access is explicitly restricted
from — so the propagation that would normally happen there is *logged here* for the
operator to carry across with `organvm irf`.

## Completed work (for IRF `## Completed`)
- Audited the #605 hardening commit; surfaced **89 findings** (see
  `2026-05-26-issue-discovery-hardening-commit-605.md`) and **remediated all 89**.
- Added the branching/merge/release-engineering system (blocking CI, branch-protection
  ruleset, canonical strategy doc).
- Verified: `tsc --noEmit` clean; **994 tests / 95 suites** green locally.
- Merged squash `f45c80c`; feature branch auto-deleted; local `main` ≡ `origin/main`.

## Data-integrity audit (the "nothing lost" check)
Proven, not asserted:
- `git diff <feature-branch-HEAD> origin/main` → **empty (exit 0)**: the squash tree is
  byte-identical to the pre-merge branch. No content lost.
- Working tree clean; **0 stashes**; no uncommitted/untracked files at close.
- Every change is on the **remote** (`origin/main`). The local feature-branch commits
  that still show as "ahead" are commit-identity duplicates of already-squashed content,
  not unsaved work. **local : remote = 1 : 1** at the content level.

## Cross-index propagation status (default: check all, skip inapplicable)
| Index | Status | Note |
|-------|--------|------|
| IRF master registry (`meta-organvm/...`) | **BLOCKED — unreachable** | Different repo; out of this session's authorized scope. Operator must run `organvm irf` to move these items to `## Completed`. |
| GitHub issues (this repo) | **CHECKED — none closed** | No open issue is *resolved* by this work. Contributes to #555 (market-safe money) and #556 (proof integrity) phase gates but does not close them. #603 (npm-audit vulns) is **NOT** fixed (CI audit was made advisory, not the vulns fixed). |
| Omega scorecard | **N/A here** | Lives in `meta-organvm`; unreachable from this session. |
| `inquiry-log.yaml` (SGO) | **N/A** | Not SGO/inquiry work; file not present in this repo. |
| `seed.yaml` | **CHECKED — no change** | No organ edge/agent/governance change; nothing to update. |
| `CLAUDE.md` (`docs/CLAUDE.md`) | **UPDATED (minimal)** | Added `ENTERPRISE_SSO_SECRET` to required env vars. Architecture deltas recorded in `.claude/MEMORY.md`. |
| Concordance | **N/A** | No new cross-repo IDs introduced. |
| `.claude/MEMORY.md` | **UPDATED** | Full remediation + release-eng record + Known Gaps appended. |

## Vacuums found — researched, planned, logged
A vacuum (N/A / missing data / void seed) is a directive to fill, per standing policy.

1. **Logos Documentation Layer is MISSING (Symmetry 0.0 / VACUUM).**
   - *Research:* `docs/CLAUDE.md` declares the tetradic narrative layer in `docs/logos/`
     — `telos.md` (ideal), `pragma.md` (honest current state), `praxis.md` (remediation
     plan), `receptio.md` (reception), `alchemical-io.md` (I/O narrative) — and reports
     it "currently void."
   - *Plan:* build the five docs grounded in the real repo state (this audit gives
     `pragma`/`praxis` most of their content for free). Scoped as a dedicated follow-up,
     not bolted onto a security change.
   - *Status:* **LOGGED** (not yet built) — top documentation follow-up.

2. **`build_and_test` does not run on PRs.**
   - *Research:* `ci.yml` is valid YAML and triggers on `pull_request`→`main`, yet only
     codeql / secret-scan / release-drafter produced checks; `build_and_test` never
     registered. Cause is a repo **Actions setting** (workflow-run approval / Actions
     permissions), not the workflow file.
   - *Plan:* fix the Actions setting so `ci.yml` runs, **then** apply
     `.github/rulesets/main.json` — otherwise the required `build_and_test` check would
     deadlock every merge.
   - *Status:* **LOGGED — operator action required.**

3. **IRF / omega / inquiry-log / concordance are unreachable from this repo.**
   - *Research:* they live in `meta-organvm/organvm-corpvs-testamentvm`; no `organvm`
     CLI is installed in this environment and GitHub access is scoped to this one repo.
   - *Plan:* operator runs `organvm irf` (and scorecard/concordance updates) from a
     context with access; this log is the source material.
   - *Status:* **LOGGED — operator action required.**

## Operator checklist (carry to the universal context)
- [ ] `organvm irf` — move these items to `## Completed`; update statistics.
- [ ] Dismiss the CodeQL SSRF alert (justification: IP-pinned to a pre-validated
      address, all A-records validated, redirects disabled, tenant/admin-gated).
- [ ] Fix the Actions setting so `build_and_test` runs; then import
      `.github/rulesets/main.json`.
- [ ] Set `ENTERPRISE_SSO_SECRET` in each environment (Render + GitHub Environments).
- [ ] Build the `docs/logos/` tetradic layer.
