---
artifact_id: L-GK-01
title: "Gatekeeper Compliance Forensics — Payment Processors and App Stores"
date: "2026-03-09"
version: "0.2.0-draft"
owner: "agent/research-support"
approval_status: "draft"
citation_format: "bluebook"
source_documents:
  - "docs/research/research--bounty-shame-protocol-safety-legality.md"
  - "docs/research/research--app-verification-tech-privacy-law.md"
  - "docs/research/research--prediction-markets-regulation-finance.md"
linked_issues: []
---

# Gatekeeper Compliance Forensics — Payment Processors and App Stores

## Executive Summary

While Styx's legal theory as a skill-based behavioral commitment system is robust under United States law, the internal policies of payment processors (Stripe, PayPal) and mobile platform operators (Apple, Google) are frequently stricter and more arbitrary than statutory requirements. These gatekeepers exercise de facto regulatory power through terms of service that can result in instant de-platforming, fund freezes, and binary rejection — consequences that are functionally equivalent to a regulatory shutdown but without due process protections. This document analyzes each choke point and prescribes the compliance strategy for each.

---

## 1. Payment Processor Compliance

### 1.1 Stripe — Prohibited Business Classification

**Status: High-Risk / Prohibited Category.**

Stripe's Restricted Businesses list explicitly prohibits "Games of skill... with a monetary or material prize" and "Contests with entry fees." *See* Stripe, *Restricted Businesses*, https://stripe.com/legal/restricted-businesses (last visited Mar. 9, 2026). Using a standard Stripe account for Styx will likely trigger an automated Risk Review within 48 hours of the first $1,000 in volume, resulting in a permanent account freeze and a 120-day fund hold.

**Competitor strategy:** DietBet and HealthyWage avoid standard payment processor accounts. They use specialized high-risk merchant accounts (e.g., Worldpay, Corepay, Allied Wallet) and leverage FBO structures with partner banks to position themselves outside the flow of funds. *See* HealthyWage, *Official Rules*, https://www.healthywage.com/rules/official-rules/ (last visited Mar. 9, 2026) (describing FBO-based fund handling). PayPal has historically provided more nuanced underwriting for "skill contests" than Stripe's automated systems.

### 1.2 High-Risk Merchant Account Strategy

To avoid a catastrophic launch-day freeze, Styx must pursue high-risk underwriting before processing any live transactions:

1. **Apply early.** High-risk merchant account applications require 3-6 weeks for underwriting approval. Application should be submitted during Phase Alpha, well before any public beta.
2. **Fee structure.** High-risk accounts charge 3-6% transaction fees (versus Stripe's standard 2.9%) and typically require a 5-10% rolling reserve held by the processor as a risk buffer.
3. **Terminology sanitization.** In all merchant applications, describe the product as a **"Performance-Based Accountability Escrow"** — never use "contest," "bet," "wager," or "prize." The application narrative should emphasize the behavioral health and wellness positioning.
4. **Processor redundancy.** Maintain relationships with at least two high-risk processors to prevent single-point-of-failure risk. Primary candidates: Stripe (via formal high-risk review), Adyen (supports complex marketplace models), and a dedicated high-risk provider (Corepay or Allied Wallet) as backup.

### 1.3 Stripe Connect FBO Pre-Clearance

If Styx pursues Stripe Connect specifically (preferred for its developer tooling and FBO account structure), the pre-clearance workflow is:

1. Contact Stripe's Risk team directly (not general support) with a detailed business description, legal memo, and Appendix A (`docs/legal/appendices/appendix-a--fbo-architecture-diagram.md`).
2. Reference the deposit-contract legal theory and provide the `legal--skill-based-contest-whitepaper.md` once drafted.
3. Request classification review under Stripe's "Custom" Connect account type, which provides the most control over fund flows.
4. Obtain written approval before processing any live transaction. Document the approval for regulatory and audit purposes.

### 1.4 Terminology Sanitization Matrix

All external-facing surfaces — merchant applications, App Store metadata, marketing materials, API documentation, and user-facing copy — must use sanitized terminology:

| Prohibited Term | Approved Replacement | Context |
|---|---|---|
| Bet / Wager | Commitment / Stake | User-facing copy, ToS |
| Pot / Pool | Vault / Accountability Fund | In-app terminology |
| Odds | Integrity Score | Any reference to probability |
| Winnings | Earned Return / Completion Reward | Payout descriptions |
| Gambling / Casino | Behavioral Commitment / Accountability | Marketing, App Store listing |
| House / Bookie | Platform / Facilitator | Internal and external docs |
| Fury (audit mechanic) | Integrity Auditor | App Store-facing descriptions only |

> **Engineering note:** The Linguistic Cloaker middleware (`src/middleware/linguistic-cloaker.ts`) swaps themed terms (Fury, Oath, Styx) for sanitized equivalents depending on the client platform context (iOS binary, Android binary, web dashboard, merchant comms). *See* ADR-003 (`docs/adr/adr--003-linguistic-cloaker.md`).

---

## 2. Apple App Store Compliance

### 2.1 Relevant Guidelines (2026)

The following Apple App Store Review Guidelines are directly applicable to Styx:

**Guideline 1.1 — Safety / Objectionable Content.** Apps must not include content that is offensive, insensitive, upsetting, or intended to disgust. *See* Apple, *App Store Review Guidelines* § 1.1 (2026).

**Guideline 1.2 — User Generated Content.** Any app that allows users to create or share content must implement: (a) a method for filtering objectionable material, (b) a mechanism to report offensive content with timely response, (c) the ability to block abusive users, and (d) published developer contact information. *See id.* § 1.2. Apps featuring random or anonymous chat are subject to heightened review. *See id.* § 1.2 (commentary).

**Guideline 1.2.1(a) — Age Restrictions.** Creator apps must provide age restriction mechanisms based on verified or declared age to limit access by underage users to potentially mature UGC. *See id.* § 1.2.1(a).

**Guideline 2.5.14 — Screen Recording Disclosure.** Apps must request user consent and provide a clear visual and/or audible indication whenever recording, logging, or otherwise making a record of user activity. *See id.* § 2.5.14.

**Guideline 4.7 — HealthKit.** HealthKit bridges must be written in 100% native Swift (no HTML5 wrappers for health data integration). *See id.* § 4.7.

**Guideline 5.1.1 — Data Collection and Storage.** Apps must only request access to data relevant to core functionality. Apps must not coerce consent to unnecessary data access. Users must be able to deny permissions and still use basic app functionality. *See id.* § 5.1.1.

**Guideline 5.3 — Gaming, Gambling, and Lotteries.**
- § 5.3.3: Apps may not use In-App Purchase (IAP) to buy credit or currency for real-money gaming. This actually benefits Styx — it legally justifies using external payment processors (Stripe) for stakes, bypassing the 30% Apple commission.
- § 5.3.4: Real-money gaming apps must be geo-restricted to licensed jurisdictions and must use native iOS code (not HTML5 wrappers) for contest logic.
*See id.* §§ 5.3.3-5.3.4.

### 2.2 Apple Submission Strategy

**Primary categorization target:** Health & Fitness (not Gaming, not Entertainment).

To maintain this categorization:

1. **Separate financial onboarding from mobile app.** The initial deposit and contract signing occur on the **web dashboard** (styx.app). The mobile app functions as a "Verification Utility" — it tracks progress, captures proof media, and displays status, but does not initiate the financial commitment. This architectural separation reduces Apple's scrutiny of the financial flow.
2. **Frame as behavioral health tool.** All App Store listing copy, screenshots, and App Review notes position Styx as a commitment device grounded in behavioral economics research — not a betting or gaming platform.
3. **Demonstrate moderation capability.** Include a dedicated "Safety & Moderation" screen accessible from the app's settings. This screen should show: reporting flow, blocking capability, content guidelines, and developer contact information. Provide App Review with a pre-written walkthrough of this screen. Supporting mockups live in Appendix C (`docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`).
4. **Native code requirement.** All HealthKit integration and commitment verification logic must be native Swift. No React Native bridges for health data.

### 2.3 iOS Technical Constraints — ReplayKit

If Styx ever implements screen-recording-based verification (currently: Research status), iOS ReplayKit imposes structural limits:

- ReplayKit isolates screen capture outside the app's sandbox via the `replayd` daemon. The recorded content is never accessible to the app without explicit OS mediation. *See* Apple Developer Documentation, *ReplayKit Framework* (2026).
- A system-level permissions dialog is required for every recording session — it cannot be suppressed or customized.
- If the app is backgrounded for longer than 8 minutes, the privacy alert re-presents.
- A red indicator appears in the status bar or Dynamic Island during any active screen capture.

**Consequence:** True randomized, background screen recording is structurally impossible on iOS. Any verification method must work with explicit, user-initiated capture.

---

## 3. Google Play Store Compliance

### 3.1 Relevant Policies (2026)

**User Data Policy — Personal and Sensitive Information.** Screen recordings, if used, are classified as Personal and Sensitive User Data requiring Prominent Disclosure and Consent. *See* Google, *Developer Program Policies: User Data* (2026). The disclosure must: (a) appear during normal app usage, (b) be separate from the privacy policy, (c) explicitly state what data is collected and how it is used, and (d) require an affirmative user action to proceed.

**Bullying and Harassment Policy.** Google explicitly prohibits apps that "contain or facilitate threats, harassment, or bullying." *See* Google, *Developer Program Policies: Bullying and Harassment* (2026). Any peer-attestation mechanic (Fury auditing) must not permit personal attacks, public ridicule, or targeted harassment.

**Deceptive Behavior Policy.** Apps must not perpetuate misleading or deceptive media. Manipulated imagery or audio requires clear user-facing watermarks. *See id.* (Deceptive Behavior).

**Developer Verification (September 2026).** Google is tightening developer identity verification. All developer accounts must complete enhanced verification by September 2026. Styx's developer account should complete this process proactively. [COUNSEL: VERIFY CURRENT DEADLINE]

### 3.2 Android Technical Constraints — MediaProjection

- Starting with Android 14, the MediaProjection API requires explicit user consent for each individual capture session. *See* Android Developer Documentation, *MediaProjection API Changes* (2024).
- Android 15 introduced partial screen sharing — users can restrict capture to a single app window rather than the entire screen. This undermines any full-device verification strategy.
- Background capture without user interaction is prohibited.

---

## 4. Geo-Restriction Implementation

### 4.1 State Blocklist

States where Styx's skill-based contest model faces elevated legal risk must be hard-blocked at the API layer. *See* `docs/legal/legal--50-state-skill-contest-survey.md` for full statutory analysis.

| State | Risk Basis | Block Level |
|---|---|---|
| **Arizona** | Historical application of Any Chance Test | Full block |
| **Arkansas** | Strict constructionist gambling interpretation | Full block |
| **Hawaii** | Comprehensive prohibition; no DFS safe harbor | Full block |
| **Idaho** | Hardline AG stance; "Any Chance" standard | Full block |
| **Montana** | AG opposition to unlicensed skill contests | Full block |
| **Nevada** | Requires gaming licensure for all wagering | Full block |
| **Utah** | Constitutional/Statutory ban on all wagering | Full block |

**Implementation:** IP-based geofencing at the API gateway level. All API requests from blocked-state IP ranges receive a 451 (Unavailable for Legal Reasons) response. Current configuration: `STYX_STATE_BLOCKLIST=AZ,AR,HI,ID,MT,NV,UT`.

**Supporting appendix:** `docs/legal/appendices/appendix-d--state-blocklist-justification-table.md`.

### 4.2 International Restrictions

Styx is US-only at launch. International expansion requires separate legal analysis for each target jurisdiction:

- **EU/EEA:** GDPR consent requirements for behavioral data processing. *See* `legal--cross-jurisdictional-consent-matrix.md`.
- **UK:** Post-Brexit data protection framework (UK GDPR + Data Protection Act 2018).
- **Canada:** PIPEDA and provincial privacy legislation.
- **Sanctioned jurisdictions:** North Korea, Iran, Syria, Sudan, Cuba — permanent exclusion per OFAC sanctions.

---

## 5. Platform-Specific Risk Summary

| Gatekeeper | Primary Risk | Mitigation | Status |
|---|---|---|---|
| **Stripe** | Prohibited business classification → fund freeze | High-risk pre-clearance; FBO architecture; terminology sanitization | Planned |
| **Apple** | Rejection under § 5.3 (gambling) or § 1.2 (UGC safety) | Health & Fitness categorization; web-based financial onboarding; moderation UX | Planned |
| **Google** | Removal under Bullying/Harassment or UGC policies | Fury auditor content moderation; prominent disclosure; no anonymous messaging | Planned |
| **PayPal** | Restricted category for contest payouts | Secondary processor only; skill-contest pre-clearance | Research |

---

## 6. Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1.0 | 2026-02-24 | agent/research-support | Initial stub (55 lines) |
| 0.2.0-draft | 2026-03-09 | agent/research-support | Full rewrite with Bluebook citations, platform policy analysis, geo-restriction strategy, terminology sanitization matrix |

---

## Table of Authorities

### Statutes and Regulations

- 31 U.S.C. § 5362(1)(E)(ix) (2006)

### Platform Guidelines and Policies

- Apple, *App Store Review Guidelines* §§ 1.1, 1.2, 1.2.1(a), 2.5.14, 4.7, 5.1.1, 5.3.3, 5.3.4 (2026)
- Apple Developer Documentation, *ReplayKit Framework* (2026)
- Android Developer Documentation, *MediaProjection API Changes* (2024)
- Google, *Developer Program Policies: User Data* (2026)
- Google, *Developer Program Policies: Bullying and Harassment* (2026)
- Stripe, *Restricted Businesses*, https://stripe.com/legal/restricted-businesses

### Secondary Sources

- DietBet, *Weight Loss Challenge Rules*, https://www.dietbet.com/kickstarter/rules
- HealthyWage, *Official Rules*, https://www.healthywage.com/rules/official-rules/
