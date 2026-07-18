# Parallel Remediation Prompt Pack

These are copy-paste prompts for the post-review remediation pass. Each prompt is isolated to one execution lane and is grounded in the current implementation gaps, not the original planning assumptions.

## Use Rules

- assign one prompt per owner
- do not merge lanes unless a dependency forces it
- stay inside the listed file boundaries
- report evidence, not just status
- if you discover an out-of-scope blocker, report it and stop expanding

## Prompt 1: Lane 1 Mobile Runtime Reliability

```text
You own `Lane 1 — Mobile Runtime Reliability` for the Phase 1 Beta remediation pass.

Mission:
Make the actual iOS beta path internally consistent:
`dashboard -> create contract -> contract detail -> daily attestation`

Scope lock:
- iOS only
- No-Contact recovery beta only
- test-money only

Primary files you may edit:
- src/mobile/screens/DashboardScreen.tsx
- src/mobile/screens/CreateContractScreen.tsx
- src/mobile/screens/ContractListScreen.tsx
- src/mobile/screens/ContractDetailScreen.tsx
- src/mobile/screens/AttestationScreen.tsx
- src/mobile/services/ApiClient.ts
- directly related mobile tests only when necessary

Known defects to resolve:
1. Dashboard still assumes stale response shapes.
2. Dashboard reads old contract field names.
3. Attestation handling is inconsistent across client and backend responses.
4. Contract detail expects fields the backend does not actually guarantee.

Do not touch:
- src/web/**
- src/desktop/**
- release/legal docs
- payment/settlement policy

Required output:
- exact runtime mismatches fixed
- exact files changed
- verification performed
- any remaining API contract mismatch still blocking the iOS beta path

Exit condition:
The scoped mobile beta path uses one coherent API/field model and can be verified without crashing or relying on imaginary fields.
```

## Prompt 2: Lane 2 Beta Surface Lockdown

```text
You own `Lane 2 — Beta Surface Lockdown` for the Phase 1 Beta remediation pass.

Mission:
Remove or hide every tester-facing surface that violates the narrow Phase 1 beta promise.

Scope lock:
- public/tester-facing surfaces only
- do not refactor backend logic

Primary files you may edit:
- src/web/app/page.tsx
- src/web/app/dashboard/page.tsx
- src/web/app/layout.tsx
- src/desktop/src/App.tsx
- directly related UI tests only

Known defects to resolve:
1. The public landing page still markets the broader staking/blockchain product.
2. The web dashboard still exposes non-beta or internal destinations.
3. Desktop is labeled internal-only but is not strongly gated in this file.

Do not touch:
- mobile contract payload/runtime logic
- proof capture internals
- release ops docs
- finance logic

Required output:
- exact surfaces removed, hidden, or relabeled
- exact files changed
- before/after surface summary
- any remaining tester-visible route that still violates the beta cut

Exit condition:
An external beta tester only sees the intended Phase 1 surfaces and cannot casually enter broader or internal product areas.
```

## Prompt 3: Lane 3 Proof Boundary Closure

```text
You own `Lane 3 — Proof Boundary Closure` for the Phase 1 Beta remediation pass.

Mission:
Finish the proof-capture boundary decision. The current synthetic flow cannot remain a half-open tester-visible path.

Primary files you may edit:
- src/mobile/components/CameraModule.tsx
- src/mobile/screens/ContractDetailScreen.tsx
- src/mobile/App.tsx
- directly related proof/navigation tests only

Known defects to resolve:
1. Contract detail still shows a tester-visible capture CTA.
2. Camera flow is relabeled non-production but still behaves like an operational verification workflow.
3. Navigation still keeps the proof route alive even after surface lockdown work.

Decision boundary:
- either hide proof capture from testers entirely
- or gate it explicitly as internal/beta-preview only with clear rules

Do not touch:
- native camera implementation beyond boundary gating
- web/desktop surfaces
- release/legal docs
- settlement logic

Required output:
- chosen path: hidden or internal-only
- exact visibility/gating rule implemented
- exact UI copy changed
- verification that external testers no longer perceive synthetic proof as normal production behavior

Exit condition:
The external beta no longer presents a synthetic proof-capture flow as a normal user action.
```

## Prompt 4: Lane 4 Release Ops Evidence

```text
You own `Lane 4 — Release Ops Evidence` for the Phase 1 Beta remediation pass.

Mission:
Convert checklists and blocker language into evidence-backed launch artifacts.

Primary sources:
- docs/planning/planning--release-ops-checklists--2026-03-09.md
- docs/planning/planning--beta-launch-propulsion--2026-03-09.md
- docs/planning/planning--business-blocker-ledger--2026-03-09.md
- GitHub issues #141, #146, #136
- artifacts/beta-readiness-summary.json

Known defects to resolve:
1. Apple/TestFlight ownership and upload evidence are not assembled.
2. Moderation/App Review packet evidence is not assembled.
3. Readiness artifact currently passes with skipped gates.
4. Legal whitepaper lane needs explicit parallel status, not vague dependency language.

Do not spend time on:
- merchant underwriting
- KYC vendor activation
- real-money activation work
- unrelated app runtime refactors

Required output:
- evidence checklist for #141
- evidence checklist for #146
- parallel status note for #136
- corrected readiness/evidence summary
- explicit list of what still blocks external beta shipment

Exit condition:
The release path is backed by real evidence artifacts instead of planning/checklist placeholders.
```

## Prompt 5: Lane 5 Test Reconciliation

```text
You own `Lane 5 — Test Reconciliation` for the Phase 1 Beta remediation pass.

Mission:
Bring test expectations back into sync after the runtime and boundary changes land.

Starts after:
- Lane 1 has stabilized the mobile runtime path
- Lane 3 has finalized the proof boundary decision

Primary files you may edit:
- src/mobile/screens/CreateContractScreen.spec.tsx
- src/mobile/screens/ContractDetailScreen.spec.tsx
- src/mobile/screens/AttestationScreen.spec.tsx
- src/mobile/components/CameraModule.spec.tsx
- src/mobile/services/ApiClient.spec.ts
- src/web/app/page.test.tsx
- other directly affected tests only

Known defects to resolve:
1. Tests still expect removed legacy categories and labels.
2. Tests still expect old proof-success copy.
3. Some fixtures still use obsolete camelCase or enriched contract shapes.
4. Existing passing tests do not prove the current live API shape honestly enough.

Do not touch:
- product behavior unless the tests reveal a real defect
- release/legal docs
- payout logic

Required output:
- exact stale assumptions removed
- exact tests updated or added
- test commands run
- any remaining failing spec that reflects a real product defect rather than stale expectations

Exit condition:
The targeted beta-path tests pass and describe the current product truth instead of a removed design.
```

## Prompt 6: Lane 6 Financial Truth Audit

```text
You own `Lane 6 — Financial Truth Audit`.

Mission:
Resolve the remaining payout/unit contradictions before any expansion beyond the current test-money beta.

Start rule:
- do not finalize business-policy math until Jessica’s payout decisions are explicit
- technical audit can start earlier, but policy changes must be clearly marked provisional

Primary files you may edit:
- src/api/src/modules/contracts/dto.ts
- src/api/src/modules/contracts/contracts.service.ts
- src/api/src/modules/payments/settlement-quote.ts
- src/api/src/modules/payments/settlement.service.ts
- src/api/src/modules/payments/settlement.worker.ts
- src/api/src/modules/payments/stripe-fbo.service.ts
- src/api/src/modules/wallet/wallet.controller.ts
- directly related tests only

Primary planning docs:
- docs/planning/planning--financial-logic-map--2026-03-09.md
- docs/planning/planning--payout-math-worksheet--2026-03-09.md
- docs/planning/planning--jessica-briefing-payout-decisions--2026-03-09.md

Do not touch:
- beta surface lockdown
- Apple/TestFlight release ops
- future processor activation work

Required output:
- canonical internal money unit
- canonical failed-settlement formula
- exact drift points removed
- tests/evidence for the invariant
- unresolved policy edge cases still waiting on Jessica

Exit condition:
The codebase has one money unit and one payout rule, both documented and verified.
```

## Prompt 7: Lane 7 Launch Command

```text
You are `Lane 7 — Launch Command`.

Mission:
Track status, blockers, and evidence without swallowing delivery work from the other lanes.

Inputs:
- docs/planning/planning--beta-launch-propulsion--2026-03-09.md
- docs/planning/planning--parallel-remediation-prompts--2026-03-09.md
- docs/planning/planning--release-ops-checklists--2026-03-09.md
- docs/planning/planning--business-blocker-ledger--2026-03-09.md

Responsibilities:
1. Track each lane as `Not started / In progress / Blocked / Done`.
2. Require evidence before calling anything done.
3. Maintain one blocker register with owner, next action, and proof needed.
4. Keep later-phase work out of the beta path.
5. Call out when the beta-readiness artifact is lying or incomplete.

Do not do:
- rewrite another lane’s scope
- silently absorb delivery work
- mark checklist-only work as complete

Required output:
- status line for each lane
- current blockers
- current evidence already secured
- exact go/no-go gaps remaining

Exit condition:
There is one current, evidence-based launch picture and no one is confusing planning artifacts with completed work.
```

## Recommended Assignment Order

Start now:
1. `Lane 1 — Mobile Runtime Reliability`
2. `Lane 2 — Beta Surface Lockdown`
3. `Lane 3 — Proof Boundary Closure`
4. `Lane 4 — Release Ops Evidence`
5. `Lane 7 — Launch Command`

Start after the first wave stabilizes:
6. `Lane 5 — Test Reconciliation`

Start conditionally:
7. `Lane 6 — Financial Truth Audit`
