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

Unit tests run in every workspace of the Turborepo monorepo. Each package maintains its own Jest configuration inheriting from a root `jest.config.base.ts`.

| Workspace | Config | Naming Convention | Current Count |
|-----------|--------|-------------------|---------------|
| `apps/api` | `jest.config.ts` | `*.spec.ts` | ~280 |
| `apps/web` | `jest.config.ts` | `*.test.ts` | ~90 |
| `apps/mobile` | `jest.config.ts` | `*.test.ts` | ~40 |
| `packages/shared` | `jest.config.ts` | `*.spec.ts` | ~89 |

**Naming conventions:**
- `*.spec.ts` for API service/module tests and shared library tests (NestJS convention)
- `*.test.ts` for web and mobile component/hook tests (React convention)
- Test files co-locate next to source: `contracts.service.ts` pairs with `contracts.service.spec.ts`

**Coverage thresholds** (enforced in CI):

```
lines: 70%
branches: 60%
functions: 60%
statements: 70%
```

These thresholds are configured per-workspace in each `jest.config.ts` and enforced by the `ci.yml` GitHub Actions workflow. A single workspace dropping below threshold fails the entire pipeline.

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

Playwright tests cover critical user journeys across four browser targets:

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

E2E tests run in CI on the `deploy.yml` workflow against the staging environment. Local runs use `npx playwright test` with `--project=chromium` for speed.

### 1.4 Validation Gates

Eight custom validation gates run as part of CI. Each gate is a standalone script in `scripts/gates/` that returns exit code 0 (pass) or 1 (fail).

| Gate | ID | Purpose |
|------|----|---------|
| Phantom Money | `01-phantom-money` | Verifies double-entry ledger balance invariant: sum of all debits equals sum of all credits. Catches off-by-one errors in escrow settlement. |
| Orphan Contracts | `02-orphan-contracts` | Ensures every contract has a valid user, a funded vault entry, and at least one scheduled verification window. |
| Fury Quorum | `03-fury-quorum` | Validates that audit consensus requires 3-of-5 agreement and that no single auditor can unilaterally pass/fail a contract. |
| Aegis Floor | `04-aegis-floor` | Confirms BMI floor (18.5) enforcement in biological oath creation. Rejects contracts that could incentivize dangerous weight loss. |
| Velocity Cap | `05-velocity-cap` | Validates the 2% weekly loss velocity cap is enforced on all biological oaths. |
| Escrow Integrity | `06-escrow-integrity` | Cross-references Stripe FBO balance against internal ledger totals. Flags any discrepancy > $0.01. |
| Recovery Guardrails | `07-recovery-guardrails` | Verifies recovery contracts enforce max 30-day duration, max 3 no-contact targets, and mandatory cooldown periods. |
| Fury Crucible | `08-fury-crucible` | Stress test for the auditor matching algorithm: ensures no auditor is assigned to audit their own contract, no geographic/social-graph conflicts, and round-robin fairness within 10% deviation. |

Gates run sequentially after unit and integration tests pass. A gate failure blocks deployment.

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

Located in `scripts/`:

| Script | Purpose | When Used |
|--------|---------|-----------|
| `beta-readiness.sh` | Runs all 8 gates + coverage check + Playwright smoke suite. Outputs a pass/fail report with gate-by-gate status. | Before any beta promotion. |
| `check-endpoints.sh` | Hits all public API endpoints with health/readiness probes. Verifies 200 responses, correct content-types, and CORS headers. | Post-deploy verification. |
| `smoke-stripe.sh` | Creates a test customer, initiates a $1 charge, verifies webhook receipt, refunds. End-to-end Stripe FBO smoke test. | After Stripe config changes. |
| `smoke-fury.sh` | Creates a contract, submits mock proof, triggers Fury assignment, verifies audit flow completes. | After Fury algorithm changes. |
| `seed-test-db.sh` | Populates test database with fixture data: 10 users, 5 active contracts, 3 Fury auditors, sample ledger entries. | Local development setup. |

## 4. CI Integration

The `ci.yml` GitHub Actions workflow orchestrates the full test pipeline:

```
1. Checkout + install (pnpm)
2. Typecheck (tsc --noEmit across all workspaces)
3. Lint (ESLint across all workspaces)
4. Build @styx/shared
5. Unit tests (all workspaces, --coverage)
6. Coverage threshold check
7. Integration tests (docker-compose.test.yml up)
8. Validation gates (01 through 08, sequential)
9. Playwright E2E (4 browsers)
10. Gate summary artifact upload
```

Additional CI workflows:
- `deploy.yml` -- runs E2E against staging after successful deploy
- `beta-promotion.yml` -- runs `beta-readiness.sh` as a promotion gate
- `staging-promotion.yml` -- full gate suite + manual approval step

## 5. Test Data Management

**Fixtures** live in `packages/shared/test/fixtures/`:
- `contracts.fixture.ts` -- sample contracts across all 7 oath categories
- `users.fixture.ts` -- users at different integrity score tiers
- `ledger.fixture.ts` -- balanced double-entry transaction sets
- `fury.fixture.ts` -- auditor profiles with varying reputation scores

**Factory functions** in `packages/shared/test/factories/`:
- `createContract()` -- generates a valid contract with randomized but legal parameters
- `createUser()` -- generates a user with configurable integrity score
- `createAudit()` -- generates a Fury audit with configurable verdict distribution

**Database seeding** for integration tests uses Prisma's `$transaction` API to ensure atomic setup/teardown.

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
2. **Fury consensus is non-negotiable.** No test may bypass the 3-of-5 quorum requirement. If a test needs a quick pass, it must simulate 3 agreeing auditors.
3. **Aegis is a safety system.** Tests for biological oaths must always verify BMI floor and velocity cap enforcement. Skipping Aegis checks in tests is a blocking code review finding.
4. **Recovery contracts are sensitive.** Tests involving no-contact targets must verify guardrails (max 30 days, max 3 targets, cooldown enforcement).
5. **The linguistic cloaker is testable.** Verify that user-facing strings use the approved vocabulary (vault, not bet; oath, not wager) in all test assertions.
