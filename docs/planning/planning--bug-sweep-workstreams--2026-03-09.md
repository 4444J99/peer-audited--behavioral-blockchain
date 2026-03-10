# Bug Sweep Workstreams (2026-03-09)

This is the parallel bug-hunt plan for the current Phase 1 private beta.

It exists to answer one question:

- what workstreams should run now to find and close product defects before release?

It does not duplicate legal review. Counsel review can run in parallel, but it is not the same thing as product QA.

## First Principle

For the current Phase 1 beta, outside-counsel notes are not a technical requirement to upload a TestFlight build.

They are an internal risk-control artifact for:

- legal posture
- public expansion
- real-money activation
- durable claims review

They are not a substitute for bug-finding.

## External Rule Boundary

Current Apple-facing facts:

- Apple requires App Review compliance for apps, including user-generated-content moderation expectations under Guideline `1.2`: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- external TestFlight builds go through TestFlight App Review / test information flow: [TestFlight App Review](https://developer.apple.com/help/glossary/testflight-app-review/), [Provide test information](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/), [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)
- Apple expects complete test information, reviewer access, and working backend services during review: [App Review](https://developer.apple.com/app-store/review/)

What I did **not** find:

- any Apple rule saying you must obtain outside-counsel notes before external TestFlight

So the practical answer is:

- `No`, counsel notes are not a universal hard requirement to upload the current private beta
- `Yes`, they are still worth requiring internally for this product because the product sits near regulated claims, moderation, privacy, and later real-money scope

## Parallel Bug Workstreams

| Lane | Scope | Why it matters | Blocks current beta? | Owner | Primary evidence |
|---|---|---|---|---|---|
| `B1` Mobile journey sweep | iOS beta core path from login to attestation | Main tester path must not crash or misread backend shapes | `Yes` | Mobile engineering | passing targeted mobile suite + manual journey record |
| `B2` API contract sweep | contract DTOs, bootstrap, auth guards, critical endpoints | mobile/web both depend on correct API truth | `Yes` | API engineering | passing targeted API suite + readiness gates |
| `B3` Web surface sweep | landing page, dashboard, legal/support entry points | avoid broken beta messaging and bad tester routing | `Yes` for public-facing web, `No` for internal-only pages | Web engineering | passing web tests + build |
| `B4` Financial invariant sweep | stake units, settlement math, ledger consistency | money bugs are catastrophic even in test-money mode | `Yes` for correctness, though policy choice can remain provisional | API/finance engineering | settlement/ledger tests + invariant scripts |
| `B5` Release readiness sweep | smoke scripts, environment targets, deploy proof | beta should not ship on assumptions | `Yes` | Platform / release owner | `beta-readiness-summary.json` pass against real targets |
| `B6` UX copy and claim-drift sweep | labels, legal routes, beta wording, App Review-sensitive copy | prevents rejection, confusion, and misleading testers | `Yes` if drift affects public/tester-facing surfaces | Product + web/mobile | claim-drift pass + copy review diff |
| `B7` Manual exploratory sweep | real device checks, empty states, auth/session, reporting path | catches the defects tests miss | `Yes` | Founder / QA / trusted beta operators | written defect log with reproduction steps |

## Lane Details

### `B1` Mobile Journey Sweep

Mission:

- verify `register/login -> create no-contact contract -> detail -> daily attestation -> wallet/profile`

Check:

- stale field names
- stale response shapes
- broken nav targets
- proof-boundary leaks
- empty-state handling

Start with:

- `src/mobile/screens/`
- `src/mobile/services/ApiClient.ts`

Verify with:

```bash
cd src/mobile
npm test -- --runInBand \
  src/mobile/screens/DashboardScreen.spec.tsx \
  src/mobile/screens/CreateContractScreen.spec.tsx \
  src/mobile/screens/ContractDetailScreen.spec.tsx \
  src/mobile/screens/AttestationScreen.spec.tsx \
  src/mobile/services/ApiClient.spec.ts
```

### `B2` API Contract Sweep

Mission:

- confirm the API is the single source of runtime truth for the beta path

Check:

- `/mobile/bootstrap`
- `/meta/release`
- auth guard behavior
- contract creation payload
- attestation endpoints
- critical endpoint health

Start with:

- `src/api/src/modules/beta/`
- `src/api/src/modules/contracts/`
- `src/api/src/modules/auth/`
- `scripts/smoke/check-*.sh`

### `B3` Web Surface Sweep

Mission:

- ensure public/tester-facing web surfaces do not expose broken or out-of-scope beta paths

Check:

- homepage claims
- dashboard links
- legal/support routes
- suspense/build errors
- dead routes

Verify with:

```bash
cd src/web
npm test -- --runInBand app/page.test.tsx app/dashboard/page.test.tsx
npm run build
```

### `B4` Financial Invariant Sweep

Mission:

- bug-check all money arithmetic independent of Jessica’s final policy decision

Check:

- cents normalization
- ledger sign conventions
- settlement preview/execute parity
- refund-only vs capture-allowed paths
- no duplicate ledger writes

Verify with:

```bash
cd src/api
npm test -- --runInBand \
  contracts.service.spec.ts \
  settlement.service.spec.ts \
  settlement.worker.spec.ts \
  payments.controller.spec.ts \
  ledger.service.spec.ts \
  stripe-fbo.service.spec.ts \
  wallet.controller.spec.ts
```

### `B5` Release Readiness Sweep

Mission:

- prove the deployed beta environment is real and checkable

Check:

- `BETA_API_URL`
- `BETA_WEB_URL`
- beta release metadata
- endpoint smoke
- readiness artifact

Verify with:

```bash
READINESS_REQUIRE_TARGETS=true npm run beta:readiness
```

### `B6` UX Copy and Claim-Drift Sweep

Mission:

- ensure the product says what it actually is

Check:

- `private beta`
- `test-money pilot`
- `US allowlist`
- no accidental real-money claims
- no broad platform language on narrow beta surfaces
- legal/support links exist and match the product state

Primary checks:

- `scripts/validation/07-claim-drift-check.js`
- public web copy
- mobile beta banner / compliance notice

### `B7` Manual Exploratory Sweep

Mission:

- find the defects automation misses

Run a defect pass covering:

1. fresh-user registration
2. login after logout
3. invalid network / timeout handling
4. contract creation validation errors
5. empty contract list
6. daily attestation repeat / missed attestation behavior
7. reporting / moderation entry path if exposed
8. background / foreground resume
9. broken loading states
10. install/update behavior for TestFlight builds

Artifact:

- one defect log with:
  - severity
  - route/screen
  - reproduction steps
  - screenshot if needed

## Recommended Parallel Order

Run together now:

1. `B1` Mobile journey sweep
2. `B2` API contract sweep
3. `B3` Web surface sweep
4. `B4` Financial invariant sweep
5. `B5` Release readiness sweep
6. `B6` UX copy and claim-drift sweep
7. `B7` Manual exploratory sweep

Legal review can run beside this work, but it should not slow the bug sweep unless legal discovers a claim that must be removed immediately.

## Release Decision Rule

For the current private beta, do not block the bug sweep on outside-counsel notes.

Do block release on:

- known reproducible core-path defects
- readiness failures
- broken App Review / moderation-facing surfaces
- unresolved Apple/TestFlight control

Treat counsel review as:

- parallel legal risk reduction for the current beta
- a stronger gate for public expansion and real-money activation
