# Phase Beta Legal & Partner Sign-off Pack

**Version:** 1.0.0
**Date:** 2026-09-12
**Status:** ASSEMBLED (Pending Human Legal Review & Signatures)
**Target Phase:** Phase Beta (Real-Money Activation + TestFlight)

## Overview
This pack consolidates the legal artifacts required to advance the Styx platform from "Test-Money Pilot" into the production "Real-Money Phase Beta" environment. It fulfills the deliverables outlined in the Legal Artifact Production Plan (2026-03-09).

## 1. Skill-Based Contest & FBO Escrow Theory (Issues #315, #316)
### Framing for Escrow (FBO) Structure
- **Core Theory:** Styx is a skill-based behavioral commitment system, not a chance-based gambling product. The outcome relies predominantly on the participant's verified effort.
- **Custody Model:** Funds are held in a strictly segregated For Benefit Of (FBO) structure. The platform never takes ownership of user funds in transit; it solely executes automated disbursement based on protocol rules (peer-audited consensus).
- **Counsel Sign-Off Required:** Outside legal counsel must provide an opinion letter affirming that this escrow structure does not classify as an unlicensed money transmitter or illegal lottery under Federal and state laws.

## 2. Cross-Jurisdictional State Geofence Matrix (Issue #317)
### Minimum Consent & Operation Matrix
| Jurisdiction | Geofence Rule | Verification Method Status | Age Requirement |
| ------------ | ------------- | -------------------------- | --------------- |
| **New York** | Fail-Closed | Not permitted (pending CFDL) | 18+ |
| **California**| Fail-Closed | Permitted with explicit CCPA consent | 18+ |
| **Florida** | Fail-Closed | Third-party vendor fallback | 18+ |
| **Texas** | Fail-Closed | Bulk data allowed (state limits apply) | 18+ |
| **Default/Other** | Fail-Closed | Blocked until explicit legal clearance | N/A |

*Action Required: Legal counsel to review and mark jurisdiction caveats.*

## 3. Stripe Production Readiness (Issue #349)
### Real-Money Activation
- **Test-Money:** All transactions currently operate via Stripe test clocks and mock tokens.
- **Production Transition:** Requires strict KYC for monetary users (CIP/KYC via Stripe Identity).
- **Terms & Disclosures:** Mandatory update of Terms of Service (ToS) and Privacy Policy required prior to Live Mode activation. Styx categorization (MCC) must align with the skill-based contest whitepaper.

## 4. Prize Indemnity Insurance (Issue #325)
### Policy Evaluation
- **Risk Profile:** As the protocol relies on user commitments (stakes) and distributes rewards algorithmically, Styx holds liability if peer-auditing fails (e.g., mass false positives draining the reserve).
- **Indemnity Requirements:** The current protocol requires a verified prize indemnity insurance policy to cover edge-case liquidity depletion scenarios up to the defined $10,000 Beta threshold.
- **Action:** Broker evaluation packet attached for underwriter review.

## 5. Apple Developer & TestFlight Operations (Issue #365)
### Minimum Moderation Packet
- **UGC Moderation:** Apple requires an explicit "Report/Block" flow for peer-review submissions (App Store Review Guidelines 1.2).
- **TestFlight Distribution:** Limited to 500 managed users. All App Store review notes, beta test instructions, and UGC moderation policy documentation must be bundled and submitted.
- **Privacy Law Compliance:** HealthKit integration (biometric commitment validation) requires a prominent, standalone Privacy Policy detailing data non-retention.

## Partner Signatures

| Role | Name/Entity | Signature | Date |
| ---- | ----------- | --------- | ---- |
| External Legal Counsel | [To Be Retained] | ________________ | __________ |
| Payment Partner (Stripe) | Platform Review | ________________ | __________ |
| Insurance Broker | [Underwriter] | ________________ | __________ |
| Internal Release Ops | Release Manager | ________________ | __________ |

