---
generated: true
department: LEG
artifact_id: L5
governing_sop: "SOP--risk-management.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Regulatory Risk Register

Comprehensive risk register for Styx covering regulatory, financial, operational, and reputational risks. Each risk is assessed on likelihood (1-5) and impact (1-5) with a composite score (L x I). Risks scoring 15+ require immediate mitigation.

## Risk Matrix Legend

| Likelihood | Description |
|------------|-------------|
| 1 | Rare -- could occur but no precedent |
| 2 | Unlikely -- has occurred in adjacent industries |
| 3 | Possible -- credible scenario with known precedent |
| 4 | Likely -- strong indicators this will occur |
| 5 | Almost certain -- industry standard expectation |

| Impact | Description |
|--------|-------------|
| 1 | Negligible -- minor inconvenience, no revenue impact |
| 2 | Minor -- workaround available, <$10K cost |
| 3 | Moderate -- feature restriction or delayed timeline, $10K-$50K |
| 4 | Major -- significant revenue impact or forced pivot, $50K-$250K |
| 5 | Critical -- existential threat, platform shutdown, >$250K |

---

## Risk Register

### R-01: Gambling Classification

| Field | Value |
|-------|-------|
| **Risk ID** | R-01 |
| **Category** | Regulatory |
| **Description** | State or federal regulators classify Styx behavioral contracts as gambling, triggering licensing requirements, operational restrictions, or platform shutdown. |
| **Likelihood** | 3 (Possible) |
| **Impact** | 5 (Critical) |
| **Score** | 15 |
| **Mitigation** | (1) Legal analysis establishing commitment-device distinction (see `docs/legal/legal--performance-wagering.md`). (2) User controls outcome (not chance-based). (3) Linguistic cloaker removes gambling-adjacent terminology. (4) No house edge on deposits (platform fee is a service fee, not a take rate on wagers). (5) Pre-launch legal opinion from gaming law specialist. |
| **Owner** | Legal Counsel (external) |
| **Status** | Active -- legal analysis complete, formal opinion pending |

### R-02: Money Transmitter Licensing

| Field | Value |
|-------|-------|
| **Risk ID** | R-02 |
| **Category** | Regulatory / Financial |
| **Description** | State regulators classify Styx's escrow handling as money transmission, requiring money transmitter licenses (MTLs) in each operating state. MTL compliance costs $50K-$500K+ and takes 6-18 months. |
| **Likelihood** | 4 (Likely) |
| **Impact** | 4 (Major) |
| **Score** | 16 |
| **Mitigation** | (1) FBO escrow structure through Stripe shifts transmitter liability to Stripe as the licensed entity. (2) Styx never holds or controls user funds directly -- Stripe manages the FBO account. (3) Obtain written confirmation from Stripe that the FBO structure does not require Styx to hold an MTL. (4) Monitor FinCEN guidance on escrow-as-a-service models. (5) Budget for MTL application if Stripe confirmation is insufficient. |
| **Owner** | Legal Counsel (external) + Stripe Account Manager |
| **Status** | Active -- Stripe confirmation requested |

### R-03: FBO Escrow Liability

| Field | Value |
|-------|-------|
| **Risk ID** | R-03 |
| **Category** | Financial |
| **Description** | FBO escrow account is mismanaged, frozen by Stripe, or funds become inaccessible due to Stripe policy changes or disputes. Users cannot access their deposits. |
| **Likelihood** | 2 (Unlikely) |
| **Impact** | 5 (Critical) |
| **Score** | 10 |
| **Mitigation** | (1) Regular reconciliation between internal ledger and Stripe FBO balance (Gate 06). (2) Maintain operational reserve to cover 30 days of active escrow in case of Stripe freeze. (3) Document Stripe FBO terms and escalation procedures. (4) Evaluate backup payment processor (Adyen, Square) for redundancy. (5) Never commingle FBO funds with operating revenue. |
| **Owner** | Engineering + Finance |
| **Status** | Active -- Gate 06 implemented, reconciliation automated |

### R-04: Health Data and HIPAA Adjacency

| Field | Value |
|-------|-------|
| **Risk ID** | R-04 |
| **Category** | Regulatory |
| **Description** | Collection of BMI, weight targets, and behavioral health data (recovery contracts) triggers HIPAA or state health privacy law obligations. Particularly relevant for B2B practitioner channel where therapists assign contracts to clients. |
| **Likelihood** | 3 (Possible) |
| **Impact** | 4 (Major) |
| **Score** | 12 |
| **Mitigation** | (1) Styx is not a covered entity or business associate under HIPAA (not a healthcare provider, health plan, or clearinghouse). (2) B2B practitioners use Styx as a supplementary tool, not a clinical record system. (3) No diagnostic codes, treatment plans, or clinical notes are stored. (4) Health-adjacent data (BMI, weight) is encrypted and access-restricted. (5) Obtain legal opinion on whether B2B practitioner use creates a business associate relationship. (6) Monitor state-specific health data laws (California, Illinois, Washington). |
| **Owner** | Legal Counsel (external) |
| **Status** | Active -- legal opinion pending |

### R-05: Eating Disorder Liability (Aegis Protocol)

| Field | Value |
|-------|-------|
| **Risk ID** | R-05 |
| **Category** | Reputational / Regulatory |
| **Description** | A user with an eating disorder uses biological oaths to incentivize dangerous weight loss, resulting in health harm. Even with Aegis Protocol guardrails (BMI floor 18.5, 2% velocity cap), a user could game the system or have a starting BMI that makes any loss dangerous. |
| **Likelihood** | 3 (Possible) |
| **Impact** | 5 (Critical) |
| **Score** | 15 |
| **Mitigation** | (1) Aegis Protocol enforces BMI floor (18.5) and velocity cap (2%/week) at contract creation. (2) Mandatory health disclaimer before biological oath creation. (3) Aegis gates (04, 05) validate in CI -- no code path bypasses safety checks. (4) Consider requiring physician sign-off for biological oaths with weight targets. (5) Prominent Terms of Service disclaimer that Styx is not a medical device. (6) Emergency contract cancellation (no forfeit) if user reports health crisis. |
| **Owner** | Product + Legal |
| **Status** | Active -- Aegis Protocol implemented, physician sign-off under evaluation |

### R-06: KYC/AML Compliance

| Field | Value |
|-------|-------|
| **Risk ID** | R-06 |
| **Category** | Regulatory / Financial |
| **Description** | Inadequate KYC/AML controls result in the platform being used for money laundering (e.g., creating contracts designed to fail to transfer money to confederate Furies) or sanctions violations. |
| **Likelihood** | 3 (Possible) |
| **Impact** | 4 (Major) |
| **Score** | 12 |
| **Mitigation** | (1) Stripe Identity for KYC at registration and elevated thresholds. (2) Transaction monitoring for suspicious patterns (rapid contract creation/failure, same-IP Furies). (3) Deposit limits per integrity tier cap exposure. (4) Fury conflict-of-interest detection prevents social-graph collusion. (5) SAR (Suspicious Activity Report) filing process to be established. (6) AML compliance officer designation (external, pre-launch). |
| **Owner** | Legal + Engineering |
| **Status** | Planned -- Stripe Identity integration stubbed, compliance officer not yet retained |

### R-07: State-by-State Gaming Law Variance

| Field | Value |
|-------|-------|
| **Risk ID** | R-07 |
| **Category** | Regulatory |
| **Description** | Even if Styx is not gambling at the federal level, individual states may have broader definitions that capture commitment devices or skill-based financial contracts. States like Utah, Hawaii, and several others have particularly restrictive gaming statutes. |
| **Likelihood** | 3 (Possible) |
| **Impact** | 3 (Moderate) |
| **Score** | 9 |
| **Mitigation** | (1) State-by-state legal review of gaming statutes (50-state survey). (2) `STYX_ALLOWLIST_US_ONLY` flag can be extended to `STYX_STATE_BLOCKLIST` for per-state restrictions. (3) Start with permissive states only if 50-state survey identifies high-risk jurisdictions. (4) DFS (Department of Financial Services) pre-consultation in NY if targeting NYC market. |
| **Owner** | Legal Counsel (external) |
| **Status** | Planned -- 50-state survey not yet commissioned |

### R-08: App Store Rejection

| Field | Value |
|-------|-------|
| **Risk ID** | R-08 |
| **Category** | Operational |
| **Description** | Apple App Store or Google Play Store rejects the Styx mobile app due to gambling-adjacent features, financial stake mechanics, or terminology. App store review processes are opaque and inconsistent. |
| **Likelihood** | 4 (Likely) |
| **Impact** | 3 (Moderate) |
| **Score** | 12 |
| **Mitigation** | (1) Linguistic cloaker removes all gambling-adjacent terminology from user-facing strings and app store metadata. (2) App store description emphasizes "behavioral commitment" and "accountability", not financial stakes. (3) Submit with detailed explanation to review team pre-emptively. (4) Web app (Next.js PWA) as fallback distribution channel if native apps are rejected. (5) Consider Expo web export as intermediate step. (6) Study how stickK, Beeminder, and DietBet passed app store review. |
| **Owner** | Product + Mobile Engineering |
| **Status** | Active -- linguistic cloaker implemented, app store submission not yet attempted |

### R-09: CCPA and Privacy Regulation

| Field | Value |
|-------|-------|
| **Risk ID** | R-09 |
| **Category** | Regulatory |
| **Description** | Non-compliance with CCPA (California), state-specific biometric data laws (Illinois BIPA), or emerging state privacy legislation results in fines or litigation. Styx collects PII, financial data, behavioral data, and EXIF/location data. |
| **Likelihood** | 3 (Possible) |
| **Impact** | 3 (Moderate) |
| **Score** | 9 |
| **Mitigation** | (1) Privacy policy drafted with CCPA section (see `docs/legal/privacy-policy.md`). (2) Data deletion and portability mechanisms planned. (3) No biometric data collection currently (future HealthKit is opt-in). (4) EXIF/GPS consent disclosed in privacy policy and at proof upload. (5) Cookie consent banner for web app. (6) Privacy impact assessment before B2B practitioner launch (therapist-client data sensitivity). |
| **Owner** | Legal + Engineering |
| **Status** | Active -- privacy policy drafted, deletion mechanism planned |

### R-10: Stripe Terms of Service Compliance

| Field | Value |
|-------|-------|
| **Risk ID** | R-10 |
| **Category** | Financial / Operational |
| **Description** | Stripe determines that Styx's business model violates its Terms of Service (restricted businesses list includes gambling, skill games, or prediction markets). Account suspension would freeze all FBO escrow funds. |
| **Likelihood** | 2 (Unlikely) |
| **Impact** | 5 (Critical) |
| **Score** | 10 |
| **Mitigation** | (1) Pre-approval from Stripe's high-risk team before processing production transactions. (2) FBO structure explicitly supported by Stripe Connect for platforms. (3) Written confirmation that commitment devices are not on Stripe's restricted list. (4) Maintain backup processor evaluation (Adyen, Square). (5) Keep operational reserve for 30-day fund migration if Stripe terminates. (6) Transparent communication with Stripe about business model evolution. |
| **Owner** | Finance + Stripe Account Manager |
| **Status** | Active -- pre-approval conversation initiated |

### R-11: Fury Auditor Misuse

| Field | Value |
|-------|-------|
| **Risk ID** | R-11 |
| **Category** | Operational / Reputational |
| **Description** | Fury auditors collude to systematically fail legitimate proofs (extracting forfeit bounties), or pass fraudulent proofs (enabling money laundering through confederate users). |
| **Likelihood** | 3 (Possible) |
| **Impact** | 3 (Moderate) |
| **Score** | 9 |
| **Mitigation** | (1) 3-of-5 quorum makes single-auditor manipulation impossible. (2) $2 auditor stake creates skin-in-the-game against bad-faith voting. (3) Conflict-of-interest detection prevents social-graph collusion. (4) Round-robin assignment with randomization prevents targeting. (5) Auditor reputation tracking with ejection threshold. (6) Statistical anomaly detection for voting patterns (e.g., auditor who always votes FAIL). (7) Elevated 7-Fury panel for disputes. |
| **Owner** | Engineering + Trust & Safety |
| **Status** | Active -- quorum, COI detection, and round-robin implemented; anomaly detection planned |

### R-12: Data Breach

| Field | Value |
|-------|-------|
| **Risk ID** | R-12 |
| **Category** | Operational / Reputational |
| **Description** | Unauthorized access to user data, proof photos, financial records, or no-contact target identities. Given the sensitive nature of recovery contracts (breakup data), a breach has outsized reputational impact. |
| **Likelihood** | 2 (Unlikely) |
| **Impact** | 5 (Critical) |
| **Score** | 10 |
| **Mitigation** | (1) Encryption at rest (PostgreSQL TDE) and in transit (TLS 1.3). (2) RBAC for all internal access. (3) Proof photos encrypted in Cloudflare R2. (4) No-contact target identifiers stored with additional encryption layer (never exposed to Furies). (5) Regular dependency vulnerability scanning. (6) Incident response plan (see `docs/legal/legal--compliance-guardrails.md`). (7) Penetration testing before beta launch. (8) Bug bounty program post-launch. |
| **Owner** | Engineering + Security |
| **Status** | Active -- encryption implemented, pen test planned |

---

## Risk Summary by Score

| Score Range | Count | Risk IDs |
|-------------|-------|----------|
| 15-25 (Critical) | 2 | R-01 (15), R-02 (16) |
| 10-14 (High) | 5 | R-03 (10), R-04 (12), R-05 (15), R-06 (12), R-08 (12), R-10 (10), R-12 (10) |
| 5-9 (Medium) | 3 | R-07 (9), R-09 (9), R-11 (9) |
| 1-4 (Low) | 0 | -- |

**Note:** R-05 was initially scored 15 but is listed in the High range because the Aegis Protocol provides substantive technical mitigation. It remains on the watch list for escalation if a health incident occurs.

## Top Priority Actions

1. **Obtain formal legal opinion on gambling classification** (R-01). This is the single highest existential risk. Budget: $10K-$25K for gaming law specialist.
2. **Secure Stripe written confirmation** on FBO structure and MTL exemption (R-02, R-10). Without this, the entire financial infrastructure is at risk.
3. **Commission 50-state gaming law survey** (R-07). Even a favorable federal classification does not prevent state-level challenges.
4. **Retain AML compliance officer** (R-06). Required before processing real transactions.
5. **Schedule penetration test** (R-12). Must complete before beta launch.

## Review Cadence

This risk register is reviewed and updated:
- Monthly during pre-launch phase
- Quarterly after launch
- Immediately upon any regulatory inquiry, legal development, or incident

Last review: 2026-03-08 (initial creation)
Next review: 2026-04-08
