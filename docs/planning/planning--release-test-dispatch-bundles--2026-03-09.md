# Release Test Dispatch Bundles (2026-03-09)

This is the owner-ready dispatch form of the Phase 1 beta release test bar.

Use this when you want to assign the remaining release verification across a small number of people without forcing everyone to carry the entire `414`-test requirement at once.

## Recommended Split

Use `3` bundles.

That is the smallest split that still respects code boundaries:

1. `Bundle A — Runtime Truth`
2. `Bundle B — Surface Truth`
3. `Bundle C — Financial + Release Truth`

## Bundle A — Runtime Truth

Owner:

- mobile + API runtime owner

Mission:

- prove the core beta journey is coherent from API contract to iOS behavior

Includes:

### Mobile core (`94`)

- [DashboardScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/DashboardScreen.spec.tsx) — `13`
- [CreateContractScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/CreateContractScreen.spec.tsx) — `18`
- [ContractDetailScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/ContractDetailScreen.spec.tsx) — `6`
- [AttestationScreen.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/screens/AttestationScreen.spec.tsx) — `17`
- [ApiClient.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/services/ApiClient.spec.ts) — `21`
- [App.navigation.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/App.navigation.spec.tsx) — `1`
- [linking.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/config/linking.spec.ts) — `18`

### API runtime and contract truth (`226`)

- [auth.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/auth/auth.service.spec.ts) — `19`
- [beta.controller.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/beta/beta.controller.spec.ts) — `23`
- [geofence.guard.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/common/guards/geofence.guard.spec.ts) — `9`
- [compliance-policy.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/compliance/compliance-policy.service.spec.ts) — `54`
- [contracts.controller.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/contracts/contracts.controller.spec.ts) — `30`
- [contracts.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/contracts/contracts.service.spec.ts) — `91`

Bundle total: `320`

Run:

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

```bash
cd src/api
npm test -- --runInBand \
  src/modules/auth/auth.service.spec.ts \
  src/modules/beta/beta.controller.spec.ts \
  src/common/guards/geofence.guard.spec.ts \
  src/modules/compliance/compliance-policy.service.spec.ts \
  src/modules/contracts/contracts.controller.spec.ts \
  src/modules/contracts/contracts.service.spec.ts
```

Done when:

- mobile core path passes
- API contract truth passes
- no unresolved field-shape mismatch remains between mobile and backend

## Bundle B — Surface Truth

Owner:

- web / product-surface owner

Mission:

- prove the tester-facing and reviewer-facing surfaces are honest, narrow, and build-clean

Includes web beta-surface tests (`45`):

- [page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/page.test.tsx) — `12`
- [dashboard/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/dashboard/page.test.tsx) — `3`
- [contracts/new/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/contracts/new/page.test.tsx) — `8`
- [legal/terms/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/terms/page.test.tsx) — `5`
- [legal/privacy/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/privacy/page.test.tsx) — `4`
- [legal/rules/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/rules/page.test.tsx) — `4`
- [legal/responsible-use/page.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/legal/responsible-use/page.test.tsx) — `2`
- [SiteFooter.test.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/components/SiteFooter.test.tsx) — `7`

Bundle total: `45`

Run:

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

Done when:

- public/tester-facing surfaces match the Phase 1 beta scope
- legal/support routes render
- build passes with no beta-surface regressions

## Bundle C — Financial + Release Truth

Owner:

- API finance owner + platform/release owner

Mission:

- prove money math is coherent and the release environment is real

Includes financial / settlement / ledger tests (`49`):

- [payments.controller.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/payments.controller.spec.ts) — `7`
- [settlement.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/settlement.service.spec.ts) — `11`
- [settlement.worker.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/settlement.worker.spec.ts) — `2`
- [stripe-fbo.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/payments/stripe-fbo.service.spec.ts) — `10`
- [ledger.service.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/services/ledger/ledger.service.spec.ts) — `19`

Includes release readiness:

- `8` readiness gates from [planning--beta-readiness-contract.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--beta-readiness-contract.md)
- real `BETA_API_URL`
- optional real `BETA_WEB_URL`
- current artifact target: [beta-readiness-summary.json](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/artifacts/beta-readiness-summary.json)

Preferred adjacent mobile boundary tests (`15`) if those files changed:

- [CameraModule.spec.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/components/CameraModule.spec.tsx) — `3`
- [HealthKitMetadataGuard.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/services/HealthKitMetadataGuard.spec.ts) — `4`
- [NotificationService.spec.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/mobile/services/NotificationService.spec.ts) — `8`

Bundle total:

- required core: `49`
- preferred with adjacent boundary coverage: `64`

Run:

```bash
cd src/api
npm test -- --runInBand \
  src/modules/payments/payments.controller.spec.ts \
  src/modules/payments/settlement.service.spec.ts \
  src/modules/payments/settlement.worker.spec.ts \
  src/modules/payments/stripe-fbo.service.spec.ts \
  services/ledger/ledger.service.spec.ts
```

```bash
READINESS_REQUIRE_TARGETS=true npm run beta:readiness
```

Done when:

- payment and ledger paths pass
- readiness artifact returns `overallStatus: "pass"`
- no release is blocked by missing target URLs or failed gates

## Rollup

| Bundle | Automated tests |
|---|---:|
| `A` Runtime Truth | `320` |
| `B` Surface Truth | `45` |
| `C` Financial + Release Truth | `49` required / `64` preferred |
| **Required total** | **414** |
| **Preferred total** | **429** |

## Fastest Dispatch Option

If you only want `2` active owners right now, do this:

1. give `Bundle A` to the runtime owner
2. give `Bundle B + Bundle C` to the surface/release owner

That is less ideal, but still workable.

## Cleanest Dispatch Option

If you want the least ambiguity, use all `3` bundles exactly as written.
