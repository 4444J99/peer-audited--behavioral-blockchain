# Truth Chain Map (2026-03-09)

This document defines the actual source-of-truth chain for the current Beta blocker stack. It exists because the project board, planning documents, and issue layer currently contain drift.

## Truth Precedence

Use this order when deciding what is true:

1. **Original source docs**
   Research, legal, architecture, and scope documents define the original requirement or constraint.
2. **Canonical extracted requirement**
   [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) is the canonical feature register when an `F-*` entry exists.
3. **Executable implementation truth**
   Code, tests, migrations, and [planning--implementation-status.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--implementation-status.md) determine whether a runtime control actually exists.
4. **Execution planning**
   Research tickets, timeline docs, and calendars explain how work is intended to be delivered.
5. **External human blocker truth**
   GitHub blocked-handoff issues define what still requires legal, vendor, platform, or partnership action.
6. **Board presentation**
   The GitHub project board is a filtered dashboard only. It is never the canonical source.

## Chain Format

Each blocker should be traceable as:

`source document(s) -> feature or requirement ID -> execution ticket -> blocked-handoff issue -> evidence artifact(s) -> board card`

If any link is missing, the blocker is not fully grounded.

## Beta Blocker Chain

| Blocker | Root source | Canonical feature or requirement | Execution ticket / plan | External blocker issue | Implementation truth | Evidence required for actual truth | Current trust state |
|---|---|---|---|---|---|---|---|
| Native proof capture | `architecture--feasibility-stack.md` §S4.2, `planning--phase1-private-beta-scope.md` | `F-MOBILE-01` in [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) | `TKT-P0-002` in [planning--research-ticket-pack--2026-03-04.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--research-ticket-pack--2026-03-04.md) | [#123](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/123) | Backlog says `STUB`; placeholder mobile screens exist; native module not delivered | Native camera module working on device, gallery disabled, nonce proof path, device test evidence | Chain is mostly intact |
| KYC / identity verification | `legal--aegis-protocol.md`, `legal--compliance-guardrails.md` §4.D, `planning--implementation-status.md` | `F-AEGIS-05` in [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) | `TKT-P0-003` in [planning--research-ticket-pack--2026-03-04.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--research-ticket-pack--2026-03-04.md) | [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) | [planning--implementation-status.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--implementation-status.md) says runtime enforcement is `Planned`; service stubs/spec files exist, but enforcement is not live | Signed vendor agreement, DPA, API credentials, retention/jurisdiction memo, tested runtime gating | Drift: backlog says `Phase2+ / P2`, ticket/issue treat it as Beta-critical |
| Merchant account / production settlement | `legal--gatekeeper-compliance.md`, `legal--performance-wagering.md`, `legal--aegis-protocol.md` | `F-INFRA-01` plus dependency from `F-CORE-04` in [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) | `TKT-P0-001` in [planning--research-ticket-pack--2026-03-04.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--research-ticket-pack--2026-03-04.md) | [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) | Settlement code exists and is being hardened, but [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md) still defines Phase 1 as `Test-Money Pilot` | Merchant application, underwriting approval, processor terms approval, custody/FBO memo, live provider credentials | Conditional blocker: blocks real-money activation, but not the current test-money beta unless scope changes |
| Skill-based contest whitepaper | `legal--performance-wagering.md`, `research--prediction-markets-regulation-finance.md` §Dominant Factor Test | `F-LEGAL-05` in [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) | `TKT-P1-019` in [planning--research-ticket-pack--2026-03-04.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--research-ticket-pack--2026-03-04.md) | [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | No implementation artifact yet; ticket proposes future compliance-artifact registration and release gate | Counsel-reviewed whitepaper, dated sign-off, stored artifact hash/version, release checklist linkage | Major drift: feature is Beta, issue is due 2026-04-30, but timeline schedules `TKT-P1-019` for Oct-Nov 2026 |
| iOS distribution ops | [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md), [planning--beta-readiness-contract.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--beta-readiness-contract.md), `src/mobile/README.md` | No `F-*` feature exists; this is an operational gate, not a product feature | Timeline/calendar entries only; no canonical `TKT-*` found | [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | Repo defines iOS/TestFlight as the primary Phase 1 surface, but there is no canonical operational artifact schema for account ownership, provisioning, or upload proof | Apple Developer account ownership proof, App Store Connect app record, signing credentials, TestFlight upload proof, runbook | Chain gap: operational gate exists, but it is not anchored to a canonical feature/ticket artifact model |
| App Store UGC moderation package | `research--bounty-shame-protocol-safety-legality.md`, `research--app-verification-tech-privacy-law.md` | No canonical `F-*` entry exists in [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md); origin requirement is GitHub [#63](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/63) | No canonical `TKT-*` found | [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) | Moderation requirement exists as an issue and research conclusion, but is not registered in the feature backlog | Moderation policy, escalation/takedown procedure, App Review notes/screenshots, signed legal/release-ops approval | Chain gap: `#146` is labeled `F-LEGAL-09`, but `F-LEGAL-09` does not exist in the backlog |

## What Counts As Actual Truth

No blocker should be marked complete from planning statements alone. Completion requires one of these evidence classes:

- **Repo artifact**
  A versioned document, policy, ADR, or checklist stored in-repo.
- **Runtime artifact**
  Code path, test, migration, or generated machine artifact proving the control exists.
- **External artifact**
  Executed agreement, approval email, provisioned account, vendor credential handoff, or counsel memo.

For the current Beta blockers, truth is not "we discussed it." Truth is:

- `#123`: native camera demo and tests
- `#132`: signed KYC vendor path and runtime enforcement evidence
- `#133`: merchant approval and lawful settlement path evidence
- `#136`: whitepaper file plus signed counsel approval
- `#141`: TestFlight upload proof and release runbook
- `#146`: App Review-ready moderation package and sign-off

## Drift Register

### `#133` Merchant Path Drift

- [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) marks `F-INFRA-01` as `IMPLEMENTED`.
- [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) says the merchant path is still blocked.
- [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md) still says Phase 1 is `Test-Money Pilot`.

Conclusion: business-process completion, live real-money readiness, and current test-money beta scope are being conflated. `#133` should be treated as a real-money activation blocker unless Phase 1 scope is expanded.

### `#132` KYC Priority Drift

- [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) lists `F-AEGIS-05` as `Phase2+ / P2`.
- [planning--research-ticket-pack--2026-03-04.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--research-ticket-pack--2026-03-04.md) promotes it to `TKT-P0-003`.
- [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) treats it as a Beta blocker.

Conclusion: the canonical feature register has not been updated to match the current launch posture.

### `#136` Whitepaper Scheduling Drift

- [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) says `F-LEGAL-05` is Beta.
- [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) is due 2026-04-30.
- [planning--timeline-with-owners--2026-03-06.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--timeline-with-owners--2026-03-06.md) schedules `TKT-P1-019` for Oct-Nov 2026.

Conclusion: either the issue due date or the timeline ticket date is wrong.

### `#141` Operational Chain Gap

- Phase 1 scope makes TestFlight the primary surface.
- [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) exists as a blocker.
- No canonical `F-*` or `TKT-*` anchor was found for release-ops provisioning.

Conclusion: a real launch gate exists without a canonical requirement ID.

### `#146` Missing Feature Gap

- [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) is labeled `F-LEGAL-09`.
- [FEATURE-BACKLOG.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/FEATURE-BACKLOG.md) has no `F-LEGAL-09`.
- The actual source requirement currently lives in GitHub [#63](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/63) plus the two research docs.

Conclusion: this blocker is not yet registered in the canonical feature backlog.

## Operating Rule Going Forward

For every concrete blocker, maintain all six links:

1. source doc
2. canonical feature or requirement ID
3. execution ticket or explicit "no ticket" decision
4. blocked-handoff issue
5. evidence artifact
6. board card

If link 2 or link 5 is missing, the item is not safe to treat as settled.
