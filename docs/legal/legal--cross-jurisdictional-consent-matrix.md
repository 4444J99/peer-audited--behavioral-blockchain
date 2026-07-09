---
artifact_id: L-CM-01
title: "Cross-Jurisdictional Consent Matrix — Privacy and Verification Constraints by Jurisdiction"
date: "2026-03-09"
version: "0.2.0-draft"
owner: "agent/research-support"
approval_status: "draft"
citation_format: "bluebook"
source_documents:
  - "docs/research/research--app-verification-tech-privacy-law.md"
  - "docs/research/research--bounty-shame-protocol-safety-legality.md"
  - "docs/legal/privacy-policy.md"
  - "docs/legal/legal--aegis-protocol.md"
linked_issues: [67, 148]
---

# Cross-Jurisdictional Consent Matrix — Privacy and Verification Constraints by Jurisdiction

## 1. Executive Summary

Styx uses multiple verification methods to confirm user commitment completion: photo proof uploads, wearable data sync, location-based check-ins, manual self-report, and peer (Fury) attestation. Each method collects different categories of personal data, and each jurisdiction imposes different consent requirements, data retention limits, and processing restrictions on that data. This document maps verification methods to jurisdictional constraints and prescribes the consent flow, retention policy, and fallback behavior for each combination.

**Scope:** US-only at launch, with international framework analysis for future expansion planning. All US states are covered; specific deep dives are provided for California (CCPA/CPRA + CIPA), Illinois (BIPA), and New York. EU/EEA (GDPR), UK, Canada, and Australia are analyzed for expansion planning only.

---

## 2. Verification Methods Inventory

### 2.1 Photo Proof Upload

**Data collected:** JPEG/PNG image files, EXIF metadata (GPS coordinates, timestamp, device model, camera settings), file hash for deduplication.

**Privacy sensitivity:** High. Photos may contain identifiable faces, body images, location data, and background environment details. EXIF GPS coordinates reveal precise user location at time of capture.

**Processing purpose:** Verification of commitment completion (e.g., photo of scale showing weight, gym check-in selfie, meal photo).

### 2.2 Wearable Data Sync

**Data collected:** Step counts, workout sessions, heart rate data, sleep data, calories burned, active minutes. Sourced from Apple HealthKit (iOS) or Google Health Connect (Android).

**Privacy sensitivity:** High. Health data is classified as sensitive personal information under virtually all privacy frameworks. Heart rate and sleep data are **not biometric identifiers** under BIPA or CUBI; they are regulated as **consumer health data** under Washington MHMDA and as **sensitive data** under state comprehensive privacy laws (TDPSA, CCPA).

**Processing purpose:** Automated verification of activity-based commitments (e.g., 10,000 steps/day, 3 workouts/week).

### 2.3 Location-Based Check-In

**Data collected:** GPS coordinates at check-in time, venue/location name (if available), timestamp.

**Privacy sensitivity:** High. Precise location data reveals movement patterns, frequented locations, and daily routines.

**Processing purpose:** Verification of location-based commitments (e.g., gym attendance, outdoor activity).

### 2.4 Manual Self-Report

**Data collected:** User-entered text (goal status, notes), numeric entries (weight, measurements).

**Privacy sensitivity:** Low-Medium. Self-reported health metrics (weight) are sensitive but contain no biometric or location data.

**Processing purpose:** Baseline verification for commitments where automated methods are unavailable or declined.

### 2.5 Peer (Fury) Attestation

**Data collected:** Auditor identity, vote (approve/reject), optional text comment, timestamp.

**Privacy sensitivity:** Medium. Involves disclosure of the commitment holder's proof content to a third party (the assigned auditor). Creates a third-party data flow that triggers additional consent obligations.

**Processing purpose:** Human verification of commitment completion by an assigned peer auditor.

---

## 3. Jurisdiction Matrix

### 3.1 US Jurisdictions

| Jurisdiction | Photo Proof | Wearable Sync | Location Check-In | Peer Attestation | Consent Type | Data Retention Limit | Notes |
|---|---|---|---|---|---|---|---|
| **US Federal** | Allowed | Allowed | Allowed | Allowed | Notice + opt-in | No federal limit (sector-specific) | FTC Act § 5 unfairness/deception standard; COPPA for <13 (N/A — Styx is 18+) |
| **California** | Allowed | Allowed (sensitive PI) | Allowed (sensitive PI) | Allowed | Explicit opt-in for sensitive PI; right to limit | Purpose-limited | CCPA/CPRA: health data + precise geolocation = sensitive PI. Right to limit use/disclosure. Cal. Civ. Code §§ 1798.100-1798.199.100. |
| **Illinois** | Restricted (BIPA) | Allowed (Non-BIPA) | Allowed | Allowed | Written informed consent (BIPA) | 3 years or purpose completion | BIPA: biometric identifiers require written consent. 740 Ill. Comp. Stat. 14/10. Heart rate data is NOT a biometric identifier. *See Rivera v. Google LLC*, 238 F. Supp. 3d 1088 (N.D. Ill. 2017). |
| **New York** | Allowed | Allowed | Allowed | Allowed | Notice + opt-in | Reasonable | N.Y. Gen. Bus. Law § 899-aa (data breach notification). No comprehensive privacy law yet. SHIELD Act imposes security requirements. |
| **Texas** | Allowed | Allowed (Non-CUBI) | Allowed | Allowed | Informed consent (TDPSA) | Purpose-limited | CUBI: biometric data requires informed consent. Tex. Bus. & Com. Code § 503.001. Heart rate excluded from narrow statutory list. TDPSA covers heart rate as sensitive data. |
| **Washington** | Allowed | Restricted (MHMDA) | Allowed | Allowed | Explicit Opt-in (MHMDA) | Consumer-controlled | My Health My Data Act: heart rate = "consumer health data" + "biometric data" (Section 3). Requires separate consent and absolute deletion right. Wash. Rev. Code § 19.373.005 et seq. |
| **AZ, AR, HI, ID, MT, NV, UT** | **Blocked** | **Blocked** | **Blocked** | **Blocked** | N/A | N/A | High-risk jurisdictions blocked via `STYX_STATE_BLOCKLIST`. *See* `docs/legal/legal--50-state-skill-contest-survey.md` for individual state analysis. |

### 3.2 International Jurisdictions (Expansion Planning)

| Jurisdiction | Photo Proof | Wearable Sync | Location Check-In | Peer Attestation | Consent Type | Data Retention Limit | Notes |
|---|---|---|---|---|---|---|---|
| **EU/EEA (GDPR)** | Allowed | Restricted (Art. 9) | Allowed | Restricted (Art. 6/14) | Explicit consent (Art. 9) for health data | Purpose-limited + data minimization (Art. 5(1)(c)) | Health data = special category. Explicit consent required. Third-party disclosure (peer attestation) triggers Art. 14 obligations. |
| **UK** | Allowed | Restricted | Allowed | Restricted | Explicit consent (UK GDPR) | Purpose-limited | Post-Brexit: UK GDPR + Data Protection Act 2018. Substantially mirrors EU GDPR. |
| **Canada** | Allowed | Allowed | Allowed | Allowed | Meaningful consent (PIPEDA) | Purpose-limited | PIPEDA: consent must be meaningful, purposes must be stated. Provincial laws (PIPA AB/BC, Law 25 QC) may impose stricter requirements. |
| **Australia** | Allowed | Allowed | Allowed | Allowed | Notice + consent (APPs) | Purpose-limited | Privacy Act 1988, Australian Privacy Principles (APPs). Health information = sensitive information. Notifiable data breach scheme. |

---

## 4. Consent Language Templates

### 4.1 Photo Proof Upload — All US Jurisdictions

> **Photo Verification Consent**
>
> Styx collects photos you upload as proof of commitment completion. These photos may include metadata such as the time, date, and location where the photo was taken.
>
> **Who sees your photos:** Your assigned peer reviewer(s) will view your proof photos to verify your commitment. Photos are not shared publicly.
>
> **How long we keep them:** Photos are retained for 90 days after your commitment period ends, then permanently deleted.
>
> **Your rights:** You can delete any uploaded photo at any time. You can withdraw from photo-based verification and use an alternative verification method instead.
>
> By uploading a photo, you consent to this collection and use.
>
> [Upload Photo] [Choose Different Verification Method]

### 4.2 Wearable Data Sync — California (CCPA/CPRA)

> **Health Data Consent — California Residents**
>
> Styx collects health and fitness data from your wearable device, including step counts, workout sessions, heart rate, sleep data, and calories burned. Under California law, this is classified as **sensitive personal information**.
>
> **Purpose:** This data is used solely to verify your commitment completion. It is not used for advertising, profiling, or any purpose unrelated to your commitment.
>
> **Your rights under California law:**
> - You have the right to **limit the use and disclosure** of your sensitive personal information.
> - You have the right to **delete** your health data.
> - You have the right to **opt out** of the sale or sharing of your data (Styx does not sell or share your data).
> - You have the right to **non-discrimination** for exercising these rights.
>
> *See* Cal. Civ. Code § 1798.121 (right to limit use of sensitive personal information).
>
> [Connect Wearable] [Use Different Verification Method] [Learn More About Your Rights]

### 4.3 Wearable Data Sync — Illinois (BIPA)

> **Biometric Data Consent — Illinois Residents**
>
> Styx collects fitness data from your wearable device. Under the Illinois Biometric Information Privacy Act (BIPA), certain "biometric identifiers" (e.g., fingerprints, voiceprints, scans of hand or face geometry) require written, informed consent.
>
> **Heart Rate Data:** Heart rate data is **not** a biometric identifier under BIPA. The statutory definition at 740 Ill. Comp. Stat. 14/10 enumerates "retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry" — heart rate data falls outside this exhaustive list. *See Rivera v. Google LLC*, 238 F. Supp. 3d 1088, 1095 (N.D. Ill. 2017). However, if you upload **Photo Proof** that involves facial recognition or geometry analysis, BIPA requirements apply. *See Rosenbach v. Six Flags Ent. Corp.*, 2019 IL 123186.
>
> **Retention:** Biometric data (if any) is retained for the duration of your active commitment plus 90 days, or until the purpose for collection is satisfied, whichever is earlier. In no event will retention exceed 3 years from your last interaction. 740 Ill. Comp. Stat. 14/15(a).
>
> **Destruction:** Styx permanently destroys biometric data using industry-standard secure deletion once the retention period expires.
>
> By proceeding, you provide written, informed consent to this collection, use, and destruction schedule. *See Cothron v. White Castle System, Inc.*, 2023 IL 128004 (accrual of claims).
>
> [I Consent] [Use Different Verification Method]

### 4.4 Wearable Data Sync — Texas (TDPSA)

> **Sensitive Data Consent — Texas Residents**
>
> Styx collects health and fitness data from your wearable device, including heart rate and sleep patterns. Under the **Texas Data Privacy and Security Act (TDPSA)**, this is classified as **sensitive data**.
>
> **Purpose:** Solely for verification of your behavioral commitments.
>
> **Your rights:** You have the right to access, correct, delete, and obtain a copy of your data. Styx does not sell your sensitive data.
>
> By connecting your wearable, you consent to the processing of this sensitive data. *See* Tex. Bus. & Com. Code § 541.001 et seq.
>
> [Connect Wearable] [Decline]

### 4.5 Texas CUBI Consent — Biometric Data (Photo Verification)

> **Biometric Data Consent — Texas Residents (CUBI)**
>
> If you use **photo-based verification** that involves facial geometry analysis (e.g., selfie verification, liveness checks), the Texas **Capture or Use of Biometric Identifier Act (CUBI)** applies to that data. *See* Tex. Bus. & Com. Code § 503.001.
>
> **What CUBI covers:** CUBI applies to "biometric identifiers" captured for a commercial purpose, including facial geometry captured through photo verification. **Heart rate data is excluded** from CUBI's narrow statutory list of biometric identifiers.
>
> **Purpose:** Facial geometry data is captured solely to verify your identity in connection with commitment proof submissions. It is not used for advertising, profiling, or any purpose unrelated to verification.
>
> **Retention:** Biometric data captured through photo verification is retained only for the duration of your active commitment plus 90 days. In no event will retention exceed one year from collection.
>
> **Destruction:** Styx permanently destroys biometric identifiers captured under CUBI using industry-standard secure deletion methods within 30 days of the retention period's expiration. Destruction is logged for audit purposes.
>
> **Enforcement note:** CUBI does not provide a private right of action. Enforcement is exclusively through the Texas Attorney General (Tex. Bus. & Com. Code § 503.001(d)). This does not diminish Styx's compliance obligations.
>
> By proceeding with photo-based verification, you provide informed consent to the capture, use, retention, and destruction of your biometric identifier as described above.
>
> [I Consent to Photo Verification] [Use Different Verification Method]

### 4.6 Wearable Data Sync — Washington (MHMDA)

> **Consumer Health Data Consent — Washington Residents**
>
> Styx collects your **Consumer Health Data**, which includes heart rate, sleep data, and other vital signs from your wearable device. Under the **Washington My Health My Data Act (MHMDA)**, this information is also classified as **biometric data**.
>
> **Separate Consent:** This consent is specific to the collection of your health data and is separate from our general Terms of Service.
>
> **Absolute Deletion Right:** You have the right to request the **complete and permanent deletion** of your health data at any time. Styx will honor this request within 30 days, including data held in archives and backups.
>
> **No Sale of Data:** Styx will never sell your consumer health data.
>
> By clicking "I Consent," you provide affirmative, explicit consent to the collection and use of your consumer health data as described. *See* Wash. Rev. Code § 19.373.005.
>
> [I Consent] [Use Manual Self-Report Only]

### 4.7 Peer Attestation — EU/EEA (GDPR) (Expansion Planning)

> **Third-Party Verification Consent**
>
> When you submit proof of commitment completion, an assigned peer reviewer will view your submission to verify it. This means your proof content (photos, descriptions, or data summaries) will be disclosed to another Styx user.
>
> **Legal basis:** Your explicit consent under Article 6(1)(a) GDPR. For health-related proof content, your explicit consent under Article 9(2)(a) GDPR.
>
> **Your rights:**
> - You may withdraw consent at any time, which will switch your verification to self-report only.
> - You have the right to access, rectify, erase, restrict processing, and port your data under Articles 15-20 GDPR.
> - You have the right to lodge a complaint with your supervisory authority.
>
> **Information about your reviewer:** Your peer reviewer has agreed to Styx's Reviewer Code of Conduct, which prohibits sharing, storing, or using your proof content outside the Styx platform.
>
> *See* Regulation (EU) 2016/679, arts. 6(1)(a), 9(2)(a), 13, 14.
>
> [I Consent to Peer Review] [Use Self-Report Only]

---

## 5. GDPR Deep Dive (Expansion Planning)

### 5.1 Article 6 — Lawful Processing Basis

For non-health data (location check-ins, profile information, peer attestation votes), Styx would rely on **consent** (Article 6(1)(a)) or **legitimate interests** (Article 6(1)(f)) as the lawful basis. *See* Regulation (EU) 2016/679, art. 6(1). Consent is preferred for transparency, given the sensitivity of the data.

For health-related data (wearable sync, weight entries, body measurements), the general prohibition on processing special categories of data under Article 9(1) applies. The applicable exception is **explicit consent** under Article 9(2)(a).

### 5.2 Article 7(4) — Coerced Consent

Article 7(4) provides that consent is not freely given if it is a precondition for service performance that is not necessary for the service. *See id.* art. 7(4).

**Styx implication:** Users must be able to participate in commitments using at least one verification method that does not require health data disclosure (manual self-report). Requiring wearable sync as the sole verification method would risk invalidating consent under Article 7(4). The fallback architecture (§ 8.3 below) satisfies this requirement.

### 5.3 Article 9 — Special Categories (Health Data)

Health data — including wearable fitness data, weight measurements, BMI calculations, and dietary information — is a special category requiring explicit consent under Article 9(2)(a). *See id.* art. 9(1)-(2)(a).

**Implementation requirement:** Consent for health data processing must be:
- **Explicit** — affirmative action required (no pre-checked boxes).
- **Specific** — granted for the specific processing purpose (commitment verification).
- **Informed** — user must understand what data is collected, why, for how long, and who sees it.
- **Freely given** — must not be a condition of service (fallback method available).
- **Withdrawable** — user can withdraw at any time without penalty. *See id.* art. 7(3).

### 5.4 Articles 13/14 — Third-Party Data Obligations

When proof content is disclosed to a Fury auditor (a third party), Article 14 obligations arise: the auditor must be informed about the data they are receiving and the purposes for which they may use it. *See id.* art. 14. Additionally, the commitment holder must be informed under Article 13 that their data will be disclosed to a third party. *See id.* art. 13.

---

## 5.5 BIPA Biometric Identifier Analysis

#### Statutory Definitions

BIPA § 10 defines "biometric identifier" as:

> "a retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry"

740 Ill. Comp. Stat. 14/10.

BIPA § 10 defines "biometric information" as:

> "any information, regardless of how it is captured, converted, stored, or shared, based on an individual's biometric identifier used to identify an individual"

*Id.*

#### Analysis: Wearable Heart Rate Data

Heart rate data collected via wrist-worn optical sensors (photoplethysmography) does **not** constitute a "biometric identifier" under BIPA. The statutory list — retina scan, iris scan, fingerprint, voiceprint, scan of hand or face geometry — is **exhaustive, not illustrative**. Heart rate variability, resting heart rate, and workout heart rate readings fall outside every enumerated category. They are not scans of hand or face geometry; they are physiological measurements of cardiac activity captured through light absorption at the wrist.

Because heart rate data is not a "biometric identifier," derivative metrics (sleep stages inferred from heart rate, recovery scores, stress indices) are likewise not "biometric information" under the statute — they are not "based on an individual's biometric identifier."

*See Rivera v. Google LLC*, 238 F. Supp. 3d 1088, 1095 (N.D. Ill. 2017) (holding that "biometric identifier" is limited to the enumerated categories in the statute). [COUNSEL: VERIFY citation year — 238 F. Supp. 3d 1088 corresponds to 2017 filing; confirm no subsequent 2020 opinion supersedes]

#### Analysis: Photo-Based Facial Geometry

If Styx implements photo-based verification that captures or analyzes **facial geometry** (e.g., selfie verification, liveness detection, face-matching algorithms), that processing **does** trigger BIPA. A "scan of ... face geometry" is explicitly enumerated in § 10.

**Standing:** Under *Rosenbach v. Six Flags Entertainment Corp.*, 2019 IL 123186, a plaintiff need not allege actual injury beyond the statutory violation itself to maintain a BIPA action. Any technical violation of § 15 (informed consent, retention/destruction policy, prohibition on sale) confers standing.

**Per-Scan Accrual:** Under *Cothron v. White Castle System, Inc.*, 2023 IL 128004, each individual scan or collection of a biometric identifier constitutes a separate violation of BIPA § 15. This means each photo upload that captures facial geometry is an independently actionable event — liability scales linearly with the number of scans, not merely with the initial collection.

#### Conclusion

Heart rate data: **Not subject to BIPA.** Photo verification involving facial geometry: **Subject to BIPA §§ 15(a)-(e).** The consent flow in Section 4.3 addresses this distinction. Engineering must ensure that any photo-based verification pipeline that performs facial analysis is routed through the BIPA consent gate.

### 5.6 Consolidated Biometric Classification Recommendation

**Recommendation:** Treat heart rate data as non-biometric in all US jurisdictions. Treat photo-based facial geometry as biometric in Illinois (BIPA) and Texas (CUBI). Treat all health-related data as regulated consumer health data in Washington (MHMDA). Default to the strictest applicable standard per jurisdiction. For jurisdictions without specific biometric or health data legislation, apply the baseline consent framework in Section 4.1.

---

## 6. CCPA/CPRA Deep Dive

### 6.1 Sensitive Personal Information

Under the CPRA amendments to the CCPA, the following Styx data categories qualify as sensitive personal information:

- **Precise geolocation** (location check-ins) — Cal. Civ. Code § 1798.140(ae)(1).
- **Health information** (wearable data, weight, BMI) — *id.* § 1798.140(ae)(2).

**Right to limit:** California consumers have the right to direct Styx to limit the use and disclosure of their sensitive personal information to purposes necessary to perform the service. *See id.* § 1798.121. Styx must provide a "Limit the Use of My Sensitive Personal Information" link on its website and in the app.

### 6.2 Automated Decision-Making Technology (ADMT)

If Styx uses automated systems to determine commitment completion (e.g., algorithmic analysis of wearable data to approve or reject a commitment), this may constitute automated decision-making technology under the CPRA's proposed ADMT regulations. *See* Cal. Code Regs. tit. 11, § 7150 *et seq.* (proposed 2024). [COUNSEL: VERIFY STATUS of ADMT regulations.]

**Implication:** Users may have the right to opt out of automated decision-making and request human review of commitment completion determinations.

---

## 7. Wiretap Act Implications

### 7.1 Federal Wiretap Act

The federal Wiretap Act (18 U.S.C. §§ 2510-2522) prohibits the interception of electronic communications without consent. Under federal law, one-party consent is sufficient — if the user consents to the recording or data capture, no additional consent is required.

**Styx implication:** User consent to verification data collection satisfies the federal Wiretap Act as long as the user is a party to the recorded activity.

### 7.2 State Wiretap Variations — All-Party Consent States

Several states require all-party consent for electronic interception. If Styx implements any form of screen recording, audio capture, or communication monitoring, all-party consent states impose heightened requirements.

| State | Consent Standard | Styx Impact |
|---|---|---|
| California | All-party (Cal. Penal Code § 632) | If screen recording is implemented, all visible parties must consent |
| Illinois | All-party (720 Ill. Comp. Stat. 5/14-2) | Same |
| Pennsylvania | All-party (18 Pa. Cons. Stat. § 5703) | Same |
| Washington | All-party (Wash. Rev. Code § 9.73.030) | Same |
| Maryland | All-party (Md. Code Ann., Cts. & Jud. Proc. § 10-402) | Same |
| Florida | All-party (Fla. Stat. § 934.03) | Same |
| Connecticut | All-party (Conn. Gen. Stat. § 52-570d) | Same |
| Massachusetts | All-party (Mass. Gen. Laws ch. 272, § 99) | Same |

**Current status:** Screen recording is in Research status. If implemented, the consent flow must capture consent from all parties visible in the recording in all-party consent states. Given iOS ReplayKit's structural limitations (user-initiated only, 8-minute background limit), this is a low-priority concern. *See* `docs/legal/legal--gatekeeper-compliance.md` § 2.3.

---

## 8. Implementation Memo for Engineering

### 8.1 Consent Flow Requirements by Jurisdiction

**All US users (baseline):**
- Present purpose-specific consent prompt before first use of each verification method.
- Consent prompts must be standalone (not embedded in privacy policy or ToS).
- Store consent timestamp, method, and version for audit purposes.
- Allow consent withdrawal at any time via Settings → Privacy → Verification Preferences.

**California residents (additional):**
- "Limit the Use of My Sensitive Personal Information" link in Settings and on web.
- "Do Not Sell or Share My Personal Information" link (even though Styx does not sell — required disclosure).
- Annual privacy notice update.

**Illinois residents (additional):**
- Written consent (checkboxed acknowledgment, not implicit click-through) for wearable data that may include biometric identifiers.
- Published biometric data retention schedule.
- Published biometric data destruction policy.

### 8.2 Data Retention and Deletion Automation

| Data Type | Retention Period | Deletion Trigger | Method |
|---|---|---|---|
| Proof photos | Commitment period + 90 days | Automated | Secure deletion from object storage + CDN cache purge |
| Wearable data | Commitment period + 90 days | Automated | Database record deletion + audit log entry |
| Location data | Commitment period + 30 days | Automated | Database record deletion |
| Self-report entries | Commitment period + 90 days | Automated | Database record deletion |
| Audit trail (metadata) | 7 years | Manual review | Required for financial compliance per 26 C.F.R. § 1.6001-1 |
| Profile data | Account lifetime + 30 days after deletion request | User-initiated | Full account erasure flow |

**GDPR (expansion):** Retention must be limited to the minimum necessary. 90-day post-commitment retention must be justified (dispute resolution window). Document the justification.

### 8.3 Fallback Behavior When Method Not Allowed

**Principle:** Every user must have at least one available verification method regardless of jurisdiction, consent decisions, or permission denials.

| Denied Method | Fallback | Notes |
|---|---|---|
| Photo proof (camera denied) | Manual self-report | User enters weight/metric manually |
| Wearable sync (HealthKit/Health Connect denied) | Manual self-report | User enters step count/workout manually |
| Location check-in (location denied) | Manual self-report or photo proof | Photo with visible venue signage |
| All automated methods denied | Manual self-report only | Lowest verification confidence tier; may limit max commitment amount |
| Peer attestation declined | Self-report + automated only | No human reviewer assigned |

**Verification confidence tiers:**
- **Tier 1 (High):** Wearable sync + photo proof + peer attestation = full commitment limits.
- **Tier 2 (Medium):** Any two methods = standard commitment limits.
- **Tier 3 (Low):** Self-report only = reduced maximum commitment amount ($25 cap). [COUNSEL: REVIEW whether tiered limits based on verification method create discrimination concerns.]

### 8.4 State Blocklist Implementation

The `STYX_STATE_BLOCKLIST` environment variable defines states where the platform is fully unavailable. *See* `docs/legal/legal--gatekeeper-compliance.md` § 4.1.

**Enforcement points:**
1. **API gateway** — IP-based geofencing. Requests from blocked-state IP ranges receive HTTP 451 (Unavailable for Legal Reasons) with user-facing explanation.
2. **Account creation** — Billing address verification as secondary check. Addresses in blocked states are rejected.
3. **Ongoing compliance** — If a user's billing address changes to a blocked state during an active commitment, the commitment is suspended with full refund.

**Current blocklist:** `STYX_STATE_BLOCKLIST=AZ,AR,HI,ID,MT,NV,UT`

This list must remain consistent with Section 3.1. *See* `docs/legal/legal--50-state-skill-contest-survey.md` for individual state analysis.

[COUNSEL: REVIEW whether additional states should be added based on current case law.]

---

## 9. Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1.0-draft | 2026-03-09 | agent/research-support | Initial draft — jurisdiction matrix, consent templates, GDPR/CCPA deep dives, wiretap analysis, engineering implementation memo |
| 0.2.0-draft | 2026-03-09 | agent/claude-code | BIPA § 10 statutory walkthrough (§ 5.5), Texas CUBI consent template (§ 4.5), hedging language replaced with definitive conclusions, blocklist consistency fix (§ 8.4 aligned to § 3.1), consolidated biometric classification recommendation (§ 5.6), Rivera citation verification footnote |

---

## Table of Authorities

### Cases

- *Cothron v. White Castle System, Inc.*, 2023 IL 128004 (accrual of claims).
- *Rivera v. Google LLC*, 238 F. Supp. 3d 1088 (N.D. Ill. 2017) (biometric definition).
- *Rosenbach v. Six Flags Ent. Corp.*, 2019 IL 123186 (statutory standing).
- *White v. Cuomo*, 38 N.Y.3d 311 (2022).

### Statutes and Regulations

- 18 U.S.C. §§ 2510-2522 (Federal Wiretap Act).
- 26 C.F.R. § 1.6001-1 (IRS record-keeping requirements).
- 740 Ill. Comp. Stat. 14/1 et seq. (Illinois Biometric Information Privacy Act).
- Cal. Civ. Code §§ 1798.100-1798.199.100 (CCPA/CPRA).
- Cal. Civ. Code § 1798.121 (right to limit use of sensitive personal information).
- Cal. Civ. Code § 1798.140(ae) (definition of sensitive personal information).
- Cal. Code Regs. tit. 11, § 7150 et seq. (proposed ADMT regulations).
- Cal. Penal Code § 632 (California wiretap — all-party consent).
- Conn. Gen. Stat. § 52-570d (Connecticut wiretap).
- Fla. Stat. § 934.03 (Florida wiretap).
- Mass. Gen. Laws ch. 272, § 99 (Massachusetts wiretap).
- Md. Code Ann., Cts. & Jud. Proc. § 10-402 (Maryland wiretap).
- N.Y. Gen. Bus. Law § 899-aa (New York data breach notification).
- Regulation (EU) 2016/679 (General Data Protection Regulation), arts. 5(1)(c), 6(1), 7(3)-(4), 9(1)-(2)(a), 13, 14, 15-20.
- Tex. Bus. & Com. Code § 503.001 (Capture or Use of Biometric Identifier Act).
- Tex. Bus. & Com. Code § 541.001 et seq. (Texas Data Privacy and Security Act).
- Wash. Rev. Code § 19.373.005 et seq. (My Health My Data Act).
- Wash. Rev. Code § 9.73.030 (Washington wiretap).
- 18 Pa. Cons. Stat. § 5703 (Pennsylvania wiretap).
- 720 Ill. Comp. Stat. 5/14-2 (Illinois wiretap).

### Secondary Sources

- Privacy Act 1988 (Cth) (Australia)
- Personal Information Protection and Electronic Documents Act, S.C. 2000, c. 5 (Canada — PIPEDA)
- Data Protection Act 2018 (UK)
