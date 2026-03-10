# Release Test Matrix (2026-03-09)

This is the test bar for the current Phase 1 private beta.

It answers:

- how many tests exist in the repo
- how many tests should matter for this release
- what exact commands define the release gate

## Short Answer

There are about `1,822` test cases in the repo today, but that is not the right release target for the current beta.

For the current Phase 1 private beta, the practical release bar is:

- `414` required automated test cases across the beta-critical suites
- `15` additional recommended automated test cases for boundary/adjacent mobile behavior
- `8` readiness gates
- `10` manual exploratory scenarios

So the clean answer is:

- **required release bar:** `414 automated + readiness + manual smoke`
- **preferred release bar:** `429 automated + readiness + manual smoke`

## Scope Basis

This matrix follows the actual Phase 1 scope in [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md):

- iOS first
- No-Contact recovery
- TestFlight external beta
- `Test-Money Pilot`
- `US allowlist`
- web is internal/admin/support companion only
- desktop is internal judge tool only

Because of that scope lock, the entire monorepo does **not** need to be the launch gate.

## Repo-Wide Inventory

Current local inventory:

| Workspace | Test files | Test cases |
|---|---:|---:|
| `src/api` | 93 | 855 |
| `src/web` | 40 | 344 |
| `src/mobile` | 32 | 299 |
| `src/shared` | 4 | 111 |
| `src/desktop` | 8 | 127 |
| `src/ask-styx` | 4 | 35 |
| repo / other | 8 | 51 |
| **Total** | **189** | **1,822** |

That is the repo safety net, not the release gate.

## Required Phase 1 Release Bar

### 1. Mobile Core Path

Required:

- [DashboardScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/DashboardScreen.spec.tsx) — `13`
- [CreateContractScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/CreateContractScreen.spec.tsx) — `18`
- [ContractDetailScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/ContractDetailScreen.spec.tsx) — `6`
- [AttestationScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/AttestationScreen.spec.tsx) — `17`
- [ApiClient.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/services/ApiClient.spec.ts) — `21`
- [App.navigation.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/App.navigation.spec.tsx) — `1`
- [linking.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/config/linking.spec.ts) — `18`

Subtotal: `94`

### 2. Web Beta-Safe Surface

Required:

- [page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/page.test.tsx) — `12`
- [dashboard/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/dashboard/page.test.tsx) — `3`
- [contracts/new/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/contracts/new/page.test.tsx) — `8`
- [legal/terms/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/terms/page.test.tsx) — `5`
- [legal/privacy/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/privacy/page.test.tsx) — `4`
- [legal/rules/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/rules/page.test.tsx) — `4`
- [legal/responsible-use/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/responsible-use/page.test.tsx) — `2`
- [SiteFooter.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/components/SiteFooter.test.tsx) — `7`

Subtotal: `45`

### 3. API / Financial / Beta Contract Truth

Required:

- [auth.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/auth/auth.service.spec.ts) — `19`
- [beta.controller.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/beta/beta.controller.spec.ts) — `23`
- [geofence.guard.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/common/guards/geofence.guard.spec.ts) — `9`
- [compliance-policy.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/compliance/compliance-policy.service.spec.ts) — `54`
- [contracts.controller.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/contracts/contracts.controller.spec.ts) — `30`
- [contracts.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/contracts/contracts.service.spec.ts) — `91`
- [payments.controller.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/payments.controller.spec.ts) — `7`
- [settlement.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/settlement.service.spec.ts) — `11`
- [settlement.worker.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/settlement.worker.spec.ts) — `2`
- [stripe-fbo.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/stripe-fbo.service.spec.ts) — `10`
- [ledger.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/services/ledger/ledger.service.spec.ts) — `19`

Subtotal: `275`

## Recommended Additional Coverage

These are not the minimum release bar, but they should pass if touched or if the relevant lane changes:

- [CameraModule.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/components/CameraModule.spec.tsx) — `3`
- [HealthKitMetadataGuard.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/services/HealthKitMetadataGuard.spec.ts) — `4`
- [NotificationService.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/services/NotificationService.spec.ts) — `8`

Subtotal: `15`

## Release Math

| Bar | Automated tests |
|---|---:|
| Required beta bar | `414` |
| Preferred beta bar | `429` |
| Whole-repo inventory | `1,822` |

Where `414` comes from:

- mobile core `94`
- web beta surfaces `45`
- API / compliance / financial truth `275`

## Required Commands

### Mobile Required

```bash
cd src/mobile
npm test -- --runInBand \
  src/mobile/screens/DashboardScreen.spec.tsx \
  src/mobile/screens/CreateContractScreen.spec.tsx \
  src/mobile/screens/ContractDetailScreen.spec.tsx \
  src/mobile/screens/AttestationScreen.spec.tsx \
  src/mobile/services/ApiClient.spec.ts \
  src/mobile/App.navigation.spec.tsx \
  src/mobile/config/linking.spec.ts
```

### Web Required

```bash
cd src/web
npm test -- --runInBand \
  app/page.test.tsx \
  app/dashboard/page.test.tsx \
  app/contracts/new/page.test.tsx \
  app/legal/terms/page.test.tsx \
  app/legal/privacy/page.test.tsx \
  app/legal/rules/page.test.tsx \
  app/legal/responsible-use/page.test.tsx \
  components/SiteFooter.test.tsx
npm run build
```

### API Required

```bash
cd src/api
npm test -- --runInBand \
  src/modules/auth/auth.service.spec.ts \
  src/modules/beta/beta.controller.spec.ts \
  src/common/guards/geofence.guard.spec.ts \
  src/modules/compliance/compliance-policy.service.spec.ts \
  src/modules/contracts/contracts.controller.spec.ts \
  src/modules/contracts/contracts.service.spec.ts \
  src/modules/payments/payments.controller.spec.ts \
  src/modules/payments/settlement.service.spec.ts \
  src/modules/payments/settlement.worker.spec.ts \
  src/modules/payments/stripe-fbo.service.spec.ts \
  services/ledger/ledger.service.spec.ts
```

### Readiness Required

```bash
READINESS_REQUIRE_TARGETS=true npm run beta:readiness
```

This must satisfy the readiness contract in [planning--beta-readiness-contract.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--beta-readiness-contract.md).

## Readiness Gates

Current readiness contract includes `8` gates:

- required:
  - `api_ready`
  - `api_release_meta`
  - `critical_endpoints`
  - `ledger_invariant`
  - `security_invariants`
  - `claim_drift`
- optional:
  - `web_availability`
  - `behavioral_constants`

For a real beta release, the artifact must end in:

- `overallStatus: "pass"`

not `incomplete`, and not `fail`.

## Manual Exploratory Bar

Even if the automated suites pass, do not ship without a short exploratory pass covering at least these `10` scenarios:

1. fresh registration
2. login after logout
3. empty contract state
4. create No-Contact contract validation
5. create -> detail transition
6. daily attestation happy path
7. repeated or invalid attestation handling
8. wallet/profile loading
9. background/resume behavior
10. public/support/legal routes from tester-facing surfaces

## Decision Rule

For this release, "fully covered" should mean:

1. the `414` required automated tests pass
2. readiness passes against real beta targets
3. manual exploratory smoke is signed off
4. any changed adjacent suite also passes

Do **not** require the full `1,822` repo-wide inventory to treat the current beta as releasable. That is the broader safety net, not the scoped launch bar.
