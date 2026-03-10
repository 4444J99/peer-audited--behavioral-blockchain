# Partner Atomic Blocker Workbook (2026-03-09)

This workbook is for Jessica. It turns the current partner/shared blocker list into explained, reality-checked work items.

## How To Read This

Use these status classes:

- `Hard now`: blocks the current Phase 1 `Test-Money Pilot` beta.
- `Parallel legal`: should run now, but is not currently encoded as a hard beta-readiness gate.
- `Conditional`: only blocks if Phase 1 scope expands beyond the current contract.
- `Later`: real work, but not part of the current blocker stack.

## Board Integrity Problems

The project board cannot be trusted by itself. Current problems:

- `#132`, `#133`, and `#136` have `2026-12-31` as the project `Target Date` even though their milestone is `Blocked Handoff - Beta Gate (2026-04-30)`.
- `#146` has a project `Target Date` of `2026-09-30` even though its milestone is `Blocked Handoff - Beta Gate (2026-04-30)`.
- `#148` is a real legal blocker issue but did not appear in the current partner/shared blocker export.
- `#146`, `#147`, and `#148` rely on `F-LEGAL-*` naming that is not cleanly represented in the canonical backlog.

Because of that, use this workbook plus the issue bodies, not the board cards, in meetings.

## Summary Table

| Issue | Class | Can defer? | What exists now | What is missing | Jessica scope |
|---|---|---|---|---|---|
| [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | `Hard now` | No | Phase 1 scope explicitly requires iOS/TestFlight beta. Issue exists. | Apple account control, App Store Connect record, signing chain, successful upload, runbook. | Coordinate account ownership, access, and release ops. |
| [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) | `Hard now` | Only the oversized public-launch package can defer | Source requirement exists in [#63](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/63) and research docs. | Minimum moderation policy, report/escalation path, App Review notes, sign-off. | Coordinate legal text, review package, and Apple-facing submission notes. |
| [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | `Parallel legal` | The release-gate encoding can defer; the legal work should not | Canonical feature exists as `F-LEGAL-05`. Issue exists. | Actual whitepaper, counsel sign-off, artifact versioning, release-gate registration. | Retain counsel, define scope, drive draft/review cycle. |
| [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) | `Conditional` | Yes under current Phase 1 scope | Canonical feature exists; issue exists; implementation status says planned. | Vendor choice, DPA, credentials, runtime enforcement. | Only needed now if you intend KYC-active beta or real-money path. |
| [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) | `Conditional` | Yes under current Phase 1 scope | Legal basis exists; issue exists; settlement code exists. | Underwriting, processor terms, custody memo, production merchant path. | Only needed now if you intend real-money activation. |
| [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148) | `Gamma` | Yes for current Beta | Issue exists and points to [#67](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/67). | Counsel-reviewed consent matrix and jurisdiction memo. | Queue with counsel after immediate Beta blockers. |
| [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126) | `Gamma` | Yes for current Beta | Canonical feature exists; no implementation. | API access approvals from Fitbit/WHOOP. | Partnership/API outreach, not Beta-critical today. |
| [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129) | `Later` | Yes | Canonical feature exists; no implementation. | Plaid account, verification, production keys. | Keep in later pipeline only. |
| [#137](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/137) | `Later` | Yes | Canonical feature exists; no implementation. | Insurance provider selection and executed policy. | Keep in later legal pipeline. |
| [#138](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/138) | `Later` | Yes | Canonical feature exists; no implementation. | Apple notice policy, region matrix, product/legal sign-off. | Only relevant once web-shop routing is active. |
| [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139) | `Later` | Yes | Canonical feature exists; no implementation. | Hardware partner pipeline and pilot terms. | Later B2B/partner development. |
| [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140) | `Later` | Yes | Canonical feature exists; no implementation. | Insurance partnership thesis, target list, privacy/commercial terms. | Later B2B strategy, not a launch gate. |
| [#147](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/147) | `Later` | Yes | Issue exists and points to [#90](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/90). | Regulatory memo, partner feasibility memo, approved model. | Later alternative payment rail strategy. |

## Atomic Action Sheets

### `#141` Apple Account and TestFlight Control

What exists now:

- Phase 1 scope says the primary surface is iOS TestFlight beta.
- The blocker issue exists and is correctly classified as external human work.

What is missing:

- Verified Apple Developer account owner.
- Verified App Store Connect admin access.
- Verified certificate/profile ownership.
- Successful TestFlight upload proof.
- Written release runbook.

Jessica action steps:

1. Identify the Apple Developer account legal owner and current admin users.
2. Confirm who can access App Store Connect, Certificates, and TestFlight.
3. Document which email addresses and devices hold the current credentials.
4. Resolve any account ambiguity before any other Apple-side work continues.
5. Require one successful build upload and save evidence.
6. Create a short runbook naming who does uploads, who approves testers, and who owns renewals.

Done when:

- There is a named owner list, a successful TestFlight upload, and a release runbook linked from [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141).

### `#146` App Store UGC Moderation Minimum Package

What exists now:

- The source requirement exists in [#63](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/63).
- Research docs already establish that Apple 1.2 moderation obligations apply.
- The blocked-handoff issue exists, but it is oversized and mixes beta and later launch work.

What is missing:

- Minimum moderation policy text.
- Report / escalation / removal procedure.
- Apple-facing explanation of how proof content is moderated.
- Sign-off from legal and release ops.

Jessica action steps:

1. Split the work mentally into `minimum external beta package` and `later public App Store package`.
2. Draft the minimum moderation policy with four sections:
   allowed content, prohibited content, reporting path, enforcement path.
3. Define who reviews flagged content, how fast they respond, and what actions are available.
4. Prepare App Review notes explaining that proof content is moderated and how users can report abuse.
5. Make legal and release ops approve the same text that appears in product and in App Review notes.

Done when:

- The minimum policy, escalation procedure, and App Review notes exist and are linked from [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146).

### `#136` Skill-Based Contest Whitepaper

What exists now:

- Canonical feature `F-LEGAL-05` exists in the backlog.
- Source legal material exists in the legal and research corpus.
- The issue exists.

What is missing:

- Actual whitepaper artifact.
- Counsel review and signature.
- Version/hash discipline.
- Clear release-gate use of the artifact.

Jessica action steps:

1. Retain outside counsel on a written scope covering the whitepaper and the related state-law questions.
2. Freeze the source corpus that counsel should react to.
3. Decide the output format:
   whitepaper PDF/MD, approval memo, versioning convention.
4. Drive a first draft that states the skill-based theory, jurisdiction approach, and product framing.
5. Route comments through one owner so the legal argument does not fork.
6. Obtain dated counsel sign-off and store the artifact in a stable location.

Done when:

- A versioned whitepaper and dated sign-off exist and are linked from [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136).

### `#132` KYC / Identity Verification

What exists now:

- Canonical feature `F-AEGIS-05` exists.
- Issue exists.
- Implementation status says runtime enforcement is planned, not active.
- Phase 1 scope says KYC runtime enforcement is out of scope.

What is missing:

- Vendor selection.
- DPA and retention terms.
- Provisioned credentials.
- Runtime enforcement in product.

Jessica action steps:

1. Do not treat this as a hard blocker unless Beta scope changes.
2. If scope expands, choose three vendors and compare:
   cost, DPA posture, SDK/API fit, retention controls, jurisdiction handling.
3. Have counsel review the vendor terms and retention model.
4. Decide whether KYC is for real-money only or also for test-money identity assurance.

Done when:

- A provider path, DPA, and implementation handoff package exist and are linked from [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132).

### `#133` Merchant / Processor Underwriting

What exists now:

- Canonical legal basis exists.
- Issue exists.
- Engineering settlement work exists.
- Phase 1 scope still says `Test-Money Pilot`.

What is missing:

- Underwriting submission.
- Processor response.
- Approved production path.
- Custody/FBO memo tied to the provider.

Jessica action steps:

1. Keep this visible, but do not let it displace current TestFlight/App Review work.
2. Only activate this workstream if real-money activation becomes an active scope decision.
3. If activated, prepare the processor application package:
   company framing, product description, legal memo, expected volumes, jurisdiction posture.
4. Route the final framing through counsel before submission.

Done when:

- Underwriting evidence and an approved production path are linked from [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133).

### `#148` Cross-Jurisdictional Consent Matrix

What exists now:

- Issue exists and points to [#67](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/67).
- The research basis exists.

What is missing:

- Canonical backlog anchor.
- Counsel-reviewed matrix artifact.
- Engineering-ready constraints by jurisdiction.

Jessica action steps:

1. Keep this in the next legal wave after the immediate Beta tasks.
2. Ask counsel to produce a simple matrix:
   verification method, jurisdiction, allowed?, consent text, retention note.
3. Require unsupported-jurisdiction fallback behavior to be explicit.

Done when:

- The matrix and implementation memo are linked from [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148).

### `#126` Fitbit / WHOOP API Integration

What exists now:

- Canonical feature exists.
- Issue exists.
- No code exists.

What is missing:

- Developer approvals.
- Commercial/API access path.

Jessica action steps:

1. Keep this out of the Beta blocker stack.
2. Identify whether Fitbit and WHOOP require partnership approval or standard developer onboarding.
3. Capture access requirements, review timelines, and restrictions in one memo.

Done when:

- A platform-access memo or approved developer path is linked from [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126).

### `#129`, `#137`, `#138`, `#139`, `#140`, `#147`

What exists now:

- All are real future issues.
- None appear to be current launch blockers.

Jessica action steps:

1. Do not spend weekly blocker meeting time on these.
2. Keep one later-pipeline review list only.
3. Re-open them when their milestone window becomes active or scope changes.

Done when:

- Each has a dated research memo or partner strategy memo before active execution starts.

## Weekly Meeting Format

Use this order:

1. `#141`
2. `#146`
3. `#136`
4. conditional items only if scope is changing
5. everything else in later review only

If a meeting item does not have a concrete deliverable or artifact, it is not ready for status reporting.
