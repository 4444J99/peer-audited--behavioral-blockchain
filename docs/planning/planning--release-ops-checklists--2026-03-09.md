# Styx Release Ops & Policy Checklists (2026-03-09)

This document provides the concrete artifact checklists and parallel plans required to close the non-dev blockers for the Phase 1 Beta launch.

## 1. Artifact Checklist: #141 Apple / TestFlight Control
*Objective: Prove ownership and control of the iOS distribution chain.*

- [ ] **Apple Developer Account ownership record**: Documented email/entity owning the primary account.
- [ ] **App Store Connect App Record**: Screen confirmation of the "Styx" app record existing in ASC.
- [ ] **Signing Chain Evidence**: 
    - [ ] Distribution Certificate provisioned.
    - [ ] App Store Provisioning Profile created.
    - [ ] CI/CD secrets configured with \`MATCH_PASSWORD\`, \`FASTLANE_USER\`, etc.
- [ ] **Successful TestFlight Upload**: Record of at least one build (e.g., v0.1.0) successfully processed in TestFlight.
- [ ] **Internal Tester Group**: Confirmation that internal stakeholders are added to the "Styx Beta" TestFlight group.
- [ ] **Release Runbook**: A 1-page MD file in the repo describing the path from \`git tag\` to TestFlight distribution.

## 2. Artifact Checklist: #146 Minimum Moderation & App Review Packet
*Objective: Satisfy Apple safety requirements for user-generated proof content.*

- [ ] **Moderation Policy Document**: Versioned MD file in the repo defining what content is prohibited.
- [ ] **Reporting Flow Evidence**: UX screenshots showing where/how a user can report inappropriate proof.
- [ ] **Escalation/Removal Procedure**: Internal doc defining the SLA for removing reported content (e.g., 24h).
- [ ] **App Review Notes**: Prepared text for the "App Review Information" section in ASC describing the peer-review (Fury) system.
- [ ] **Legal/Release Sign-off**: Signed approval memo from Jessica/Legal confirming the packet is ready for Apple submission.

## 3. Parallel Plan: #136 Skill-Based Contest Whitepaper
*Objective: Establish durable legal framing while the Beta launch proceeds.*

- **Phase A (Now): Source Assembly**
    - Gather existing memos from \`docs/legal/legal--performance-wagering.md\` and \`docs/legal/legal--aegis-protocol.md\`.
    - Map the Dominant Factor Test criteria to the "Skill-based Behavioral Commitment" model.
- **Phase B (Week of March 16): Counsel Engagement**
    - Hand off the assembly to outside counsel for formal drafting.
    - Focus on the "Test-Money Pilot" framing first to minimize immediate liability.
- **Phase C (Week of March 23): Review & Finalization**
    - Review counsel draft against in-app UX terms.
    - Produce the final MD/PDF whitepaper for the repo.
    - **Note**: This does not block TestFlight upload, but must be complete before public Beta expansion.

## 4. Release Go/No-Go Evidence List
*Status of required launch artifacts:*

| Artifact | Required For | Status |
|---|---|---|
| Apple Admin Access | #141 | [ ] |
| Signing Identity | #141 | [ ] |
| Moderation Policy | #146 | [ ] |
| App Review Notes | #146 | [ ] |
| TestFlight Build Proof | #141 | [ ] |
| Readiness Artifact | Readiness | [ ] |

---
*Generated for WS5 Release Ops and Policy workstream.*
