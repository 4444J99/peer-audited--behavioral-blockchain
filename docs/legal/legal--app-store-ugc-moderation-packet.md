---
artifact_id: L-UGC-01
title: "App Store UGC Moderation Packet — Content Safety and Platform Compliance"
date: "2026-03-09"
version: "0.1.0-draft"
owner: "agent/research-support"
approval_status: "draft"
citation_format: "bluebook"
source_documents:
  - "docs/research/research--bounty-shame-protocol-safety-legality.md"
  - "docs/research/research--app-verification-tech-privacy-law.md"
  - "docs/legal/legal--gatekeeper-compliance.md"
  - "docs/legal/legal--aegis-protocol.md"
linked_issues: [63, 146]
---

# App Store UGC Moderation Packet — Content Safety and Platform Compliance

## 1. Executive Summary

This document defines the minimum content moderation package required for Styx to pass Apple App Store Review and Google Play Policy Review. Styx is a behavioral commitment platform — not a social media app — but it surfaces user-generated content (UGC) in several forms: proof photos and videos for commitment verification, Fury auditor comments and votes, user-created Oath descriptions, and profile information. Each of these content surfaces triggers platform UGC requirements.

The moderation architecture is designed for two gates: **(1) TestFlight / Private Beta** (minimum viable moderation for Apple TestFlight review) and **(2) Public App Store Launch** (full moderation package for general availability). This document specifies what is required at each gate.

---

## 2. Apple App Store Guidelines Analysis (2026)

### 2.1 Guideline 1.1 — Safety / Objectionable Content

Apps must not include content that is offensive, insensitive, upsetting, or intended to disgust. *See* Apple, *App Store Review Guidelines* § 1.1 (2026).

**Styx implication:** Proof photos showing bodies (weigh-in photos, gym selfies, meal photos) must not contain nudity, graphic content, or content that could be characterized as body-shaming. The moderation pipeline must filter for nudity, graphic injury, and potentially offensive body-image content before any proof media is surfaced to other users (Fury auditors).

### 2.2 Guideline 1.2 — User Generated Content

Any app that allows users to create or share content must implement four capabilities:

1. **Filtering mechanism** — a method for filtering objectionable material before it is published.
2. **Reporting mechanism** — a way for users to report offensive content with timely response.
3. **Blocking mechanism** — the ability to block abusive users from further interaction.
4. **Developer contact information** — published and accessible from within the app.

*See id.* § 1.2.

**Styx implication:** All four capabilities must be implemented before any App Store submission, including TestFlight external beta. The filtering mechanism may use automated content moderation (Apple's Vision framework for NSFW detection, or third-party services like Amazon Rekognition or Google Cloud Vision) supplemented by manual review escalation.

### 2.3 Guideline 1.2.1(a) — Age Restrictions

Creator apps must provide age restriction mechanisms based on verified or declared age to limit access by underage users to potentially mature UGC. *See id.* § 1.2.1(a).

**Styx implication:** Styx already requires 18+ age verification for financial commitment participation. *See* `docs/legal/legal--aegis-protocol.md` § 3.1. This same age gate satisfies § 1.2.1(a). The implementation must be enforced at onboarding (date-of-birth entry at minimum for TestFlight; Stripe Identity verification for public launch).

### 2.4 Guideline 2.5.14 — Screen Recording Disclosure

Apps must request user consent and provide a clear visual and/or audible indication whenever recording, logging, or otherwise making a record of user activity. *See id.* § 2.5.14.

**Styx implication:** If Styx implements any form of screen recording for verification (currently Research status), a system-level permissions dialog and visible recording indicator are required. *See* `docs/legal/legal--gatekeeper-compliance.md` § 2.3 (iOS ReplayKit constraints).

### 2.5 Guideline 4.7 — HealthKit

HealthKit bridges must be written in 100% native Swift — no HTML5 wrappers or React Native bridges for health data integration. *See id.* § 4.7.

**Styx implication:** The HealthKit integration module for wearable data sync must be native Swift. Any cross-platform framework used for the main app UI cannot be used for HealthKit data access.

### 2.6 Guideline 5.1.1 — Data Collection and Storage

Apps must only request access to data relevant to core functionality. Users must be able to deny permissions and still use basic app functionality. *See id.* § 5.1.1.

**Styx implication:** Camera access (for proof photos), HealthKit access (for wearable sync), and location access (for geo-verified check-ins) must each be individually optional. A user who denies camera access should still be able to use manual self-report or wearable-based verification.

### 2.7 Guidelines 5.3.3-5.3.4 — Gaming, Gambling, and Lotteries

Apps may not use In-App Purchase (IAP) to buy credit or currency for real-money gaming (§ 5.3.3). Real-money gaming apps must be geo-restricted to licensed jurisdictions and use native iOS code for contest logic (§ 5.3.4). *See id.* §§ 5.3.3-5.3.4.

**Styx implication:** This actually benefits Styx — § 5.3.3 legally justifies using external payment processors (Stripe Connect) for commitment deposits, bypassing the 30% Apple commission. Financial onboarding occurs on the web dashboard (`styx.app`), not in the iOS app. *See* `docs/legal/legal--gatekeeper-compliance.md` § 2.2 (Apple submission strategy).

---

## 3. Google Play Policy Analysis (2026)

### 3.1 User Data Policy — Personal and Sensitive Information

Screen recordings, proof photos, and health data are classified as Personal and Sensitive User Data requiring Prominent Disclosure and Consent. *See* Google, *Developer Program Policies: User Data* (2026). The disclosure must appear during normal app usage, be separate from the privacy policy, explicitly state what data is collected and how it is used, and require an affirmative user action to proceed.

**Styx implication:** A standalone consent flow (not buried in the privacy policy) must be presented before the first proof photo upload, wearable sync, or location check-in. Each data type requires its own disclosure statement.

### 3.2 Bullying and Harassment Policy

Google explicitly prohibits apps that "contain or facilitate threats, harassment, or bullying." *See* Google, *Developer Program Policies: Bullying and Harassment* (2026).

**Styx implication:** The Fury auditor system — where peer auditors verify commitment completion — must not permit personal attacks, public ridicule, body-shaming comments, or targeted harassment. Fury auditor comments must be moderated, and the reporting/blocking mechanisms must specifically address peer-to-peer harassment in the auditing context.

### 3.3 Deceptive Behavior Policy

Apps must not perpetuate misleading or deceptive media. Manipulated imagery or audio requires clear user-facing watermarks. *See id.* (Deceptive Behavior).

**Styx implication:** Proof photos must not be digitally manipulated. The verification pipeline should check for common photo manipulation artifacts (metadata stripping, resolution inconsistencies). Any AI-assisted verification must be transparent to the user.

### 3.4 Developer Verification (September 2026)

Google is tightening developer identity verification. All developer accounts must complete enhanced verification by September 2026. *See id.* (Developer Verification). [COUNSEL: VERIFY CURRENT DEADLINE]

**Styx implication:** Complete Google Play developer verification proactively during the TestFlight beta period — do not wait for Google enforcement.

---

## 4. Styx Content Surface Audit

### 4.1 Proof Photos and Videos

**What:** Users upload photos or videos as evidence of commitment completion (weigh-in photos, gym selfies, meal photos, activity screenshots).

**Visibility:** Visible to assigned Fury auditors only (not publicly surfaced). In group challenges, may be visible to other participants.

**Risk level:** Medium-High. Body photos raise NSFW, body-shaming, and eating disorder content risks.

**Moderation required:** Automated NSFW filtering before auditor visibility. Manual escalation path for flagged content.

### 4.2 Fury Auditor Comments and Votes

**What:** Peer auditors submit approval/rejection votes and optional text comments on proof submissions.

**Visibility:** Visible to the commitment holder and other auditors in the same commitment.

**Risk level:** Medium. Comments could contain personal attacks, body-shaming language, or harassment.

**Moderation required:** Text content filtering (profanity, slurs, body-shaming terms). Report mechanism for abusive auditor behavior.

### 4.3 User-Created Oath Descriptions

**What:** Users write free-text descriptions of their commitments ("I will lose 10 pounds in 8 weeks by running 3x/week and eating under 2000 calories").

**Visibility:** Visible to the user, their assigned auditors, and potentially in anonymized form for platform analytics.

**Risk level:** Low. Primarily functional text, but could contain inappropriate language or dangerous goal descriptions (extreme restriction, unhealthy behaviors).

**Moderation required:** Keyword screening for dangerous goal patterns (extreme caloric restriction, purging references). BMI floor and velocity cap enforcement at the system level. *See* `docs/legal/legal--aegis-protocol.md` §§ 3.2-3.3.

### 4.4 Profile Information

**What:** Display name, profile photo, bio text.

**Visibility:** Visible to auditors and group challenge participants.

**Risk level:** Low. Standard profile content risks (offensive names, inappropriate photos).

**Moderation required:** Standard profile content filtering (offensive language, NSFW images in profile photos).

---

## 5. Moderation Architecture

### 5.1 Content Filtering Pipeline

```
User Upload → Automated Filter → [Pass] → Published
                                → [Flag] → Manual Review Queue → [Approve/Reject]
                                → [Block] → Rejected + User Notified
```

**Automated filtering layer:**
- **NSFW detection:** Apple Vision framework (on-device for iOS) or Amazon Rekognition / Google Cloud Vision (server-side). Threshold: block explicit nudity; flag partial nudity and suggestive content for manual review.
- **Text content filtering:** Keyword/phrase blocklist for slurs, threats, body-shaming language, self-harm references. Regex-based pattern matching supplemented by a managed content moderation service.
- **Dangerous goal detection:** Pattern matching on Oath descriptions for extreme restriction language (e.g., "zero calories," "water fast 30 days," "purge").

### 5.2 Report Mechanism and Response SLAs

**Report flow:**
1. User taps "Report" on any content surface (proof photo, auditor comment, profile).
2. Select report category: Harassment, NSFW Content, Spam, Dangerous Behavior, Other.
3. Optional text description.
4. Report submitted to moderation queue with metadata (reporter ID, content ID, timestamp, category).

**Response SLAs:**
- **Imminent harm** (self-harm references, threats of violence): 1 hour.
- **NSFW / explicit content:** 4 hours.
- **Harassment / bullying:** 24 hours.
- **Spam / other:** 48 hours.

**TestFlight gate:** Report mechanism must be functional. SLAs may be relaxed (24h for all categories acceptable for closed beta with <100 users).

**Public launch gate:** Full SLA enforcement. On-call moderation support during business hours.

### 5.3 User Blocking and Muting

- Users can block any other user, preventing that user from being assigned as their Fury auditor or participating in their group challenges.
- Users can mute notifications from specific auditors without fully blocking.
- Blocked users cannot view the blocker's proof content or profile.
- Blocking is silent — the blocked user is not notified.

### 5.4 CSAM Detection Obligations

Any platform that accepts user-uploaded photos has obligations under 18 U.S.C. § 2258A (mandatory reporting of apparent child sexual abuse material). *See* 18 U.S.C. § 2258A (2008).

**Implementation:**
- Integrate PhotoDNA or equivalent perceptual hash matching against the NCMEC database.
- Any match triggers immediate content removal, account suspension, and mandatory report to the National Center for Missing & Exploited Children ("NCMEC") CyberTipline.
- This obligation exists regardless of app category (Health & Fitness) or user base demographics (18+).

### 5.5 Age-Gating Implementation

**TestFlight (minimum):**
- Date-of-birth entry at onboarding.
- Users declaring age <18 are blocked from account creation.
- No additional verification.

**Public launch (full):**
- Date-of-birth entry at onboarding (first gate).
- Stripe Identity age verification for all users initiating financial commitments (second gate).
- Government ID verification for high-stakes commitments (>$100 deposit) (third gate). [Status: Research]

---

## 6. App Review Submission Notes

The following pre-emptive explanation should accompany all App Store submissions:

### 6.1 For Apple App Review

> **App Description:** Styx is a behavioral commitment platform grounded in behavioral economics research. Users set measurable health and fitness goals, deposit funds into escrow as an accountability mechanism, and earn their deposits back upon verified completion. The platform uses loss aversion — the empirical finding that people are more motivated to avoid losses than to achieve gains — to help users follow through on their health commitments.
>
> **Financial Flow:** All financial transactions (deposits and payouts) occur through the web dashboard (styx.app) via Stripe Connect. The iOS app does not process payments and does not use In-App Purchase for commitment deposits. The app functions as a verification utility — tracking progress, capturing proof media, and displaying commitment status.
>
> **Category:** Health & Fitness. This is not a gaming, gambling, or entertainment app. No random number generation, no house-set odds, no chance-based prize allocation. All outcomes are determined by verified user behavior.
>
> **Content Moderation:** The app implements content filtering, user reporting, user blocking, and published developer contact information per Guideline 1.2. See the "Safety & Moderation" screen in Settings for a walkthrough. Reviewer-facing mockups are collected in `docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`.
>
> **Demo Credentials:** [Provide test account credentials for App Review team]

### 6.2 For Google Play Review

> **Safety Section Declaration:**
> - Data collected: Photos (proof uploads), Health info (wearable sync, weight), Location (optional geo-verified check-ins), Name/email (profile)
> - Data shared: Photos shared with assigned peer auditors only (not publicly)
> - Data not sold to third parties
> - Data deletion: Users can request full data deletion via Settings → Privacy → Delete My Data

Supporting consent and reporting screen mockups: `docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`.

---

## 7. TestFlight vs. Public Launch — Gate Requirements

### 7.1 TestFlight / Private Beta (Gate 1)

| Requirement | Status | Notes |
|---|---|---|
| Age gate (date-of-birth entry) | Required | Self-declaration sufficient for closed beta |
| Content reporting mechanism | Required | Minimum: in-app report button with email notification to team |
| User blocking | Required | Minimum: block from auditor assignment |
| Developer contact information | Required | Email address accessible from Settings |
| NSFW photo filter | Recommended | Can be server-side only for beta |
| Profanity filter on comments | Recommended | Basic keyword blocklist |
| CSAM hash matching | Required | Legal obligation regardless of beta status |
| Moderation response SLAs | Relaxed | 24h for all categories acceptable |
| App Review notes | Required | Include behavioral commitment framing |

### 7.2 Public App Store Launch (Gate 2)

| Requirement | Status | Notes |
|---|---|---|
| All Gate 1 requirements | Required | — |
| Stripe Identity age verification | Required | For all users initiating financial commitments |
| On-device NSFW detection (iOS) | Required | Apple Vision framework |
| Full text moderation pipeline | Required | Keyword + ML-based content classification |
| Dedicated Safety & Moderation screen | Required | Walkthrough-ready for App Review |
| Published Content Guidelines | Required | User-facing document in app and on web |
| Moderation response SLAs (full) | Required | 1h imminent harm, 4h NSFW, 24h harassment |
| PhotoDNA / CSAM detection | Required | NCMEC CyberTipline integration |
| Prominent Disclosure (Google) | Required | Standalone consent flow per data type |

Reviewer-facing mockups for the dedicated safety screen, consent flow, and report mechanism live in `docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`.

---

## 8. Linguistic Cloaker Compliance

The Linguistic Cloaker middleware (`src/middleware/linguistic-cloaker.ts`) performs context-dependent terminology swapping across platform surfaces. *See* `docs/adr/adr--003-linguistic-cloaker.md`.

### 8.1 App Store Metadata Sanitization

All App Store-facing surfaces (app name, subtitle, description, keywords, screenshots, App Review notes) must use sanitized terminology:

| Internal Term | App Store Term |
|---|---|
| Fury / Fury Auditor | Integrity Auditor / Peer Reviewer |
| Oath | Commitment / Goal |
| Styx (mythological framing) | Styx (retained — brand name) |
| Vault | Accountability Fund |
| Stake / Wager | Commitment Deposit |
| Pot / Pool | Completion Reward Fund |

### 8.2 Binary Metadata

iOS binary metadata (Info.plist descriptions, usage strings) must use sanitized terminology. The camera usage description should read "Used to capture proof photos for commitment verification" — not "Used to submit evidence for your Oath."

---

## 9. Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1.0-draft | 2026-03-09 | agent/research-support | Initial draft — 8 sections with Apple/Google policy analysis, content surface audit, moderation architecture, gate requirements |

---

## Table of Authorities

### Statutes and Regulations

- 18 U.S.C. § 2258A (2008) (mandatory reporting of apparent child sexual abuse material)

### Platform Guidelines and Policies

- Apple, *App Store Review Guidelines* §§ 1.1, 1.2, 1.2.1(a), 2.5.14, 4.7, 5.1.1, 5.3.3, 5.3.4 (2026)
- Google, *Developer Program Policies: Bullying and Harassment* (2026)
- Google, *Developer Program Policies: Deceptive Behavior* (2026)
- Google, *Developer Program Policies: User Data* (2026)
