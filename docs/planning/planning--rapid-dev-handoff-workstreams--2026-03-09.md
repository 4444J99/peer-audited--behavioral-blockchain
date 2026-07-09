# Rapid Dev Handoff Workstreams

This groups the immediate work into clean parallel lanes so development can move fast without stepping on itself.

## Operating Rule

Each lane needs:

- one clear boundary
- one coordinating owner
- one concrete exit condition

If a task crosses multiple lanes, it needs to be split before handoff.

## Lane Summary

| Lane | Purpose | Can start now? | Depends on Jessica? |
|---|---|---|---|
| `WS1 Mobile Core Path` | make the iOS beta journey actually work | yes | no |
| `WS2 Beta Surface Cuts` | hide non-beta surfaces fast | yes | no |
| `WS3 Proof Capture Boundary` | stop synthetic proof capture from shipping as truth | yes | no |
| `WS4 Financial Truth` | normalize units and unify payout math | partial | **yes** for payout policy |
| `WS5 Release Ops And Policy` | close Apple / moderation / beta-readiness evidence gaps | yes | **yes** |

## WS1 Mobile Core Path

Purpose:

- make the primary Phase 1 tester journey reliable

Scope:

- login
- register
- create No-Contact contract
- contract detail
- daily attestation
- wallet
- profile/settings

Files:

- `src/mobile/services/ApiClient.ts`
- `src/mobile/screens/CreateContractScreen.tsx`
- `src/mobile/screens/ContractDetailScreen.tsx`
- `src/mobile/screens/AttestationScreen.tsx`
- related mobile tests

Do now:

1. align mobile create-contract payload with the API contract
2. confirm the create -> detail -> attestation path works
3. remove any stale field names or response-shape assumptions

Exit condition:

- a tester can complete the core No-Contact path on iOS without touching internal surfaces

## WS2 Beta Surface Cuts

Purpose:

- reduce the product to the smallest honest beta footprint

Scope:

- remove or gate non-beta routes, tabs, and CTAs

Files:

- `src/mobile/App.tsx`
- `src/web/app/page.tsx`
- `src/web/app/dashboard/page.tsx`
- `src/web/app/layout.tsx`

Do now:

1. remove the mobile `Fury` tab from tester-facing navigation
2. remove or role-gate web links to `Fury`, `Tavern`, `Ask`, `Pitch`, `HR`, `Realms`
3. keep web and desktop positioned as internal/admin companions, not public beta surfaces

Exit condition:

- the visible beta surface matches `iOS + No-Contact + test-money + US allowlist`

## WS3 Proof Capture Boundary

Purpose:

- prevent the beta from presenting synthetic capture as production truth

Scope:

- camera/proof entry points
- proof-related CTA visibility

Files:

- `src/mobile/components/CameraModule.tsx`
- `src/mobile/screens/ContractDetailScreen.tsx`
- any related proof-submit navigation

Do now:

1. decide whether proof capture is required for this cohort
2. if not required, hide the tester-facing capture CTA
3. if required internally, relabel it as non-production or internal-only

Exit condition:

- no external tester is misled into thinking synthetic capture is a production verification path

## WS4 Financial Truth

Purpose:

- stop finance logic from drifting further while beta ships in test-money mode

Scope:

- stake units
- payout formula
- settlement math
- wallet balance sign conventions

Files:

- `src/api/src/modules/contracts/dto.ts`
- `src/api/src/modules/contracts/contracts.service.ts`
- `src/api/src/modules/payments/settlement-quote.ts`
- `src/api/src/modules/payments/stripe-fbo.service.ts`
- `src/api/src/modules/payments/settlement.service.ts`
- `src/api/src/modules/payments/settlement.worker.ts`
- `src/api/src/modules/wallet/wallet.controller.ts`

Do now:

1. lock a single internal unit
2. stop mixed dollar/cents handling on stake-bearing paths
3. unify failed-settlement payout math to one formula
4. document whether appeal fees and onboarding credits are ledger-inside or ledger-adjacent

Dependency:

- Jessica must complete [planning--payout-math-worksheet--2026-03-09.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--payout-math-worksheet--2026-03-09.md) before the final payout formula is locked

Exit condition:

- one canonical unit and one canonical payout formula exist in code and docs

## WS5 Release Ops And Policy

Purpose:

- close the non-dev blockers that actually stop the external beta

Scope:

- Apple account / TestFlight control
- minimum moderation / App Review package
- readiness evidence and release packet

Related blocker issues:

- `#141`
- `#146`
- `#136`

Primary docs:

- `docs/planning/planning--partner-atomic-blocker-workbook--2026-03-09.md`
- `docs/planning/planning--business-blocker-ledger--2026-03-09.md`
- `docs/planning/planning--legal-artifact-production-plan--2026-03-09.md`

Do now:

1. settle Apple account ownership and upload chain
2. produce the minimum moderation package for external TestFlight
3. keep legal whitepaper work moving in parallel
4. run readiness and save the artifact

Exit condition:

- TestFlight ownership is clear, the moderation packet exists, and the beta-readiness artifact is present

## Recommended Parallel Start Order

Start immediately:

1. `WS1 Mobile Core Path`
2. `WS2 Beta Surface Cuts`
3. `WS3 Proof Capture Boundary`
4. `WS5 Release Ops And Policy`

Start once Jessica answers the worksheet:

5. `WS4 Financial Truth`

## Non-Goals For This Handoff

Do not spend current beta time on:

- B2B/HR feature polish
- public Fury reviewer economy expansion
- real-money activation
- broad oath-category support
- investor/pitch/public web storytelling surfaces

## Bottom Line

If the goal is speed, the development team should treat this as a narrow release campaign:

- one app path
- one scope firewall
- one proof-policy decision
- one finance normalization lane
- one release-ops lane
