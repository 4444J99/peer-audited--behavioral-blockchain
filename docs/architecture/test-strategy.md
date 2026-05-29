---
generated: true
department: ENG
artifact_id: E4
governing_sop: "SOP--testing-standards.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Test Strategy

Styx employs a four-tier testing strategy designed to catch regressions across financial, behavioral, and peer-audit domains before any code reaches production. Because Styx handles real money in FBO escrow and makes irrevocable ledger entries, the bar for test confidence is higher than a typical SaaS product.

## 1. Testing Tiers

### 1.1 Unit Tests (Jest + ts-jest)

Unit tests run in the workspaces of the Turborepo monorepo. Most use Jest + ts-jest; `ask-styx` and `test-harness` use **Vitest**. Each workspace owns its test config.

| Workspace | Runner | Naming Convention |
|-----------|--------|-------------------|
| `src/api` | Jest (`src/api/jest.config.cjs`) | `*.spec.ts` |
| `src/web` | Jest | `*.test.ts` / `*.test.tsx` |
| `src/mobile` | Jest | `*.spec.ts` |
| `src/shared` | Jest | `*.spec.ts` |
| `src/desktop` | Jest | `*.spec.ts` |
| `src/ask-styx` | **Vitest** (`vitest run`) | `*.test.ts` |
| `src/test-harness` | **Vitest** | `*.test.ts` |

(`src/pitch` has no tests. Workspace globs: `src/*` and `packages/*`; `packages/` is currently empty.)

**Naming conventions:**
- `*.spec.ts` for API service/module tests and shared library tests (NestJS convention)
- `*.test.ts` for web and mobile component/hook tests (React convention)
- Test files co-locate next to source: `contracts.service.ts` pairs with `contracts.service.spec.ts`

**API coverage thresholds** (configured in `src/api/jest.config.cjs`):

```
lines: 70%
branches: 60%
functions: 60%
statements: 70%
```

**Coverage-threshold gating is not currently enforced in CI.** `ci.yml` runs `turbo run test` without `--coverage --ci` (those flags break the Vitest workspaces and the API suite-loading — see `docs/audit/2026-05-26-index-propagation-and-vacuum-log.md`), so the numbers above are targets, not a hard gate. Re-introducing coverage gating is a tracked follow-up.

### 1.2 Integration Tests

Integration tests verify cross-service behavior with mocked external dependencies:

- **Database:** Tests use a dedicated PostgreSQL test database (`styx_test`) provisioned by `docker-compose.test.yml`. Migrations run before each suite; truncation between tests.
- **Stripe:** Mocked via `stripe-mock` container. Webhook signature verification uses a test signing secret.
- **Redis/BullMQ:** A dedicated Redis instance (`redis:7-alpine`) with `flushall` between suites.
- **External APIs:** Gemini and Groq calls are mocked at the HTTP layer using `nock`.

Key integration test suites:
- `contracts.integration.spec.ts` -- full contract lifecycle (create, fund, verify, settle)
- `ledger.integration.spec.ts` -- double-entry transaction integrity under concurrent writes
- `fury.integration.spec.ts` -- auditor assignment, proof review, consensus
- `escrow.integration.spec.ts` -- Stripe FBO fund/release/refund flows

### 1.3 End-to-End Tests (Playwright)

Playwright defines four browser projects in `.config/playwright/playwright.config.ts`; the CI `e2e` matrix runs **chromium** and **firefox** (webkit and mobile-chrome are available for local runs):

| Target | Config Key | Viewport |
|--------|-----------|----------|
| Chromium | `chromium` | 1280x720 |
| Firefox | `firefox` | 1280x720 |
| WebKit | `webkit` | 1280x720 |
| Mobile Chrome | `mobile-chrome` | 375x667 |

**Core E2E scenarios:**
1. User registration and onboarding flow
2. Contract creation with stake deposit (Stripe test mode)
3. Proof photo submission and Fury audit assignment
4. Contract completion and escrow release
5. Recovery contract creation with no-contact targets
6. B2B practitioner dashboard and client contract assignment
7. Fury auditor workbench -- accept assignment, review proof, cast verdict
8. Integrity score changes after contract completion/failure

E2E runs in CI via the `e2e` job in `ci.yml` (chromium + firefox) — it builds `src/web` and serves it on `:3001` before running the suite. Local runs use `npm run test:e2e` (which passes `--config=.config/playwright/playwright.config.ts`); add `--project=chromium` to limit to one browser.

### 1.4 Validation Gates

Nine validation scripts live in `scripts/validation/`, each returning exit code 0 (pass), 1 (fail), or 2 (skip / not-applicable in this context). Gates **04–07** run in the main CI job (`build_and_test_matrix`). The beta-readiness suite (`scripts/smoke/beta-readiness.sh`) additionally runs **01** and **05** (and re-runs 04/06/07); gates **02, 03, 08, and 09** are standalone checks not currently wired into CI.

| Gate | Script | Purpose |
|------|--------|---------|
| Phantom Money | `01-phantom-money-check.ts` | Verifies the double-entry ledger prevents unbalanced entries (debits = credits). |
| Simulator Spoof | `02-simulator-spoof-check.ts` | Ensures hardware oracles reject manually-injected / simulated sensor data. |
| Full Loop | `03-the-full-loop.ts` | End-to-end contract-lifecycle integration check. |
| Redacted Build | `04-redacted-build-check.sh` | No gambling/Stygian terminology in the production build (paired with `scripts/gatekeeper-scan.sh`). |
| Behavioral Physics | `05-behavioral-physics-check.ts` | Core behavioral constants match spec (needs `CI_GATE05_API_URL` for the live check; skips cleanly otherwise). |
| Security Invariant | `06-security-invariant-check.ts` | No hardcoded secrets or debug backdoors in compiled output (skips when no build output is present). |
| Claim Drift | `07-claim-drift-check.js` | File paths referenced in `docs/planning/implementation-status.md` still exist (`npm run validate:claims`). |
| Fury Crucible | `08-fury-crucible-simulation.ts` | Fury auditor-matching simulation: no self-audit, conflict avoidance, round-robin fairness. |
| Realm Sync | `09-realm-sync-check.ts` | Dual-source-of-truth: the `REALM_REGISTRY` TS constant and the `realms` DB table agree on IDs and stream-prefix mappings. |

Gates 04–07 run after unit/integration tests in CI; a required-gate failure fails the `build_and_test` check.

## 2. Turbo Pipeline Dependencies

The Turborepo build pipeline enforces workspace dependency ordering:

```
@styx/shared (build) --> @styx/api (build + test)
@styx/shared (build) --> @styx/web (build + test)
@styx/shared (build) --> @styx/mobile (build + test)
```

`@styx/shared` must build first because it exports:
- TypeScript types (contract shapes, API response types, event enums)
- Validation schemas (Zod schemas for contract creation, proof submission)
- Constants (integrity score formula, Aegis thresholds, grace day limits)
- Utility functions (currency formatting, date math, integrity calculation)

The `turbo.json` pipeline configuration:

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] },
    "test:integration": { "dependsOn": ["build"] },
    "test:e2e": { "dependsOn": ["build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

## 3. Smoke and Readiness Scripts

Located in `scripts/smoke/`:

| Script | Purpose | When Used |
|--------|---------|-----------|
| `beta-readiness.sh` | Comprehensive beta-readiness suite (`npm run beta:readiness`): runs the local validation gates + remote-target probes, emits `artifacts/beta-readiness-summary.json`. | Before any beta promotion. |
| `beta-deploy-preflight.sh` | Pre-deploy gate (`npm run beta:deploy-preflight`). | Immediately before a beta deploy. |
| `beta-smoke.sh` / `staging-smoke.sh` | Environment-specific post-deploy smoke runs. | After a beta / staging deploy. |
| `check-endpoints.sh` | Hits public API endpoints with health/readiness probes (status, content-type, CORS). | Post-deploy verification. |
| `check-api-ready.sh` / `check-api-release.sh` / `check-web.sh` | Individual API-readiness, release-metadata, and web-availability checks. | Targeted post-deploy checks. |
| `vanguard-ignition.sh` | Vanguard deployment ignition. | Vanguard rollout. |

## 4. CI Integration

The `ci.yml` GitHub Actions workflow orchestrates the full test pipeline:

```
1. Checkout + install (npm ci, Node 20)
2. Security audit (advisory, --audit-level=high)
3. Test (turbo run test, all workspaces)
4. Build (turbo run build)
5. Lint (turbo run lint)
6. Validation Gates 04–07 (redacted-build, behavioral-physics, security-invariant, claim-drift)
7. beta_readiness suite (advisory) + terraform_validate (advisory)
8. Playwright E2E — chromium + firefox (matrix)
```

Additional CI workflows:
- `deploy.yml` -- runs E2E against staging after successful deploy
- `beta-promotion.yml` -- runs `beta-readiness.sh` as a promotion gate
- `staging-promotion.yml` -- full gate suite + manual approval step

## 5. Test Data Management

> **Note:** this section describes the *intended* shared test-data layer under `src/shared/`. The `src/shared/test/` directory is not yet present in the tree — treat the files below as target design, not current state.

**Fixtures** (target: `src/shared/test/fixtures/`):
- `contracts.fixture.ts` -- sample contracts across all 7 oath categories
- `users.fixture.ts` -- users at different integrity score tiers
- `ledger.fixture.ts` -- balanced double-entry transaction sets
- `fury.fixture.ts` -- auditor profiles with varying reputation scores

**Factory functions** (target: `src/shared/test/factories/`):
- `createContract()` -- generates a valid contract with randomized but legal parameters
- `createUser()` -- generates a user with configurable integrity score
- `createAudit()` -- generates a Fury audit with configurable verdict distribution

**Database seeding** for integration tests uses raw SQL transactions against the `pg` pool (the project uses node-postgres + `src/api/database/schema.sql`, not an ORM) for atomic setup/teardown.

## 6. Known Test Gaps

| Gap | Severity | Tracking |
|-----|----------|----------|
| No HealthKit/Google Fit integration tests (stubs only) | Low (feature not yet built) | Backlog |
| Desktop (Tauri) E2E not yet in CI | Medium | Planned for post-beta |
| Load testing not yet automated in CI | High | See `docs/architecture/load-test-report.md` |
| No chaos engineering for Redis/PostgreSQL failover | Medium | Post-launch |
| Mobile E2E limited to Chrome viewport emulation (no real device) | Medium | Planned Expo EAS build integration |

## 7. Testing Principles

1. **Financial correctness over speed.** Every test involving money must assert ledger balance invariants. A fast test that misses a penny is worse than a slow test that catches it.
2. **Fury consensus is non-negotiable.** No test may bypass the consensus rule: **3 assigned auditors, 2-of-3 or 3-of-3 agreement** (per [ADR-004](../adr/adr--004-fury-consensus-engine.md) — a 3-way split escalates to the senior pool; there is no $1000 threshold). If a test needs a quick pass, it must simulate 2 of 3 agreeing auditors.
3. **Aegis is a safety system.** Tests for biological oaths must always verify BMI floor and velocity cap enforcement. Skipping Aegis checks in tests is a blocking code review finding.
4. **Recovery contracts are sensitive.** Tests involving no-contact targets must verify guardrails (max 30 days, max 3 targets, cooldown enforcement).
5. **The linguistic cloaker is testable.** Verify that user-facing strings use the approved vocabulary (vault, not bet; oath, not wager) in all test assertions.
