# Styx Sprint 2: Glorious Colossal Momentous Forward Propulsion

## Context

Sprint 1 closed the compliance/platform hardening gap (age gate, attestation API, ToS/Privacy, Sentry, error states). We're now at ~65% overall, ~70-75% for Phase 1 scope.

**What remains between here and 200-person Phase 1 private beta:**
- Mobile has no attestation screen (the primary daily journey)
- Mobile registration doesn't enforce age gate / terms acceptance
- Seed data has no recovery contracts (testers start with empty/wrong demo data)
- Attestation endpoints have zero test coverage
- `implementation-status.md` is stale (still says age gate = Planned, HttpOnly = Planned)
- Mobile ApiClient has no attestation methods
- No mobile "Daily Check-In" button on ContractDetailScreen
- FEATURE-BACKLOG.md statuses are stale

This sprint targets **the highest-leverage work that directly advances the Phase 1 private beta**, prioritized by "blast radius" — how many downstream things each item unblocks.

---

## Sprint 2 Tasks (Ordered by Impact) — ALL COMPLETE

### Task 1: Mobile Attestation Screen + API Client Wiring — DONE
### Task 2: Mobile Registration — Age Gate + Terms Acceptance — DONE
### Task 3: Seed Data — Recovery Contracts + Attestations — DONE
### Task 4: Attestation Endpoint Tests — DONE (12 new tests, 581 total)
### Task 5: Update Implementation Status + Feature Backlog — DONE
### Task 6: Mobile Dashboard — Attestation Status Card — DONE
### Task 7: E2E Test — Attestation Flow — DONE (5 new tests)

---

# Styx Sprint 3: The Colosseum Gates

## Context

Sprint 2 delivered mobile attestation, registration parity, seed data, test coverage, and documentation accuracy. We're at **~79% Phase 1 readiness** (19/24 critical criteria met per FEATURE-BACKLOG.md).

**Exhaustive audit findings (what's left between here and 200-person beta):**

### Already solid (no work needed):
- Feed controller: 19 tests, comprehensive coverage
- Attestation scheduler: 5 tests, batch error resilience covered
- Smoke scripts: production-quality with retries and timeouts
- Web Daily Check-In: already implemented at `contracts/[id]/page.tsx:283`
- CI/CD: 4 workflows (ci, deploy, staging-promotion, beta-promotion), 7 validation gates, CodeQL

### Remaining gaps (ordered by beta-blocking severity):

1. **Contracts controller has NO spec file** — all 8 contract endpoints (CRUD, proof submission, attestation GET/POST, grace days, scheduler) have zero controller-level test coverage. This is the most critical gap.
2. **Mobile screen tests stale/missing** — `RegisterScreen.spec.tsx` doesn't cover age gate/terms checkboxes added in Sprint 2; no `AttestationScreen.spec.tsx` exists at all.
3. **No render.yaml** — Render Blueprint for declarative service provisioning. Terraform exists but Render's native IaC format is missing, making staging/beta deploys manual.
4. **Leaderboard TODO** — `src/web/components/Leaderboard.tsx:46` has a TODO for period filter (day/week/month/all-time). Minor but visible to beta testers.
5. **Mobile test infrastructure** — Jest config for React Native may need `@testing-library/react-native` setup.

---

## Sprint 3 Tasks (Ordered by Impact)

### Task 1: Contracts Controller Spec
**Why**: The contracts module handles ALL contract operations — creation, detail, proof submission, grace days, attestation, and scheduled tasks. 8 endpoints, zero controller-level tests. The service layer (contracts.service.spec.ts) has 62 tests, but controller guards (AuthGuard, GeofenceGuard, BannedUserGuard), decorators (@Throttle), and request routing are untested.

**Files to create/modify:**
- `src/api/src/modules/contracts/contracts.controller.spec.ts` — **NEW** — Test all 8 controller endpoints:
  - `POST /contracts` — create contract (validates guards, DTO, calls service)
  - `GET /contracts` — list contracts (validates auth, calls service with userId)
  - `GET /contracts/:id` — get single contract (validates auth, calls service)
  - `POST /contracts/:id/proof` — submit proof (validates guards + BannedUserGuard)
  - `PATCH /contracts/:id/grace` — use grace day (validates auth)
  - `GET /contracts/:id/attestation` — get attestation status (validates auth + geofence)
  - `POST /contracts/:id/attestation` — submit attestation (validates auth + geofence + banned + throttle)
  - `POST /contracts/scheduler/daily` — daily scheduler (validates cron guard or admin)

**Pattern to follow:**
- `src/api/src/modules/auth/auth.controller.spec.ts` for NestJS controller test structure
- Mock the `ContractsService` entirely, test that the controller calls the right methods with the right arguments

### Task 2: Mobile Screen Tests — Attestation + Registration
**Why**: Two new screens (AttestationScreen) and major modifications (RegisterScreen with age gate + terms) shipped in Sprint 2 with zero test coverage. Mobile is the primary beta surface.

**Files to create/modify:**
- `src/mobile/screens/AttestationScreen.spec.tsx` — **NEW** — Test:
  - Renders loading state
  - Displays streak, days remaining, grace days from mocked API
  - Shows "I HELD THE LINE" button when not yet attested
  - Shows "Already Attested Today" when todayAttested=true
  - Shows strike warning when totalStrikes > 0
  - Submit button calls ApiClient.submitAttestation
  - Shows success state after submission
- `src/mobile/screens/RegisterScreen.spec.tsx` — **UPDATE** — Add tests for:
  - Age confirmation checkbox renders and toggles
  - Terms acceptance checkbox renders and toggles
  - Register button disabled when checkboxes unchecked
  - Register button enabled when both checked
  - ApiClient.register called with ageConfirmation + termsAccepted opts
  - Validation error shown when age not confirmed
  - Validation error shown when terms not accepted

### Task 3: Render Blueprint (render.yaml)
**Why**: Render is the deployment target (see deploy.yml, staging-promotion.yml, beta-promotion.yml). Without a `render.yaml` Blueprint, every new environment (staging, beta, production) requires manual service creation in the Render dashboard. This is the gap between "CI pushes code" and "infra exists to receive it."

**Files to create:**
- `render.yaml` — Render Blueprint declaring:
  - Web service: `@styx/api` (Node, port 3000, health check `/health`)
  - Web service: `@styx/web` (Node, port 3001, static build)
  - PostgreSQL database (plan: starter for beta, standard for prod)
  - Redis instance (plan: starter)
  - Environment groups referencing `.env.example` vars
  - Auto-deploy from `main` branch

### Task 4: Leaderboard Period Filter
**Why**: The Leaderboard component (`src/web/components/Leaderboard.tsx:46`) has a visible TODO for period filtering. Beta testers on the Fury page will see a static leaderboard with no time-range controls. Small feature, high visibility.

**Files to modify:**
- `src/web/components/Leaderboard.tsx` — Implement period filter:
  - Add filter UI (day / week / month / all-time tabs)
  - Pass period parameter to API call
  - Update leaderboard display on filter change

### Task 5: DashboardScreen Tests
**Why**: DashboardScreen is the first screen every beta tester sees. Sprint 2 added attestation status card, streak display, and navigation — all untested. The existing DashboardScreen has no spec file.

**Files to create:**
- `src/mobile/screens/DashboardScreen.spec.tsx` — **NEW** — Test:
  - Renders loading state
  - Displays integrity score from mocked profile
  - Displays balance from mocked balance API
  - Shows attestation card when active recovery contract exists
  - Shows "DUE" badge when todayAttested=false
  - Shows "Checked In Today" when todayAttested=true
  - Hides attestation card when no active recovery contracts
  - Shows "streak at risk" hint
  - Navigation to attestation screen on card tap

---

## Verification

After implementation, run in sequence:
```bash
# 1. API unit tests (must stay at 581+ passing)
cd src/api && npx jest --no-coverage

# 2. Mobile tests
cd ../mobile && npx jest --no-coverage

# 3. Full monorepo build
cd ../.. && npm run build

# 4. Lint
npx turbo run lint

# 5. Claim drift check
node scripts/validation/07-claim-drift-check.js
```

## Expected Impact

```
BEFORE:  ALPHA ██████████████████████░░ BETA (~79%)
AFTER:   ALPHA ████████████████████████ BETA (~88-90%)
```

This sprint delivers:
- **Controller-level test coverage** for the entire contracts module (the product core)
- **Mobile screen test coverage** for the two most critical beta screens
- **Declarative infrastructure** (render.yaml) so staging/beta deploys are one-click
- **Leaderboard polish** for Fury page visibility
- **Dashboard test coverage** for the landing screen

What remains after this sprint: TestFlight distribution (process/Apple review), push notifications (APNs integration), Fury consensus battle-testing under load, and final staging smoke-through.
