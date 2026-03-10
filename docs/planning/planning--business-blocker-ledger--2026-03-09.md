# Business Blocker Ledger (2026-03-09)

This is the partner-facing list of what actually stops progress. It excludes speculative roadmap items and engineering detail that do not currently require business, legal, or platform action.

## What Counts As A Real Blocker

A blocker is real only if all three are true:

1. If unresolved, it prevents Beta progress or a Beta go/no-go decision.
2. It requires human action outside normal coding work.
3. It has a clear completion artifact.

If an item is merely useful, strategic, or post-Beta, it is not a current blocker.

## Current Concrete Business Blockers

| Priority | Blocker | Why it concretely stops us | Primary owner | Immediate next human action | Evidence required to mark complete | Source chain |
|---|---|---|---|---|---|---|
| `P0` | Apple account and TestFlight control | Phase 1 is explicitly iOS/TestFlight-first. If the Apple-side account, signing, and TestFlight path are not controlled, we cannot distribute the beta. | `H:RO` + `H:FO` | Confirm who owns the Apple Developer account, who controls App Store Connect, and who can upload builds. | Apple account ownership record, App Store Connect app record, working signing setup, successful TestFlight upload, release runbook. | [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141), [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md), [planning--truth-chain-map--2026-03-09.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--truth-chain-map--2026-03-09.md) |
| `P0` | App Store UGC moderation minimum package | The product includes user-submitted proof content. Without a minimum moderation policy and App Review package, external TestFlight/App Review risk remains high. | `H:LC` + `H:RO` | Draft the minimum moderation policy, define removal/escalation flow, and package App Review notes/screenshots. | Versioned moderation policy, escalation procedure, App Review package, sign-off from legal and release ops. | [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146), [#63](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/63), [planning--truth-chain-map--2026-03-09.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--truth-chain-map--2026-03-09.md) |

## Parallel Foundational Legal Work

These do not appear to be encoded as hard readiness gates for the current `Test-Money Pilot`, but they are still important legal workstreams that should run in parallel:

| Priority | Workstream | Why it matters | Primary owner | Evidence required |
|---|---|---|---|---|
| `Parallel-Legal` | Counsel-backed legal framing | Needed for durable legal posture, processor conversations, and later release gates, even if it is not the current TestFlight gate. | `H:LC` | Versioned whitepaper, signed approval memo, artifact hash/version, release-gate reference |
## What Is Not A Current Business Blocker

These items may matter later, but they should not occupy the same mental slot as the blocker stack above:

- Insurance partnerships, including [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140)
- Hardware partnerships, including [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139)
- Plaid and broader banking integrations, including [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129)
- Later-phase crypto or cryptographic infrastructure blockers

These belong in later-pipeline review, not in the active Beta blocker discussion.

## Conditional Blockers If Scope Expands Beyond Current Phase 1

These items are real, but they do not block the currently defined `Test-Money Pilot` beta in [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md). They become blockers only if you decide to expand Phase 1 into a real-money or KYC-active launch.

| Priority | Conditional blocker | What it blocks | Primary owner | Evidence required |
|---|---|---|---|---|
| `P0-if-scope-expands` | KYC vendor path | KYC-active or real-money launch posture | `H:LC` + `H:BD` | Signed vendor path, DPA, retention/jurisdiction memo, provisioned credentials |
| `P0-if-scope-expands` | Merchant / processor underwriting | Real-money settlement activation | `H:BD` + `H:LC` | Submitted application, underwriting response, approved terms, custody/FBO memo, production provider path |

Keep these visible, but do not let them consume the same attention as the immediate TestFlight / App Review stack unless the Phase 1 contract changes.

## Meeting Script

Use this framing in partner meetings:

- `What is actually stopping us this week?`
- `Who has to act?`
- `What artifact proves it is done?`

If an item does not produce a concrete artifact, it should not be described as closed.

## Closure Rule

A blocker should move to done only when the completion artifact exists and is linked from the issue.

Examples:

- not "merchant path discussed"
- yes "merchant application submitted and underwriting response received"

- not "legal framing underway"
- yes "whitepaper file exists with counsel sign-off"

- not "Apple setup in progress"
- yes "build uploaded to TestFlight successfully"
