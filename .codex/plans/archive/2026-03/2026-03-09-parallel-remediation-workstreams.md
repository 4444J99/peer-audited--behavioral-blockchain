# Parallel Remediation Workstreams

Date: 2026-03-09
Repo: `peer-audited--behavioral-blockchain`

## Purpose

Translate the implementation review into non-overlapping execution lanes that can run in parallel without scope bleed.

## Critical Path

1. `Lane 1` Mobile Runtime Reliability
2. `Lane 2` Beta Surface Lockdown
3. `Lane 3` Proof Boundary Closure
4. `Lane 4` Release Ops Evidence
5. `Lane 5` Test Reconciliation
6. `Lane 6` Financial Truth Audit
7. `Lane 7` Launch Command

`Lane 5` starts only after the code-changing lanes land enough changes to stabilize expectations.
`Lane 6` remains parallel research/policy unless Jessica has already answered the payout worksheet.
`Lane 7` owns status, blockers, and evidence only; it does not absorb implementation work.

## Lane 1 — Mobile Runtime Reliability

Owner type: mobile/app engineer

Goal:
Make the actual iOS beta path internally consistent from dashboard -> create contract -> contract detail -> attestation.

Scope:
- `src/mobile/screens/DashboardScreen.tsx`
- `src/mobile/screens/CreateContractScreen.tsx`
- `src/mobile/screens/ContractListScreen.tsx`
- `src/mobile/services/ApiClient.ts`
- Mobile contract/attestation type usage

Do not touch:
- Web surfaces
- Desktop surfaces
- Release docs
- Payment math

Known defects:
- Dashboard assumes `getContracts()` returns `{ contracts: [] }`
- Dashboard reads `category` instead of `oath_category`
- Dashboard expects camelCase attestation fields instead of snake_case

Done when:
- Dashboard, list, create, detail, and attestation all use one response shape
- Manual smoke path works for the Phase 1 beta flow
- Mobile tests covering these paths pass

## Lane 2 — Beta Surface Lockdown

Owner type: web/product-surface engineer

Goal:
Remove or hide anything that violates the narrow Phase 1 beta promise.

Scope:
- `src/web/app/page.tsx`
- `src/web/app/dashboard/page.tsx`
- `src/web/app/layout.tsx`
- Any user-facing navigation or copy exposing non-beta surfaces

Do not touch:
- Mobile contract flow internals
- Desktop operator internals unless visibility is strictly user-facing
- Release checklists
- Finance logic

Known defects:
- Public web landing still sells the broader staking/blockchain product
- Dashboard still exposes admin/internal or non-beta destinations

Done when:
- Public-facing copy matches Phase 1 beta scope
- Non-beta routes are hidden from normal tester-facing entry points
- Surface review shows only approved beta paths

## Lane 3 — Proof Boundary Closure

Owner type: mobile/app engineer

Goal:
Finish the proof-capture decision instead of leaving a half-open preview path.

Scope:
- `src/mobile/components/CameraModule.tsx`
- `src/mobile/screens/ContractDetailScreen.tsx`
- Any mobile proof-capture CTA gating

Do not touch:
- Native camera implementation beyond current beta boundary decision
- Web surfaces
- Release docs

Decision boundary:
- Either hide proof capture from testers entirely, or gate it behind explicit internal/beta-preview controls.

Known defects:
- Camera module is relabeled non-production, but contract detail still shows a tester-visible capture CTA

Done when:
- Proof capture is no longer presented as a normal tester action
- UI and tests agree on the final beta boundary

## Lane 4 — Release Ops Evidence

Owner type: release/program/legal-ops

Goal:
Convert checklist/planning language into evidence-backed launch artifacts.

Scope:
- `docs/planning/planning--release-ops-checklists--2026-03-09.md`
- Beta readiness artifacts
- GitHub issues `#141`, `#146`, `#136`
- App Review, moderation, TestFlight, ownership, and runbook evidence

Do not touch:
- App runtime code except where needed to capture real evidence
- Payout math

Known defects:
- Checklists exist, but artifacts are missing
- Readiness summary currently passes with skipped gates

Done when:
- Each blocker issue has linked evidence
- Readiness artifact reflects real checks, not skipped placeholders
- Apple/TestFlight and moderation packet evidence exists in-repo or linked

## Lane 5 — Test Reconciliation

Owner type: test/QA engineer

Goal:
Bring test expectations back into sync after the beta-scope code changes.

Scope:
- `src/mobile/screens/CreateContractScreen.spec.tsx`
- `src/mobile/components/CameraModule.spec.tsx`
- Any directly affected mobile beta-path specs

Do not touch:
- Product behavior unless the tests reveal an actual regression
- Web or release surfaces

Starts after:
- Lane 1 and Lane 3 land their intended behavior

Known defects:
- Create contract test still expects removed legacy categories
- Camera test still expects old proof success copy

Done when:
- Targeted mobile beta-path tests pass
- Specs assert the current beta contract honestly

## Lane 6 — Financial Truth Audit

Owner type: payments/compliance engineer plus Jessica input

Goal:
Resolve the remaining payout/unit contradictions before any expansion beyond the current test-money beta.

Scope:
- `docs/planning/planning--financial-logic-map--2026-03-09.md`
- Payments/settlement logic
- Payout worksheet decisions

Do not touch:
- Beta surface cuts
- Apple/TestFlight ops

Starts when:
- Jessica answers the payout worksheet, or engineering explicitly chooses to do the technical audit first and hold policy finalization separate

Done when:
- One canonical money-unit rule exists
- One canonical failed-settlement formula exists
- The resulting policy is reflected in code/tests/docs consistently

## Lane 7 — Launch Command

Owner type: technical program owner

Goal:
Track blockers, evidence, and go/no-go truth without swallowing delivery work.

Scope:
- Cross-lane status
- Blocker register
- Evidence register
- Beta readiness call

Do not touch:
- Direct implementation inside other lanes unless reassigned

Rules:
- No item is marked done without evidence
- No later-phase scope is pulled into the beta path
- No blocker is closed because a checklist exists

Done when:
- There is one live view of `owner / status / blocker / proof`
- Remaining launch gaps are explicit and current

## Recommended Start Order

Immediate:
1. `Lane 1` Mobile Runtime Reliability
2. `Lane 2` Beta Surface Lockdown
3. `Lane 3` Proof Boundary Closure
4. `Lane 4` Release Ops Evidence
5. `Lane 7` Launch Command

Second wave:
6. `Lane 5` Test Reconciliation

Conditional:
7. `Lane 6` Financial Truth Audit

## Fast Assignment Summary

- One mobile engineer: `Lane 1`
- One web/product-surface engineer: `Lane 2`
- One mobile/beta-boundary engineer: `Lane 3`
- One release/legal-ops owner: `Lane 4`
- One QA owner: `Lane 5`
- One payments/compliance owner plus Jessica: `Lane 6`
- One program owner: `Lane 7`
