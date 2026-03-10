# Final Beta Launch Propulsion

This is the final launch plan for the current Phase 1 beta. It is not a roadmap. It is the shortest complete list of work required to ship the external beta without pretending later-phase work is part of the immediate launch.

## Beta Definition

Beta is shipped when all of these are true:

- external testers can install the iOS app through TestFlight
- the tester-facing product is limited to the Phase 1 scope:
  `iOS`, `No-Contact recovery`, `Test-Money Pilot`, `US allowlist`
- a tester can complete the core journey:
  `login/register -> create No-Contact contract -> contract detail -> daily attestation -> wallet/profile`
- non-beta surfaces are hidden, gated, or internal-only
- proof capture is either hidden or clearly non-production
- Apple/TestFlight ownership and upload path are proven
- the minimum moderation/App Review packet exists
- `npm run beta:readiness` produces a passing readiness artifact

## Non-Negotiable Scope Lock

These are fixed for the launch push:

- iOS-first external TestFlight beta only
- `Test-Money Pilot` only
- `No-Contact` recovery as the primary tester journey
- `US allowlist` only
- web is internal/admin/support companion only
- desktop is internal judge tool only
- KYC runtime enforcement is not active in Phase 1
- real-money settlement is not active in Phase 1

If any team member tries to expand beyond those bounds, that is a scope change and must be treated as one.

## Hard Launch-Critical Path

These are the items that actually determine whether Beta can launch.

### 1. Mobile Core Journey Reliability

Owner:

- engineering

Why it is critical:

- if the core iOS journey does not work, there is no beta product to distribute

Required work:

1. align mobile create-contract payload with the live API contract
2. verify the create -> detail -> daily attestation path end to end
3. remove stale field-name or response-shape assumptions in the mobile client
4. keep wallet and profile views functioning with test-money labels intact

Done evidence:

- device or simulator smoke proving the full No-Contact path works

Primary code boundary:

- `src/mobile/services/ApiClient.ts`
- `src/mobile/screens/CreateContractScreen.tsx`
- `src/mobile/screens/ContractDetailScreen.tsx`
- `src/mobile/screens/AttestationScreen.tsx`

### 2. Surface Lockdown

Owner:

- engineering

Why it is critical:

- the fastest beta dies if testers see half-built, non-core, or internally scoped surfaces

Required work:

1. remove the mobile `Fury` tab from tester-facing navigation
2. remove or role-gate web links to `Fury`, `Tavern`, `Ask`, `Pitch`, `HR`, and `Realms`
3. keep desktop distribution internal only
4. keep non-recovery oath categories hidden from the external tester path

Done evidence:

- tester-visible navigation matches the scope lock and nothing more

Primary code boundary:

- `src/mobile/App.tsx`
- `src/web/app/page.tsx`
- `src/web/app/dashboard/page.tsx`
- `src/web/app/layout.tsx`
- `src/desktop/src/App.tsx`

### 3. Proof Capture Policy Decision

Owner:

- engineering plus product decision

Why it is critical:

- the current synthetic camera path cannot be presented as production truth

Required work:

1. decide whether proof capture is required for the first tester cohort
2. if not required, hide the capture CTA
3. if required internally, relabel it as non-production or internal-only
4. do not make synthetic capture a launch dependency

Done evidence:

- no external tester is shown a synthetic proof flow as if it were production verification

Primary code boundary:

- `src/mobile/components/CameraModule.tsx`
- `src/mobile/screens/ContractDetailScreen.tsx`

### 4. Apple/TestFlight Control

Owner:

- Jessica plus release owner

Why it is critical:

- without a controlled Apple account, signing chain, and upload path, nothing ships

Required work:

1. confirm Apple Developer account ownership
2. confirm App Store Connect admin access
3. confirm certificate and provisioning ownership
4. execute one successful TestFlight upload
5. write the short release runbook

Done evidence:

- Apple owner record
- App Store Connect access record
- successful TestFlight upload
- release runbook linked from [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141)

### 5. Minimum Moderation And App Review Packet

Owner:

- Jessica plus legal/release ops

Why it is critical:

- external TestFlight with user-submitted proof content needs a minimum moderation package

Required work:

1. draft the minimum moderation policy
2. define the report, escalation, and removal flow
3. prepare App Review notes that match the in-product policy
4. keep the bigger public App Store package out of the immediate beta path

Done evidence:

- moderation policy
- escalation procedure
- App Review notes/screenshots
- legal/release sign-off linked from [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146)

### 6. Readiness Evidence

Owner:

- engineering plus release owner

Why it is critical:

- the repo already defines machine-readable go/no-go evidence; beta should not ship on vibes

Required work:

1. set the correct readiness target URLs
2. run `npm run beta:readiness`
3. review required gates:
   `api_ready`, `api_release_meta`, `critical_endpoints`, `ledger_invariant`, `security_invariants`, `claim_drift`
4. save and link `artifacts/beta-readiness-summary.json`
5. treat failures as release blockers until resolved or the contract is explicitly changed

Done evidence:

- passing readiness artifact

Primary source:

- [planning--beta-readiness-contract.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--beta-readiness-contract.md)

## Parallel But Not On The Hard Path

These should move, but they do not block the current `Test-Money Pilot` beta if the scope lock remains intact.

### 7. Financial Truth Normalization

Owner:

- engineering, with Jessica decision input

What must happen now:

- keep `test-money` mode active
- do not expose future real-money percentages in the beta UI
- use [planning--jessica-briefing-payout-decisions--2026-03-09.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--jessica-briefing-payout-decisions--2026-03-09.md) to lock the business policy before code normalization

What can wait until after beta launch pressure:

- full payout-formula cleanup
- broader real-money settlement activation work
- merchant underwriting execution

### 8. Foundational Legal Whitepaper Work

Owner:

- Jessica plus outside counsel

What must happen now:

- keep the whitepaper lane moving so the product posture does not drift

What does not block the immediate TestFlight launch:

- full real-money activation brief
- KYC vendor activation
- processor underwriting
- cross-jurisdictional expansion artifacts beyond the immediate beta need

Primary source:

- [planning--legal-artifact-production-plan--2026-03-09.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--legal-artifact-production-plan--2026-03-09.md)

## Explicit Deferrals

These are not beta-launch work and should not consume the critical path:

- real-money settlement activation
- merchant / processor underwriting
- KYC runtime enforcement
- public Fury economy expansion
- B2B / HR rollout
- public consumer web parity
- insurance and hardware partnerships
- broad oath-category expansion
- public App Store launch package beyond the minimum external beta packet

## Execution Order

This is the order that preserves speed.

### Immediate

1. `WS1 Mobile Core Path`
2. `WS2 Surface Lockdown`
3. `WS3 Proof Capture Boundary`
4. `WS5 Apple / Moderation / Release Ops`

### Then

5. run readiness and fix whatever fails
6. produce the TestFlight upload proof and release runbook
7. launch the allowlisted external beta

### Parallel

8. Jessica answers the payout briefing
9. legal whitepaper work continues in parallel
10. finance normalization starts only after the payout policy is explicit

## Beta Launch Checklist

The launch should not proceed until every item below is true.

- [ ] mobile create-contract path matches the API and works end to end
- [ ] tester-visible navigation contains only the Phase 1 surfaces
- [ ] proof capture is hidden or clearly non-production
- [ ] `STYX_TEST_MONEY_MODE=true`
- [ ] `phase1NoContactOnly=true`
- [ ] Apple account ownership and App Store Connect control are documented
- [ ] at least one successful TestFlight upload exists
- [ ] moderation policy and App Review notes exist
- [ ] readiness artifact is passing
- [ ] launch cohort is allowlisted and release runbook exists

## Bottom Line

The final propulsion formula is simple:

- narrow the product
- make the one iOS journey reliable
- hide everything else
- prove Apple/TestFlight control
- ship only with moderation and readiness evidence
- keep finance and legal expansion work parallel, not blocking, unless the scope changes

