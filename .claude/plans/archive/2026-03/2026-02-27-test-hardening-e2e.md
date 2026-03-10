# Full Sweep: Test Hardening + E2E + CI/CD Maturation

## Context

Styx is at **PUBLIC_PROCESS** with 467 tests, ~95% real implementation, and a complete core loop. The remaining gaps are: untested compliance/safety modules (legal risk), zero E2E tests, no dependency automation, and no coverage enforcement. This plan closes every gap in one push to position for GRADUATED promotion.

**Estimated new artifacts**: ~13 test files (~175 unit tests) + ~7 E2E specs + 4 CI/infra config files.

---

## Phase 1 — CI Quick Wins (low effort, immediate compound value)

### 1A. Dependabot configuration

**Create** `.github/dependabot.yml`

- npm ecosystem entries for: `/` (root), `/src/api`, `/src/web`, `/src/shared`, `/src/mobile`, `/src/desktop`
- `github-actions` ecosystem entry for `/.github/workflows`
- Weekly Monday schedule across all ecosystems
- Grouped updates: `nestjs` group, `next-react` group, `react-native` group, `security-critical` group (stripe, bcrypt, jsonwebtoken, helmet), `dev-tooling` group (turbo, prettier, eslint, typescript), `aws-sdk` group
- `open-pull-requests-limit: 5` per workspace (3 for smaller ones)
- Labels: `dependencies` + workspace-specific (`api`, `web`, `mobile`, `ci`)

### 1B. Coverage enforcement in CI

**Modify** `.github/workflows/ci.yml` — change test step:
```yaml
run: npx turbo run test -- --coverage --ci
```

**Adjust coverage thresholds** per workspace reality:
- `src/api/jest.config.cjs` — keep 70/60/60/70 (already close)
- `src/shared/jest.config.js` — raise to 85/75/75/85 (pure algorithms, should be near 100%)
- `src/web/jest.config.js` — lower to 40/30/30/40 initially (only 3 test files today; ratchet up as E2E and unit tests land)
- `src/mobile/jest.config.js` — lower to 50/40/40/50 (services tested, screens not)
- `src/desktop/jest.config.js` — lower to 50/40/40/50

**Add** coverage artifact upload step after tests.

### 1C. Terraform validation in CI

**Add job** `terraform_validate` to `.github/workflows/ci.yml`:
- `hashicorp/setup-terraform@v3` with `terraform_version: "~1.9"`
- `terraform fmt -check -recursive -diff`
- `terraform init -backend=false -input=false` (skip R2 credentials)
- `terraform validate`

Working directory: `infra/terraform`

---

## Phase 2 — Compliance & Safety Test Hardening (~175 new tests)

All tests follow the existing pattern: direct class instantiation, mock `Pool`/services via `as unknown as Pool` casts, `jest.clearAllMocks()` in `beforeEach`. Reference: `src/api/src/modules/b2b/b2b.controller.spec.ts`.

### 2A. Compliance module (0 → ~75 tests)

| New test file | Source | Mocks | ~Tests |
|---------------|--------|-------|--------|
| `src/api/src/modules/compliance/identity-verification.service.spec.ts` | `identity-verification.service.ts` | Pool, IdentityProviderService | 25 |
| `src/api/src/modules/compliance/compliance-policy.service.spec.ts` | `compliance-policy.service.ts` | IdentityVerificationService, process.env, Request | 30 |
| `src/api/src/modules/compliance/identity-provider.service.spec.ts` | `identity-provider.service.ts` | MockAdapter, StripeAdapter, process.env | 15 |
| `src/api/src/modules/compliance/compliance.controller.spec.ts` | `compliance.controller.ts` | CompliancePolicyService, IdentityVerificationService | 4 |

Key test cases for `compliance-policy.service`:
- Jurisdiction gating per geofence tier (FULL_ACCESS, RESTRICTED, PROHIBITED)
- KYC enforcement before high-value operations
- Action policy evaluation (CREATE_CONTRACT, SUBMIT_PROOF, WITHDRAW)
- Blocked jurisdiction returns appropriate error

Key test cases for `identity-verification.service`:
- Happy path: initiate verification → submit documents → approve
- Rejection flow with reason codes
- Re-verification after expiry
- Status transitions (PENDING → APPROVED, PENDING → REJECTED)
- Duplicate submission handling

### 2B. Goal ethics service (0 → ~6 tests)

**Create** `src/api/services/intelligence/goal-ethics.service.spec.ts`
- Mock: `jest.mock('./GeminiClient')`, `process.env.GEMINI_API_KEY`
- Test: self-harm detection, eating disorder flag, coercive control screening, RECOVERY oath extra scrutiny, benign goal passthrough, API key missing fallback

### 2C. Beta module (0 → ~22 tests)

**Create** `src/api/src/modules/beta/beta.controller.spec.ts`
- Mock: `process.env` (many feature flags)
- Test: feature flag responses, environment-specific overrides, default values when env vars missing

### 2D. Feed module (0 → ~18 tests)

**Create** `src/api/src/modules/feed/feed.controller.spec.ts`
- Mock: Pool
- Test: feed pagination, filtering by contract type, empty feed, feed item structure

### 2E. Partially-tested module gaps (~50 tests)

| New test file | Source | ~Tests |
|---------------|--------|--------|
| `src/api/src/modules/payments/payment-router.service.spec.ts` | `payment-router.service.ts` | 8 |
| `src/api/src/modules/proofs/proofs.controller.spec.ts` | `proofs.controller.ts` (6 dep mocks: Pool, R2, FuryRouter, TruthLog, PHash, ProofsService) | 14 |
| `src/api/src/modules/b2b/billing.service.spec.ts` | `billing.service.ts` | 8 |
| `src/api/src/modules/b2b/crm.service.spec.ts` | `crm.service.ts` | 7 |
| `src/api/src/modules/b2b/connectors/salesforce.connector.spec.ts` | `salesforce.connector.ts` (mock: global.fetch, process.env) | 8 |
| `src/api/src/modules/b2b/connectors/hubspot.connector.spec.ts` | `hubspot.connector.ts` (mock: global.fetch, process.env) | 10 |

---

## Phase 3 — E2E Testing Infrastructure (Playwright)

### 3A. Setup

**Install** at repo root: `@playwright/test` (devDependency)

**Create** `playwright.config.ts` at repo root:
- `testDir: './e2e'`
- Projects: chromium, firefox, webkit, mobile-chrome
- `webServer`: `next dev` locally, `next start` in CI
- `baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001'`
- Trace on first retry, screenshot/video on failure

**Create** `e2e/fixtures/auth.ts` — shared `authenticatedPage` fixture using Playwright route interception to mock `/api/auth/login`, `/api/users/me`, `/api/auth/csrf`

**Create** `e2e/fixtures/api-mocks.ts` — canonical mock data matching `src/web/services/api-client.ts` types (MOCK_BALANCE, MOCK_CONTRACTS, MOCK_TRANSACTIONS, MOCK_FURY_STATS)

**Add** to root `package.json` scripts: `"test:e2e"`, `"test:e2e:ui"`, `"test:e2e:headed"`

**Add** to `Makefile`: `test-e2e` and `test-e2e-ui` targets

### 3B. Critical path E2E specs (Tier 1 — money path)

| Spec file | Flow |
|-----------|------|
| `e2e/auth.spec.ts` | Register, login, validation errors, redirect to dashboard |
| `e2e/contract-lifecycle.spec.ts` | Create contract → submit proof → verdict → settlement |
| `e2e/fury-workbench.spec.ts` | SSE status, incoming assignment, PASS/FAIL verdicts, honeypot feedback |
| `e2e/wallet.spec.ts` | Balance display, tier indicator, transaction history |

### 3C. Navigation & guard specs (Tier 2)

| Spec file | Flow |
|-----------|------|
| `e2e/auth-guards.spec.ts` | Unauthenticated redirects, admin-only routes |
| `e2e/dashboard.spec.ts` | Integrity card, capital-at-risk, leaderboard, onboarding wizard |
| `e2e/recovery-contracts.spec.ts` | RECOVERY oath flow: partner email, safety acknowledgments, duration cap |

### 3D. API mocking strategy

**Playwright route interception** (not MSW). Rationale:
- Web uses `fetch()` via `api-client.ts` with Next.js proxy rewrites → Playwright `page.route()` catches these cleanly
- Per-test control for error states (500s, timeouts, auth failures)
- No production-code changes needed (MSW would require service worker registration)

For SSE streams (Fury `/api/fury/stream`): mock via `page.route()` returning `text/event-stream`, or mock the Zustand store via `page.evaluate()`.

### 3E. CI integration

**Add job** `e2e` to `.github/workflows/ci.yml`:
- `needs: build_and_test`
- Matrix: `[chromium, firefox]`
- Steps: checkout → Node 20 → `npm ci` → install Playwright browsers → build web → run E2E → upload report artifact
- `webServer` in Playwright config handles `next start` in CI

---

## Phase 4 — Deploy Pipeline Hardening

### 4A. Database migrations in deploy workflow

**Modify** `.github/workflows/deploy.yml` — add `migrate` job:
- `needs: deploy_api` (new code with migration files must be deployed first)
- Runs `cd src/api && npm run migrate` with `DATABASE_URL` from environment secrets
- `timeout-minutes: 5`
- `smoke_test.needs` updated to include `migrate`

**Same pattern** for `staging-promotion.yml` (with `STAGING_DATABASE_URL`) and `beta-promotion.yml` (with `BETA_DATABASE_URL`).

**Required GitHub secrets** (per environment): `DATABASE_URL`, `STAGING_DATABASE_URL`, `BETA_DATABASE_URL`

Safety: `migrate.ts` wraps each migration in BEGIN/COMMIT/ROLLBACK. Idempotent via `schema_migrations` table.

---

## Execution Order

| Step | Phase | Depends on | Effort |
|------|-------|-----------|--------|
| 1 | 1A: Dependabot config | — | 1 file |
| 2 | 1B: Coverage enforcement | — | CI edit + 5 jest config edits |
| 3 | 1C: Terraform validation | — | CI edit |
| 4 | 2A: Compliance tests | — | 4 test files |
| 5 | 2B-2E: Safety + gap tests | — | 9 test files |
| 6 | 3A: Playwright setup | — | config + fixtures |
| 7 | 3B-3C: E2E specs | 3A | 7 spec files |
| 8 | 3E: E2E CI job | 3A | CI edit |
| 9 | 4A: Deploy migrations | — | 3 workflow edits |

Steps 1-3 are independent quick wins. Steps 4-5 are independent of 6-8. Step 9 is independent of everything.

**Recommended commits**:
1. `feat(ci): add Dependabot, coverage gates, and Terraform validation`
2. `test(api): add compliance, goal-ethics, beta, feed, and gap coverage`
3. `test(e2e): add Playwright infrastructure and critical path specs`
4. `feat(ci): wire database migrations into deploy pipeline`

---

## Verification

```bash
# Phase 1: CI changes
npx turbo run test -- --coverage --ci    # all workspaces pass with adjusted thresholds
cd infra/terraform && terraform fmt -check && terraform validate

# Phase 2: New unit tests
cd src/api && npx jest --testPathPattern="compliance|goal-ethics|beta|feed|payment-router|proofs.controller|billing.service|crm|salesforce|hubspot"
npx turbo run test   # total should be ~640+ tests (467 + ~175)

# Phase 3: E2E
npx playwright test --project=chromium   # all specs pass
npx playwright test --project=firefox

# Phase 4: Deploy migrations (verify locally)
cd src/api && npm run migrate            # idempotent, no new migrations = no-op

# Full monorepo
make test && make build
```
