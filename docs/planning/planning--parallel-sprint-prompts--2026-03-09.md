# Parallel Sprint Prompt Pack

These are copy-paste prompts for running the Beta push as separate, non-overlapping conquest lanes. Each prompt is designed so one agent or person can own one lane without stepping on the others.

## Use Rules

- assign one prompt per owner
- do not merge lanes unless a dependency forces it
- each owner must stay inside the listed file and scope boundaries
- each owner must return evidence, not just a status sentence
- if a lane discovers a blocker outside its boundary, it must report it, not silently expand scope

## Prompt 1: WS1 Mobile Core Path

```text
You own `WS1 Mobile Core Path` for the Phase 1 Beta launch.

Mission:
Make the iOS tester journey actually work for the scoped beta path:
`login/register -> create No-Contact contract -> contract detail -> daily attestation -> wallet/profile`

Scope lock:
- iOS only
- No-Contact recovery only
- test-money only
- US allowlist only

Primary files you may edit:
- src/mobile/services/ApiClient.ts
- src/mobile/screens/CreateContractScreen.tsx
- src/mobile/screens/ContractDetailScreen.tsx
- src/mobile/screens/AttestationScreen.tsx
- directly related mobile tests only

Do not touch unless absolutely required and justified:
- src/web/**
- src/desktop/**
- legal/planning docs
- payment policy / settlement math

What to do:
1. Align the mobile create-contract payload with the current API contract.
2. Remove stale field names and response-shape assumptions in the mobile client.
3. Verify the create -> detail -> daily attestation path end to end.
4. Keep wallet and profile functioning with test-money labels intact.

Required output:
- code changes limited to the boundary above
- a short note explaining what was wrong
- exact verification performed
- any remaining blocker that prevents the core path from working

Exit condition:
A tester can complete the No-Contact core path on iOS without touching any internal-only surfaces.
```

## Prompt 2: WS2 Surface Lockdown

```text
You own `WS2 Surface Lockdown` for the Phase 1 Beta launch.

Mission:
Strip the tester-facing product down to the smallest honest beta footprint.

Scope lock:
- keep only the Phase 1 external beta surfaces
- hide, gate, or remove non-beta surfaces from tester navigation

Primary files you may edit:
- src/mobile/App.tsx
- src/web/app/page.tsx
- src/web/app/dashboard/page.tsx
- src/web/app/layout.tsx
- src/desktop/src/App.tsx
- directly related UI tests only

Do not touch:
- mobile contract payload logic
- camera/proof logic
- payment/settlement code
- legal docs

What to do:
1. Remove the mobile `Fury` tab from tester-facing navigation.
2. Remove or role-gate web links to `Fury`, `Tavern`, `Ask`, `Pitch`, `HR`, and `Realms`.
3. Keep desktop positioned as internal-only.
4. Ensure tester-visible navigation matches:
   `iOS + No-Contact + test-money + US allowlist`

Required output:
- exact UI surfaces removed, gated, or relabeled
- exact files changed
- before/after navigation summary
- any remaining tester-visible route that still violates the scope lock

Exit condition:
An external tester can only see the intended Phase 1 surfaces and cannot casually wander into internal or later-phase product areas.
```

## Prompt 3: WS3 Proof Capture Boundary

```text
You own `WS3 Proof Capture Boundary` for the Phase 1 Beta launch.

Mission:
Prevent synthetic proof capture from shipping as if it were a production verification path.

Primary files you may edit:
- src/mobile/components/CameraModule.tsx
- src/mobile/screens/ContractDetailScreen.tsx
- directly related proof/navigation tests only

Do not touch:
- broader mobile navigation outside proof entry points
- payment logic
- legal docs
- web/desktop surfaces

What to do:
1. Determine whether proof capture is required for the first beta cohort.
2. If it is not required, hide the tester-facing capture CTA.
3. If it is still needed internally, relabel it as non-production or internal-only.
4. Ensure no external tester would reasonably believe the current synthetic flow is production verification.

Required output:
- clear statement of which path was chosen: hidden vs relabeled internal-only
- exact UI copy or visibility rule changed
- verification showing the tester-facing product no longer misrepresents proof capture
- any dependency on a future native camera implementation

Exit condition:
The external beta does not present a synthetic capture path as trusted production proofing.
```

## Prompt 4: WS5 Release Ops And Policy

```text
You own `WS5 Release Ops And Policy` for the Phase 1 Beta launch.

Mission:
Close the non-dev blockers that actually stop the external TestFlight beta.

Primary source docs:
- docs/planning/planning--beta-launch-propulsion--2026-03-09.md
- docs/planning/planning--partner-atomic-blocker-workbook--2026-03-09.md
- docs/planning/planning--business-blocker-ledger--2026-03-09.md
- docs/planning/planning--legal-artifact-production-plan--2026-03-09.md

Primary issue boundaries:
- #141 Apple account and TestFlight control
- #146 minimum moderation and App Review packet
- #136 legal whitepaper lane in parallel

What to do:
1. Confirm Apple account ownership, App Store Connect control, and upload responsibility.
2. Produce the minimum moderation package for external TestFlight.
3. Keep the legal whitepaper lane moving, but do not let it displace the TestFlight/App Review path.
4. Prepare the release runbook and evidence list required for go/no-go.

Do not spend time on:
- merchant underwriting
- KYC vendor activation
- public App Store launch package beyond the minimum beta packet
- later partnership work

Required output:
- one artifact checklist for #141
- one artifact checklist for #146
- one short parallel plan for #136
- explicit statement of what is still missing before external beta can ship

Exit condition:
Apple/TestFlight control is proven, the moderation/App Review packet exists, and the release evidence path is clear.
```

## Prompt 5: WS4 Financial Truth

```text
You own `WS4 Financial Truth`, but this lane starts only after Jessica answers the payout briefing.

Mission:
Normalize money units and payout math so the system has one internal financial truth.

Dependency:
Do not finalize payout formula changes until Jessica’s decisions are explicit in:
- docs/planning/planning--jessica-briefing-payout-decisions--2026-03-09.md

Primary files you may edit:
- src/api/src/modules/contracts/dto.ts
- src/api/src/modules/contracts/contracts.service.ts
- src/api/src/modules/payments/settlement-quote.ts
- src/api/src/modules/payments/stripe-fbo.service.ts
- src/api/src/modules/payments/settlement.service.ts
- src/api/src/modules/payments/settlement.worker.ts
- src/api/src/modules/wallet/wallet.controller.ts
- directly related tests only

What to do:
1. Lock one canonical internal money unit.
2. Remove mixed dollar/cents handling on stake-bearing paths.
3. Unify failed-settlement payout math to one formula.
4. Document whether appeal fees and onboarding credits are ledger-inside or ledger-adjacent.

Do not do:
- real-money activation expansion
- processor integration work
- UI storytelling about future real-money economics

Required output:
- exact canonical unit chosen
- exact payout formula implemented
- tests proving the new invariant
- any unresolved edge case or drift still present

Exit condition:
The codebase has one internal money unit and one payout formula, both reflected in code and tests.
```

## Prompt 6: Launch Commander

```text
You are the `Launch Commander` for the Phase 1 Beta push.

Mission:
Coordinate the sprint lanes without doing their work for them. Your job is to keep the beta definition pure, verify evidence, and stop scope drift.

Inputs:
- docs/planning/planning--beta-launch-propulsion--2026-03-09.md
- docs/planning/planning--rapid-dev-handoff-workstreams--2026-03-09.md
- docs/planning/planning--partner-atomic-blocker-workbook--2026-03-09.md
- docs/planning/planning--beta-readiness-contract.md

Your responsibilities:
1. Track the hard path:
   WS1, WS2, WS3, WS5, then readiness.
2. Reject any attempt to pull later-phase items into the beta path.
3. Require evidence for completion, not just verbal status.
4. Keep a blocker list with owner, next action, and proof needed.
5. Run or coordinate `npm run beta:readiness` at the correct time.

Do not do:
- rewrite lane scope
- absorb another lane’s work instead of escalating
- call an item done without evidence

Required output:
- a live status line for each lane:
  `Not started / In progress / Blocked / Done`
- the current launch blockers
- the current evidence already secured
- the exact go/no-go gap remaining

Exit condition:
The team knows exactly what still blocks launch and no one is confusing parallel work with the true critical path.
```

## Recommended Assignment Order

Start now:

1. Prompt 1 `WS1 Mobile Core Path`
2. Prompt 2 `WS2 Surface Lockdown`
3. Prompt 3 `WS3 Proof Capture Boundary`
4. Prompt 4 `WS5 Release Ops And Policy`
5. Prompt 6 `Launch Commander`

Start after Jessica answers:

6. Prompt 5 `WS4 Financial Truth`

## Bottom Line

The point of this prompt pack is to force clean conquest lanes:

- one mobile reliability lane
- one surface lockdown lane
- one proof-policy lane
- one release/policy lane
- one financial truth lane after business input
- one commander lane that protects the scope and checks evidence

