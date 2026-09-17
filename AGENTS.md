<!-- ORGANVM:AUTO:START -->

## Agent Context (auto-generated — do not edit)

This repo participates in the **ORGAN-III (Commerce)** swarm.

### Active Subscriptions

- Event: `theory.updated` → Action: Review theory changes for product implications
- Event: `governance.updated` → Action: Check compliance with updated governance rules
- Event: `community.event_created` → Action: Community event registered for this product
- Event: `distribution.dispatched` → Action: Announcement distributed via POSSE pipeline

### Production Responsibilities

- **Produce** `product` for unspecified
- **Produce** `community_signal` for organvm-vi-koinonia/community-hub
- **Produce** `distribution_signal` for organvm-vii-kerygma/kerygma-pipeline
- **Produce** `essay_material` for organvm-v-logos/essay-pipeline

### External Dependencies

- **Consume** `theory` from [`organvm-i-theoria/styx-behavioral-economics-theory`](../../organvm-i-theoria/styx-behavioral-economics-theory/CLAUDE.md)
- **Consume** `creative-artifact` from [`organvm-ii-poiesis/styx-behavioral-art`](../../organvm-ii-poiesis/styx-behavioral-art/CLAUDE.md)
- **Consume** `governance-rules` from [`organvm-iv-taxis/orchestration-start-here`](../../organvm-iv-taxis/orchestration-start-here/CLAUDE.md)

### Governance Constraints

- Adhere to unidirectional flow: I→II→III
- Never commit secrets or credentials

_Last synced: 2026-06-07T14:00:33Z_
<!-- ORGANVM:AUTO:END -->

## Session Review Protocol

At the end of each session that produces or modifies files:

1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):

- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only

## Repo Facts

### Monorepo Structure

Turborepo + npm workspaces. Package scope: `@styx/*`. Root `tsconfig.json` maps `@styx/shared/*` → `src/shared/*`. Workspaces span both `src/*` and `packages/*`.

| Workspace                  | Stack                          | Entry                                     | Notes                                                          |
| -------------------------- | ------------------------------ | ----------------------------------------- | -------------------------------------------------------------- |
| `src/api`                  | NestJS 11, BullMQ, Stripe, pg  | `nest-cli.json` entryFile: `api/src/main` | Double-entry ledger, Fury router, escrow                       |
| `src/web`                  | Next.js 16, React 18, Tailwind | `STYX_WEB_PUBLIC_URL` / `STYX_WEB_PORT`   | Dashboard, Fury workbench                                      |
| `src/mobile`               | React Native 0.81, Expo 54     | `expo run:ios` / `expo run:android`       | Sensor bridge, camera, biometrics                              |
| `src/desktop`              | Tauri 2, Vite, React           | `src-tauri/tauri.conf.json`               | "The Judge" admin dashboard                                    |
| `src/shared`               | TypeScript                     | `dist/index.js`                           | Constants, types, algorithms — **must build before others**    |
| `src/pitch`                | Vite, React, p5.js             | interactive pitch deck                    | Build outputs to `docs/`, not `dist/`                          |
| `src/ask-styx`             | Cloudflare Worker (wrangler)   | `worker/index.ts`                         | LLM proxy for Ask Styx UI                                      |
| `src/test-harness`         | Vitest, Commander CLI          | `bin/ergon-test`                          | Validation & simulation suite                                  |
| `packages/styx-cli`        | TypeScript, Vitest             | `dist/cli.js`                             | Audience Growth Engine CLI; depends on `@styx/audience-engine` |
| `packages/audit-engine`    | TypeScript, Vitest             | `dist/index.js`                           | Peer-audited behavioral verification                           |
| `packages/audience-engine` | TypeScript, Vitest             | `dist/index.js`                           | Parameterized content plan generator                           |

### Setup & Dev Commands

```bash
# Prerequisites: Node.js 24+ (CI and beta readiness use 24.x), Docker, npm 10+
cp .env.example .env                    # fill runtime URLs, ports, DB, Redis, secrets
make docker-up                          # Docker Compose uses .env / STYX_DOCKER_* values
make install                            # npm install (all workspaces)
npm run dev:migrate                     # DB migrations (required before API works)
make dev                                # env-backed API + Web app stack
```

### Verification Commands

```bash
make test                               # All unit/integration tests via turbo
cd src/api && npx jest                  # API tests only (jest --coverage --forceExit)
cd src/web && npx jest                  # Web tests only (jest --coverage)
cd src/mobile && npx jest               # Mobile tests only (jest --coverage)
cd src/desktop && npx jest              # Desktop tests only (jest --coverage)
cd src/test-harness && npx vitest run   # Test-harness uses Vitest, not Jest
cd src/ask-styx && npx vitest run       # Ask Styx uses Vitest
cd packages/audit-engine && npx vitest run
cd packages/styx-cli && npx vitest run
cd packages/audience-engine && npx vitest run
npx jest --testNamePattern="pattern"    # Single test by name pattern (from src/api)

make test-e2e                           # Playwright (chromium + firefox)
make test-e2e-ui                        # Playwright interactive UI

npx turbo run lint                      # TypeScript strict check (tsc --noEmit per workspace)
npm run format                          # Prettier: **/*.{ts,tsx,md}
```

### turbo.json Task Dependencies

- `test` dependsOn `^build` — upstream packages must be built before downstream tests
- `@styx/web#lint` dependsOn `build`
- `@styx/styx-cli#lint` dependsOn `^build`
- `@styx/audience-engine#test` dependsOn `^build`
- `@styx/styx-cli#test` dependsOn `^build`
- `dev` has `cache: false, persistent: true`
- `@styx/mobile#build` has empty outputs
- `@styx/pitch#build` outputs to `../../docs/index.html` and `../../docs/assets/**`
- `build:pitch` has no dependencies (can run standalone)

**Consequence**: `@styx/shared` must be built before any workspace that imports from it can build or test. `turbo run test` handles this transitively.

### CI Pipeline Order (`.github/workflows/ci.yml`)

The CI uses a **job dependency graph**, not just a linear list. Branch protection targets the `e2e` summary job.

**Blocking jobs** (must pass for merge):

| Job                     | Node | Depends on                                                 | Purpose                                                                                     |
| ----------------------- | ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `build_and_test_matrix` | 24   | —                                                          | Test, build, lint, Gates 04–08, load-test syntax                                            |
| `beta_readiness`        | 24.x | `build_and_test_matrix`                                    | Beta readiness contract                                                                     |
| `changed-files`         | —    | —                                                          | Checks if web files changed (`src/web/`, `e2e/`, `src/shared/`, `.config/playwright/`)      |
| `e2e_browsers`          | 24   | `build_and_test_matrix`, `beta_readiness`, `changed-files` | Playwright chromium+firefox; **web-gated** (skips if no web changes)                        |
| `build_and_test`        | —    | `build_and_test_matrix`, `beta_readiness`                  | Summary gate; `if: always()` — never SKIPPED                                                |
| `e2e`                   | —    | `changed-files`, `e2e_browsers`                            | Summary gate; `if: always()` — never SKIPPED                                                |
| `terraform_validate`    | —    | —                                                          | Standalone `terraform fmt -check` + `validate`                                              |
| `deploy.yml`            | —    | `beta_readiness`                                           | Production deploy; has its own **Gate 08b compliance artifact check** against production DB |

**Within `build_and_test_matrix`** (linear steps):

1. `npm ci` + `npm audit --audit-level=high`
2. `turbo run test` — **no** `--coverage --ci`; retries up to 3 times for flaky exits
3. `npx turbo run build`
4. `npx turbo run lint`
5. Gate 04: redacted build check
6. Gate 05: behavioral physics check (requires `CI_GATE05_API_URL`; skipped if unset)
7. Gate 06: security invariant check (exit 2 is advisory)
8. Gate 07: claim drift check (`npm run validate:claims`)
9. Gate 08: Fury Crucible Simulation (`npx tsx scripts/validation/08-fury-crucible-simulation.ts`)
10. Gate 08b: Compliance Artifact Check (requires `CI_GATE08_DATABASE_URL`; skips if unset)
11. Load-test syntax check (`node --check` on load-test scripts; execution is deployment-gated)

**Key notes**:

- Coverage is enforced per-workspace via `jest --coverage` in each workspace's own `test` script
- The `e2e_browsers` job builds `src/web` and runs Playwright with `E2E_BASE_URL: http://127.0.0.1:3001`
- CodeQL runs in a dedicated `codeql.yml` workflow, not `ci.yml`

### Deployment

- **Production**: triggered by `v*` tag or `workflow_dispatch` on `main`
- Deploys API + Web to **Render** (Oregon region) via `render.yaml` blueprint
- Migrations run **after** API deploy, **before** smoke tests
- Smoke test includes best-effort redeploy fallback on API readiness failure (not true rollback)
- **Ask Styx**: deploys to GitHub Pages on push to `src/ask-styx/**`; worker uses Cloudflare Wrangler
- Staging/beta promotion workflows gate production deploy
- `bash scripts/deploy.sh local` — one-command local stack (API + Web + PostgreSQL + Redis via Docker Compose)
- `bash scripts/deploy.sh render` — production deploy to Render
- `bash scripts/deploy.sh down` — stop local stack
- `deploy.yml` runs staging/beta promotion gates (`staging_promotion_gate`, `beta_promotion_gate`), a preflight check, a **Gate 08b compliance artifact check** against the production DB, then `deploy_api`

### Key Conventions & Gotchas

- **Lint = `tsc --noEmit`** — no ESLint config at workspace level. TypeScript strict mode is the lint.
- **`turbo.json`**: `test` dependsOn `^build` — you cannot run tests without building first via turbo.
- **Linguistic Cloaker**: production builds swap gambling terms (stake→commitment, bet→vault). Gate 04 validates this. Run `bash scripts/validation/04-redacted-build-check.sh` locally to check.
- **`@styx/shared`** must be built before any workspace that imports from it can build or test.
- **Playwright** auto-starts the web server unless `CI=true`, then uses `npm run start`. Base URL comes from the Playwright config/env. The config at `.config/playwright/playwright.config.ts` anchors to `process.cwd()` (repo root) and requires `E2E_BASE_URL`, `STYX_WEB_PUBLIC_URL`, or `NEXT_PUBLIC_WEB_URL` — no silent fallback. Default port is 3001.
- **EditorConfig**: 2-space indent for TS/TSX, LF line endings, final newline required.
- **Mobile `build` and `lint` are both `tsc --noEmit`** — no actual bundle build. Native builds use `expo run:*`.
- **Pitch build outputs to `docs/`** (see `turbo.json` `@styx/pitch#build` outputs) — not `dist/`.
- **Environment**: copy `.env.example` → `.env`. `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS` defaults to `false` in `.env.example` (fail-closed in beta); set to `true` for local dev without geo headers. Note: `.config/docker/compose.defaults.env` sets it to `true` for Docker Compose — the `.env` file you copy wins.
- **`STYX_TEST_MONEY_MODE`**: `true` (default) uses internal ledger escrow (no real money); `false` uses Stripe FBO. The rail determines test vs real money, not the Stripe key prefix.
- **API env loading order** (in `src/api/src/config/env-path.ts`): repo `.env.local`, repo `.env`, `src/api/.env.local`, then `src/api/.env`.
- **`JWT_SECRET` and `STYX_API_KEY_PEPPER`** must be 32+ byte random secrets. Generate with `openssl rand -base64 48`. Never reuse `JWT_SECRET` as `STYX_API_KEY_PEPPER`.
- **Load-test scripts** (`scripts/load-test/`) are syntax-checked in CI but require `K6_API_BASE_URL` and a live target with `k6` binary — execution is deployment-gated, not run in PR CI.

### Validation Gates (local)

```bash
npx tsx scripts/validation/01-phantom-money-check.ts      # Ledger balance integrity
npx tsx scripts/validation/02-simulator-spoof-check.ts     # Oracle spoof detection
npx tsx scripts/validation/03-the-full-loop.ts             # End-to-end contract lifecycle
bash scripts/validation/04-redacted-build-check.sh         # Production vocabulary sweep
npx tsx scripts/validation/05-behavioral-physics-check.ts  # Algorithm constant validation
node scripts/validation/07-claim-drift-check.js            # Claim drift
npx tsx scripts/validation/08-fury-crucible-simulation.ts  # Fury Crucible simulation
bash scripts/validation/08-compliance-artifact-check.sh    # Compliance artifact check (needs DB)
```

### Beta Readiness

```bash
BETA_API_URL=https://api-beta.example.com npm run beta:readiness
```

Writes `artifacts/beta-readiness-summary.json`. Full policy: `docs/planning/planning--beta-readiness-contract.md`.

---

## Issue Processing Protocol (MANDATORY)

Every issue in this repo is tracked in `docs/triage.json`. Before closing ANY issue:

1. **Declare batch:** `scripts/triage/batch-init.sh <batch-id> <phase> <issues...>`
2. **For each issue:** verify code exists on disk OR build it. Record state via `scripts/triage/state-transition.sh <num> <to-state> [--evidence <file:line>] [--pr <url>]`
3. **Reconcile:** `scripts/triage/reconcile.sh <batch-id>` — DO NOT PROCEED IF IT FAILS
4. **Test:** `make test` (or workspace-specific test) — DO NOT PROCEED IF IT FAILS
5. **Complete batch:** mark `test_passed: true` in triage.json, append to `docs/triage/pattern-log.md`
6. **Commit:** triage.json + code changes together in one atomic commit
7. **Report:** `scripts/triage/report.sh` — verify dashboard is clean, 0 orphans

**NEVER:**

- Close an issue without recording evidence in triage.json
- Batch-close >20 issues without reconciliation
- Skip `reconcile.sh` — it is the mechanical gate that rejects CLOSED without evidence
- Leave an issue in UNREAD state after its batch is marked complete
- Close non-code issues (TRACKING/WAITING/FUTURE) — they represent real work, not dead backlog

**State machine:**

```
UNREAD → INSPECTED → CLOSED (evidence required)
                   → BUILD_STARTED → BUILD_DONE → TESTED → PR_CREATED → PR_MERGED → CLOSED
                   → TRACKING (non-code, stays open)
                   → WAITING (blocked, stays open)
                   → FUTURE (post-beta, stays open)
                   → BUG (defect, stays open until fixed)
                   → SUPERSEDED (overtaken by newer tracking issue)
WAITING → SUPERSEDED
FUTURE → SUPERSEDED
TRACKING → SUPERSEDED
```

See `docs/triage/pattern-log.md` for per-batch learnings. See `scripts/triage/` for tooling.

---

## Multi-Agent Operating System & Standing Branch Habitat

All autonomous and remote agents must adhere to the 5-lane branch constitution in `BRANCHES.md` and the full operating procedures in `docs/operations/agent-operations-manual.md`.

### Agent Quick Start

1. **Query Owning Lane**: Check `docs/triage/issue-ownership.json` to find which standing lane owns your issue.
2. **Cut Worktree**:
   ```bash
   scripts/lanes/cut-worktree.sh <issue-number> [short-intent]
   ```
3. **Claim Issue**:
   ```bash
   scripts/lanes/claim-issue.sh <issue-number> [agent-id]
   ```
4. **Pre-PR Verification**:
   ```bash
   bash scripts/lanes/verify-agent-pr.sh
   ```
5. **PR & Receipt**: Submit PR targeting the owning standing lane (`lane/verify`, `lane/heal`, `lane/expand-product`, `lane/expand-external`, or `lane/evolve-platform`). Include completed `docs/evidence/templates/live-loop-receipt.md`.

### Branch Naming Convention

Pattern: `work/<lane-slug>/<issue-number>-<short-intent>` (or `fix/`, `feat/`, `chore/`). Never commit directly to standing lanes or trunk.
