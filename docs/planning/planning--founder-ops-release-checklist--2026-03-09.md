# Founder / Ops Release Checklist (2026-03-09)

This is the operator sheet for the remaining non-code release holds.

Use it to answer four questions only:

1. What exactly is the workstream?
2. Does it block the current Phase 1 private beta?
3. What artifact files prove it is done?
4. Who has to hand it over for review?

Current Phase 1 scope remains the one defined in [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md): `iOS`, `TestFlight`, `Test-Money Pilot`, `US allowlist`, `no real-money settlement`.

## Release Gate Table

| Workstream | GitHub issue | Primary owner | Reviewer | Blocks current Phase 1 beta? | Required artifact filenames | Done when |
|---|---|---|---|---|---|---|
| Apple account and TestFlight control | [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | Founder + release ops | Founder | `Yes` | `artifacts/release/evidence--apple-account-owner.md`, `artifacts/release/evidence--app-store-connect-styx-record.png`, `artifacts/release/evidence--signing-chain.md`, `artifacts/release/evidence--testflight-build-processed.png`, `artifacts/release/evidence--testflight-internal-testers.png`, `docs/ops/ops--testflight-release-runbook.md` | A real Styx build is processed in TestFlight and another authorized person can confirm access |
| Minimum moderation and App Review packet | [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) | Jessica + legal/release ops | Founder + legal | `Yes` for external TestFlight with UGC | `docs/legal/legal--app-store-ugc-moderation-packet.md`, `docs/legal/legal--app-review-notes--phase1-beta.md`, `docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`, `artifacts/release/evidence--reporting-flow.png`, `artifacts/release/evidence--moderation-escalation-sla.md`, `artifacts/release/evidence--jessica-legal-signoff.md` | Packet is versioned, screenshots exist, App Review notes are ready, and Jessica/legal sign-off is attached |
| Readiness verification against real beta targets | N/A | Founder + engineering | Founder | `Yes` for formal go/no-go | `artifacts/beta-readiness-summary.json`, `artifacts/release/evidence--beta-targets.md` | `READINESS_REQUIRE_TARGETS=true npm run beta:readiness` returns `overallStatus: "pass"` against real target URLs |
| Skill-based contest whitepaper review bundle | [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | Jessica + outside counsel | Founder + legal | `No` for current private beta; `Yes` for public expansion and durable legal posture | `docs/legal/legal--skill-based-contest-whitepaper.md`, `artifacts/release/evidence--whitepaper-review-request.md`, `artifacts/release/evidence--whitepaper-counsel-signoff.md` | Whitepaper is review-ready, counsel has marked it up, and final sign-off exists |
| Cross-jurisdictional consent matrix | [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148) | Jessica + legal | Founder + product/legal | `No` for current private beta; `Yes` before verification-method expansion | `docs/legal/legal--cross-jurisdictional-consent-matrix.md`, `artifacts/release/evidence--consent-matrix-review-request.md`, `artifacts/release/evidence--consent-matrix-signoff.md` | Matrix is counsel-reviewed and engineering constraints are explicitly derived from it |
| Real-money activation legal brief | [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) | Jessica + business/legal | Founder + legal | `No` for current private beta; `Yes` before any real-money activation | `docs/legal/legal--real-money-activation-brief.md`, `artifacts/release/evidence--real-money-brief-review-request.md`, `artifacts/release/evidence--real-money-brief-signoff.md` | Brief is counsel-reviewed and the real-money activation risk posture is explicit |

## Immediate Completion Instructions

### 1. Apple / TestFlight Control

This is a hard release hold.

Create these files in order:

1. `artifacts/release/evidence--apple-account-owner.md`
   Record:
   - Apple Developer legal entity name
   - Apple ID email controlling the account
   - who controls 2FA
   - who can recover the account if the current holder disappears
2. `artifacts/release/evidence--app-store-connect-styx-record.png`
   Capture the actual App Store Connect `Styx` app record.
3. `artifacts/release/evidence--signing-chain.md`
   Record:
   - distribution certificate present
   - provisioning profile present
   - upload path known
   - who controls the signing secrets
4. `artifacts/release/evidence--testflight-build-processed.png`
   Capture the first processed TestFlight build.
5. `artifacts/release/evidence--testflight-internal-testers.png`
   Capture the internal tester group with named stakeholders.
6. `docs/ops/ops--testflight-release-runbook.md`
   Document:
   - build command
   - archive path
   - upload path
   - how testers are added
   - how to confirm installability

Do not call this complete until a second person verifies they can access the TestFlight build.

### 2. Minimum Moderation / App Review Packet

This is a hard release hold if proof or peer-review content is in the external beta.

Create or finalize these files in order:

1. `docs/legal/legal--app-store-ugc-moderation-packet.md`
   Ensure it clearly states:
   - what content is prohibited
   - what gets auto-flagged
   - what gets manually removed
   - who owns moderation decisions
2. `docs/legal/legal--app-review-notes--phase1-beta.md`
   Keep it short and factual:
   - `Private Beta`
   - `Test-Money Pilot`
   - `US allowlist`
   - what proof content exists
   - how reporting and moderation work
3. `docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`
   Include the reviewer-facing screenshot list.
4. `artifacts/release/evidence--reporting-flow.png`
   Show the in-app report path.
5. `artifacts/release/evidence--moderation-escalation-sla.md`
   Record:
   - who triages reports
   - what the response windows are
   - where incidents are logged
6. `artifacts/release/evidence--jessica-legal-signoff.md`
   One dated memo that says the packet is ready for Apple review.

Do not treat policy prose alone as completion. The screenshots and sign-off memo are required.

### 3. Readiness Against Real Targets

This is a hard release hold for a formal go/no-go call.

Create:

1. `artifacts/release/evidence--beta-targets.md`
   Record:
   - `BETA_API_URL`
   - `BETA_WEB_URL` if used
   - deployment timestamp
   - who approved the target URLs
2. `artifacts/beta-readiness-summary.json`
   Regenerate it with real targets using:

```bash
READINESS_REQUIRE_TARGETS=true npm run beta:readiness
```

Do not treat `incomplete` as launch-ready.

### 4. Legal Framework Review Bundle

This should be ready for review shortly, but it is not the current private-beta release hold unless the beta scope expands.

Prepare this bundle for Jessica and outside counsel:

1. `docs/legal/legal--skill-based-contest-whitepaper.md`
2. `docs/legal/legal--cross-jurisdictional-consent-matrix.md`
3. `docs/legal/legal--real-money-activation-brief.md`
4. `docs/legal/legal--app-store-ugc-moderation-packet.md`
5. `artifacts/release/evidence--whitepaper-review-request.md`

The review request file should include:

- review date requested
- reviewer names
- exact questions for counsel
- what is Phase 1 only
- what is later-phase only
- what product claims must not be made until review is complete

If the legal framework is "ready for review shortly," the minimum acceptable handoff is:

- the four draft files above exist
- each file has date, version, owner, and approval status metadata
- the review request memo exists
- GitHub issues are linked in each file header or intro section

## Owner Split

### Jessica

Own:

- moderation packet sign-off
- whitepaper review request
- consent matrix review request
- real-money brief review request
- outside-counsel coordination

### Founder / Product / Engineering

Own:

- Apple account control evidence
- TestFlight upload evidence
- readiness run against real targets
- release runbook
- in-app screenshots showing reporting/moderation flows

### Outside Counsel

Own:

- whitepaper markup
- consent matrix approval or caveats
- real-money brief legal posture
- final legal sign-off where required

## What Actually Holds Release

For the current Phase 1 private beta, only these should hold the release:

- `#141` Apple / TestFlight control
- `#146` minimum moderation / App Review packet
- readiness against real configured beta targets

These should not be mixed into the same mental bucket for current release:

- full legal-framework durability review
- cross-jurisdictional expansion work
- real-money activation brief
- underwriting and KYC activation work

## Review Cadence

Run this review in order:

1. Confirm Apple/TestFlight evidence exists.
2. Confirm moderation/App Review packet exists.
3. Confirm readiness artifact is a real `pass`.
4. Hand the legal framework bundle to Jessica and counsel.
5. Record which items are release holds and which are parallel legal work.

If an item has no file attached, it is not done.
