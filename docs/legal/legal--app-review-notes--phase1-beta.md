---
artifact_id: L-APPREVIEW-01
title: "App Review Notes — Phase 1 Private Beta"
date: "2026-03-09"
version: "0.1.0-draft"
owner: "agent/research-support"
approval_status: "draft"
linked_issues: [141, 146]
---

# App Review Notes — Phase 1 Private Beta

These notes are the Apple-facing summary for the current beta scope only.

## Submission Summary

- Product: `Styx`
- Release mode: `Private Beta`
- Distribution mode: `External TestFlight`
- Scope: `iOS`, `US allowlist`, `Test-Money Pilot`
- Financial posture: no in-app real-money settlement, no Apple IAP for commitment deposits
- iOS bundle identifier: `com.styxprotocol.app`

## Reviewer Notes

Styx is a behavioral accountability application for no-contact recovery and other structured commitments. The current Phase 1 beta is a limited `Test-Money Pilot`, not a real-money launch. The app does not offer casino-style play, random outcomes, or house-set odds.

User-generated content in this beta is limited and controlled. Users may submit proof content for commitment verification, and the app includes moderation/reporting controls plus documented escalation procedures. Supporting moderation materials are included in:

- `docs/legal/legal--app-store-ugc-moderation-packet.md`
- `docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`
- `artifacts/release/evidence--reporting-flow.png`
- `artifacts/release/evidence--moderation-escalation-sla.md`

Financial onboarding and any account setup that touches payment rails occur outside the App Store purchase flow. This beta should be reviewed as a private accountability and verification utility, not as a gaming or wagering app.

Current repo-aligned compliance notice exposed by the mobile bootstrap API:

> Private beta access is limited to invited US allowlist participants. Identity/KYC flows remain non-production in this pilot.

## Reviewer Access Fields

Fill before submission:

- demo account username:
- demo account password:
- internal test instructions:
- special review notes:

## Completion Rule

Do not treat this file as final until Jessica/legal review it against the moderation packet and current in-app behavior.
