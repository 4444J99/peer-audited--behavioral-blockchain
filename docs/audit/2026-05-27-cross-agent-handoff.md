# Active Handoff — Styx hardening / CI-health session

- **Date:** 2026-05-27
- **Originating work:** audit + remediation of hardening commit #605, release-engineering, CI-debt fix.
- **READ THIS FIRST.** It records live state, constraints, and the human-gated items that remain.

## State of the world

`main` @ `f45c80c` = PR #607 (squash): **89 audit findings remediated** + release-engineering
system + KYC default-ON in prod (PRV16) + SSRF IP-pinning + ledger idempotency (migration 030).
Branch protection is **LIVE** on `main` (1 CODEOWNERS approving review + merge queue).

### Open PRs (auto-merge armed; both need a human CODEOWNERS approval — a bot cannot self-approve or drive the merge queue)
| PR | Branch | Contents | Checks | Auto-merge |
|----|--------|----------|--------|-----------|
| **#611** | `claude/ci-health-green-PWWb9` | shared ts-jest config (119 tests now run), test-harness lint → `tsc --noEmit`, CI stops forwarding jest-only `--coverage --ci` | **build_and_test GREEN**; CodeQL neutral; advisory jobs red (see below) | SQUASH enabled |
| **#609** | `claude/index-sync-vacuum-log-PWWb9` | `.claude/MEMORY.md` record, `docs/CLAUDE.md` required-secrets, `docs/audit/2026-05-26-index-propagation-and-vacuum-log.md`, this handoff | docs-only | (enable on close) |

## Verification facts (local; Node v22 — CI pins Node 20)
- API: `tsc --noEmit` clean; **994 tests / 95 suites** pass (`cd src/api && npx jest`).
- Shared: **119 tests** pass once the new ts-jest config is present (`cd src/shared && npx jest`).
- `turbo run build` 8/8; `turbo run lint` 7/7 (after test-harness fix); Gates 04/06/07 pass.

## Human / operator TODO (I cannot do these — no access/authority here)
1. **Approve + merge #611, then #609** (CODEOWNERS review + merge queue). Auto-merge will fire on approval.
2. **Dismiss the CodeQL SSRF alert** (Security → Code scanning) — real DNS-rebinding vuln is fixed via IP-pinning; remaining alert is a static false-positive. Justification: connection pinned to a pre-validated IP, all A-records validated, redirects disabled, tenant/admin-gated.
3. **Set `ENTERPRISE_SSO_SECRET`** in every environment (Render services + GitHub Environments). Until set, `/auth/enterprise` fail-closes.
4. **`terraform fmt`** in a terraform-equipped env (advisory `terraform_validate` is red; no terraform binary here).
5. **IRF master registry** (`meta-organvm/organvm-corpvs-testamentvm/INST-INDEX-RERUM-FACIENDARUM.md`) — propagate via `organvm irf`. It is OUTSIDE this repo's access scope; was NOT updated. Source material: `docs/audit/2026-05-26-index-propagation-and-vacuum-log.md`.
6. **Build `docs/logos/` tetradic layer** (telos/pragma/praxis/receptio/alchemical-io) — documented VACUUM (Symmetry 0.0). Logged + planned, not built.

## Constraints & gotchas for the next agent
- **Branch protection is live** — never push to `main` directly; never bypass protection to force a merge. Use PR + review + merge queue.
- **Container Node is v22, CI is Node 20** — you CANNOT faithfully reproduce CI locally; verify suspicious failures by pushing and observing CI.
- **GitHub here is MCP-only** (no `gh` CLI, not shell-accessible) — you cannot build a `Monitor` to watch PRs; use the PR-activity subscription for events.
- **No `ScheduleWakeup`/`CronCreate`** in this environment — `/loop` dynamic mode can't set a timer; rely on PR/CI events.
- **No `organvm` CLI** — `organvm irf|session|...` commands are unavailable here.
- **Advisory CI jobs** (`terraform_validate`, `beta_readiness`, `e2e`) are `continue-on-error: true` and pre-existing-red; they need real infra/terraform/browser envs and do NOT block `build_and_test`.
- **Coverage-threshold gating is deferred** — `--coverage` mode currently fails api suite-loading; re-enable in api jest only (not globally) once fixed.
- **Editing `.github/workflows/*` in a PR can trigger GitHub's workflow-run approval gate** (it did on #607; build_and_test then didn't run).
- A linter/process in this repo periodically restores working-tree files on branch switch — stage files explicitly (`git add <path>`), never `git add -A`.

## Do-not / integrity notes
- Closed **no** GitHub issues — none of the 40 open issues is actually resolved by this work (#603 npm-audit vulns are NOT fixed; #555/#556 are phase gates).
- All work is on the remote; local≡remote parity verified; no stashes; nothing lost.
