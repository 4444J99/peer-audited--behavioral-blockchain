# Beta Cut Plan (Fastest Phase 1 Launch)

This document defines the fastest credible beta boundary based on what the repo already supports and what the current scope lock actually allows.

## Scope Lock

Source of truth:

- `docs/planning/planning--phase1-private-beta-scope.md`
- `docs/planning/planning--beta-readiness-contract.md`
- `docs/FEATURE-BACKLOG.md` Part III

Current Phase 1 contract:

- iOS-first TestFlight external beta
- No-Contact recovery as the primary journey
- `Test-Money Pilot`
- US allowlist
- web as admin/support companion
- desktop as internal judge tool
- B2B/HR as internal demo only

## Fastest Shippable Beta

If the goal is "get beta out as quickly as possible," the cleanest answer is:

- ship one journey
- ship it on one primary surface
- keep money in test mode
- push everything else behind flags, roles, or internal-only routing

That means:

- keep: iOS auth, No-Contact contract creation, contract detail, daily attestation, basic wallet readouts, profile/settings
- keep conditionally: digital exhaust if it works reliably in test mode
- hide or disable: public Fury workflows, public web parity, B2B/HR, desktop judge console from testers, real-money settlement operations, synthetic proof-capture paths presented as if they are production-ready

## Reality Check Against Current Code

### Already aligned with the scope

- mobile bootstrap flags exist in `src/api/src/modules/beta/beta.controller.ts`
- mobile local defaults mirror those flags in `src/mobile/config/beta.ts`
- mobile already shows a phase notice via `showNoContactScopeNotice`
- mobile create-contract screen already filters categories when `phase1NoContactOnly` is `true`
- web `/hr` already hides itself unless `NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI=true`
- desktop B2B tab already hides unless `STYX_FEATURE_B2B_HR_UI=true`
- private beta / test-money banners already exist in web, mobile, and desktop

### Misaligned with the scope

- mobile still exposes the `Fury` tab in `src/mobile/App.tsx`
- web dashboard still links to `/fury` and `/tavern`
- web landing page still drives users toward `/pitch` and `/ask`
- mobile proof capture is a synthetic camera flow in `src/mobile/components/CameraModule.tsx`, not native capture
- mobile contract creation uses a legacy payload shape in `src/mobile/services/ApiClient.ts` and does not match the current API DTO shape cleanly

## Surface Matrix

| Surface | Current Reality | Beta Decision | Action |
|---|---|---|---|
| iOS auth (`Login`, `Register`) | core flow exists | keep | leave on |
| iOS create contract | screen exists, scope notice exists, payload contract is drifted | keep, but only after API payload is corrected | patch request shape and keep No-Contact only |
| iOS contract detail | active tester surface | keep | leave on |
| iOS daily attestation | primary Phase 1 journey | keep | leave on |
| iOS digital exhaust | secondary recovery proof path | keep if stable, otherwise hide | decide after device-level smoke |
| iOS wallet | useful read-only reassurance | keep | leave on, test-money labeled |
| iOS Fury tab | non-primary, exposes reviewer economy and moderation complexity | hide | remove from bottom tabs for external beta |
| iOS camera proof capture | current implementation is synthetic | disable or relabel internal | hide button unless native capture is ready, or relabel as non-production |
| Web dashboard | currently mixes consumer navigation with beta-irrelevant routes | internal/support only | reduce nav or gate by role |
| Web `/fury` | tester-visible today | hide from testers | gate behind admin/internal role or remove nav entry |
| Web `/tavern` | community/social surface | hide | remove nav link and beta access |
| Web `/ask` | AI companion / experimental | hide | remove beta CTA |
| Web `/pitch` | investor/manifesto surface | hide from tester journey | remove beta CTA |
| Web `/admin` | operator tool | internal-only | keep behind auth/admin only |
| Web `/hr` | already hidden by flag | internal-only | keep flag off |
| Web `/realms` | non-core discovery surface | hide | keep out of beta nav |
| Desktop judge app | internal-only per scope | internal-only | do not distribute to testers |
| Real-money settlement endpoints | rich internal tooling exists | internal-only / deferred | keep out of tester flows and maintain `test-money` |

## What To Hide Immediately

### Mobile

- `src/mobile/App.tsx`
  remove the `Fury` tab from the tester-facing navigator
- `src/mobile/screens/ContractDetailScreen.tsx`
  hide `Capture Proof` while the camera path is synthetic
- `src/mobile/components/CameraModule.tsx`
  do not present this as production proof capture in the external beta

### Web

- `src/web/app/page.tsx`
  remove direct CTA links to `/pitch` and `/ask` from the beta home surface
- `src/web/app/dashboard/page.tsx`
  remove or role-gate links to `/fury`, `/tavern`, and any non-core consumer detours
- `src/web` route exposure
  treat `/admin`, `/hr`, `/fury`, `/tavern`, `/ask`, `/pitch`, `/realms` as non-tester routes for Phase 1

### Desktop

- `src/desktop/src/App.tsx`
  keep desktop in the internal-operator lane only; no tester distribution

## What To Close Off Functionally

### 1. Real-money behavior

Keep these true for external beta:

- `STYX_TEST_MONEY_MODE=true`
- no tester-facing manual settlement execution
- no tester-facing claims that money movement is live or production-cleared

### 2. Non-recovery categories

The scope already says No-Contact recovery is primary. The fastest path is:

- keep `phase1NoContactOnly=true`
- do not expose non-recovery categories in mobile
- do not spend beta time polishing other oath streams

### 3. Public peer-auditor economy

The Fury system can still exist operationally, but exposing it broadly creates extra QA, moderation, and reward-accounting complexity. Fastest beta path:

- run reviewer/judge operations internally or with a tightly controlled small set
- do not make Fury reviewing a primary tester feature

## Engineering Blockers That Matter For Fast Beta

These are the concrete engineering issues that affect the fastest launch path:

### Blocker 1: Mobile contract creation payload drift

Evidence:

- API expects `oathCategory`, `verificationMethod`, `stakeAmount`, `durationDays`
- mobile `ApiClient.createContract()` sends `category`, `description`, `stakeAmount`, `durationDays`

Implication:

- the primary iOS create-contract path is not trustworthy until the payload matches the API contract

### Blocker 2: Proof capture is still synthetic

Evidence:

- `src/mobile/components/CameraModule.tsx` uses generated synthetic capture session helpers
- repo backlog explicitly says native camera is still a blocker, while also noting text-only / attestation-based Phase 1 can still be acceptable

Implication:

- do not make proof capture a required or prominent external-beta behavior unless native capture lands

### Blocker 3: Money logic is not ready for real-money trust

Evidence:

- documented in `planning--financial-logic-map--2026-03-09.md`

Implication:

- keep beta in test-money mode and avoid scope expansion during launch hardening

## Recommended Launch Sequence

1. Lock flags:
   `privateBeta=true`, `testMoneyMode=true`, `allowlistUsOnly=true`, `phase1NoContactOnly=true`, `enableB2bHrUi=false`
2. Cut navigation:
   remove beta-user access to Fury, Tavern, Ask, Pitch, HR, Realms, public admin surfaces
3. Make iOS one-path:
   login -> create No-Contact contract -> view contract -> daily attestation -> wallet/profile
4. Hide proof capture unless it is truly needed for the first cohort
5. Keep disputes, settlement, and judge tools internal
6. Run `npm run beta:readiness` and use the generated artifact as the go/no-go evidence

## Launch Heuristic

A feature stays in the external beta only if it satisfies all three:

- required for the No-Contact recovery journey
- already works on iOS without special handling
- does not expand legal/payment/moderation complexity

If it fails any of those, it should be hidden, internal-only, or deferred.

## Bottom Line

The fastest beta is not "ship everything half-finished." It is:

- one platform
- one journey
- test-money only
- tight allowlist
- internalize reviewer/admin/B2B complexity
- cut every visible surface that does not help a tester create, maintain, and complete a No-Contact contract
