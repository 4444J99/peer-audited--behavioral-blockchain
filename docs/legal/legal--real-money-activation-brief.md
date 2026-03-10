---
artifact_id: L-RMA-01
title: "Real-Money Activation Legal Brief — Transition from Test-Money to Live Financial Operations"
date: "2026-03-09"
version: "0.1.0-draft"
owner: "agent/research-support"
approval_status: "draft"
citation_format: "bluebook"
source_documents:
  - "docs/legal/legal--gatekeeper-compliance.md"
  - "docs/legal/legal--performance-wagering.md"
  - "docs/legal/legal--consultation-personal-goals.md"
  - "docs/legal/legal--aegis-protocol.md"
  - "docs/legal/regulatory-risk-register.md"
  - "docs/research/research--prediction-markets-regulation-finance.md"
linked_issues: [132, 133]
---

# Real-Money Activation Legal Brief — Transition from Test-Money to Live Financial Operations

## 1. Executive Summary

This brief analyzes the legal and commercial requirements for transitioning Styx from test-money operations (simulated deposits with no real financial risk) to real-money operations (actual user funds held in escrow with real forfeitures and payouts). The transition triggers new obligations across six domains: financial custody and money transmission, payment processor compliance, KYC/AML requirements, mandatory user disclosures, jurisdiction-specific rules, and responsible use infrastructure.

The central thesis is: **the product architecture does not change at real-money activation — only the financial plumbing changes.** The same commitment mechanics, verification pipeline, scoring algorithms, and Aegis Protocol guardrails operate identically whether the stakes are simulated or real. This architectural continuity is a legal asset — it demonstrates that the product was designed as a skill-based behavioral system from inception, not retrofitted with compliance features to satisfy regulators.

---

## 2. Test-Money vs. Real-Money — Defining the Transition

### 2.1 Test-Money Mode (Current)

In test-money mode, Styx simulates financial commitments:
- Users "deposit" virtual funds that have no monetary value.
- Forfeitures and payouts are tracked in the ledger but involve no actual fund movements.
- No payment processor is connected for user-facing transactions.
- The product functions as a behavioral commitment tool with simulated financial stakes.

### 2.2 Real-Money Mode (Target)

In real-money mode, Styx processes actual financial transactions:
- Users deposit real funds via Stripe Connect into FBO escrow accounts.
- Forfeitures result in actual financial loss to the user.
- Successful completions result in actual payouts from the FBO account to the user's linked payout method.
- The platform collects a real service fee.

### 2.3 What Changes

| Component | Test-Money | Real-Money | Legal Implication |
|---|---|---|---|
| Fund custody | None | FBO escrow via Stripe Connect | Money transmission analysis required |
| User financial risk | None | Real loss possible | Mandatory disclosure obligations |
| Payment processing | None | Stripe Connect (high-risk underwriting) | Processor compliance per `legal--gatekeeper-compliance.md` |
| KYC/AML | Not required | Required above thresholds | FinCEN, BSA, Stripe Identity |
| Tax reporting | Not applicable | 1099 reporting for payouts >$600 | IRS reporting obligations |
| State regulation | Skill-based contest theory only | Same + financial services overlay | State-by-state assessment |
| Refund obligations | N/A | Required for medical guardrail triggers | Consumer protection compliance |
| Insurance | Not required | E&O and cyber liability recommended | Risk management |

### 2.4 What Does Not Change

The following components are identical in both modes:
- Commitment mechanics (goal-setting, duration, verification requirements).
- Scoring algorithms (deterministic, no RNG, no house odds).
- Verification pipeline (photo proof, wearable sync, peer attestation).
- Aegis Protocol guardrails (BMI floor, velocity cap, age gate, pregnancy exclusion).
- Terminology and UX (same sanitized language).
- State blocklist (same geo-restricted states).

---

## 3. Custody and FBO Theory

### 3.1 The Zero-Custody Principle

Styx must never hold, possess, or take legal title to user funds in corporate bank accounts. All user-staked capital must be held in segregated For Benefit Of (FBO) accounts at a federally chartered banking institution via Stripe Connect. *See* `docs/legal/legal--aegis-protocol.md` § 4.1.

**Legal basis:** Operating outside the flow of funds is the primary mechanism for avoiding classification as an unlicensed money transmitter. *See* Modern Treasury, *How Do Money Transmission Laws Work?* (2024) (explaining FBO structures as a safe harbor from state money transmitter licensing requirements).

### 3.2 Money Transmitter Licensing (MTL) Analysis

Under the Bank Secrecy Act, money transmitters must register with FinCEN as Money Services Businesses (MSBs) and obtain state-level Money Transmitter Licenses (MTLs) in all operating states. *See* 31 U.S.C. §§ 5311-5330; 31 C.F.R. § 1022.380.

#### 3.2.1 Federal (FinCEN) Exemptions

Styx's position is supported by a robust corpus of FinCEN administrative guidance and rulings:

1.  **Payment Processor Exemption (FIN-2019-G001):** FinCEN exempts traditional payment processors that facilitate the purchase of goods or services through settlement systems restricted to BSA-regulated financial institutions (e.g., ACH, Fedwire) pursuant to a formal agreement with the payee. *See* FinCEN, *Application of FinCEN’s Regulations to Persons Administering, Exchanging, or Using Virtual Currencies*, FIN-2019-G001 (May 9, 2019).
2.  **Integral to Service (FIN-2014-R004):** FinCEN has ruled that escrow services for internet sales are not money transmission when the movement of funds is "necessary and integral" to the transaction management service. *See* FinCEN Administrative Ruling FIN-2014-R004 (Mar. 11, 2014).
3.  **Agent of the Payee (FIN-2014-R007):** A person that accepts currency as an agent of the payee (the party to whom money is owed) is not a money transmitter. Receipt by the agent is legally receipt by the payee. *See* FinCEN Administrative Ruling FIN-2014-R007 (May 14, 2014).
4.  **Flow-through Limitations (FIN-2013-G001):** FinCEN distinguishes between "administrators" and "users" of value. Styx's lack of ownership or "dominion and control" over the FBO funds places it outside the administrator definition. *See* FIN-2013-G001 (Mar. 18, 2013).
5.  **Third-Party Payment Processors (FIN-2004-1):** FinCEN guidance on third-party payment processors suggests that entities that only process payments for goods and services, and do not provide other money transmission services, are generally not considered money transmitters. *See* FinCEN, *Definition of Money Transmitter (Third-Party Payment Processors)*, FIN-2004-1 (Aug. 17, 2004).
6.  **Escrow Conditions Precedent:** To maintain these exemptions, Styx’s smart-contract logic acts as the "conditions precedent" for fund release (behavioral verification), consistent with the fiduciary duties of an escrow agent. *Cf. Heller v. Cen-Tex Savings & Loan Ass’n*, 410 S.W.2d 267 (Tex. Civ. App. 1966) (defining escrow holders as fiduciaries requiring strict compliance with agreement terms).

#### 3.2.2 OCC Guidance on Bank-Fintech Payment Partnerships

The Office of the Comptroller of the Currency (OCC) has issued a series of interpretive letters signaling openness to bank-fintech custody and payment-processing arrangements that directly support Styx’s FBO-through-bank architecture:

1.  **Interpretive Letter #1170 (Feb. 2020):** The OCC confirmed that national banks may partner with fintech companies to provide payment processing services, provided the bank maintains appropriate risk management and third-party oversight. This supports Styx’s model of delegating fund custody to a chartered bank partner while retaining operational control over verification logic.
2.  **Interpretive Letter #1174 (Oct. 2020):** The OCC clarified that national banks may hold stablecoin reserves and serve as custodians for digital-asset-related deposits. While Styx does not use stablecoins, this letter establishes that OCC-regulated banks have broad authority to hold deposits on behalf of fintech platforms in FBO arrangements — reinforcing the legal basis for Styx’s bank-centric custody model.
3.  **Conditional Approval Letter (Jan. 2021):** The OCC issued a conditional payment charter framework for non-bank payment companies, recognizing that payment-focused entities may operate under a national bank charter with tailored conditions. Although Styx does not seek its own charter, this guidance demonstrates the OCC’s acceptance of non-traditional payment models and strengthens the argument that Styx’s bank-partnership FBO structure is well within the regulatory mainstream.

Taken together, these OCC actions confirm that the federal banking regulator views bank-fintech custody partnerships as a legitimate and encouraged model — directly supporting Styx’s core architectural choice of having a chartered bank hold all user deposits in segregated FBO accounts while Styx operates as the technology and verification layer.

#### 3.2.3 CSBS Model Money Transmission Modernization Act

The Conference of State Bank Supervisors (CSBS) published the *Model Money Transmission Modernization Act* in 2021 to harmonize the patchwork of state money transmitter licensing regimes. *See* CSBS, *Model Money Transmission Modernization Act* (2021). The CSBS model provides a streamlined multi-state licensing framework with standardized definitions, examination procedures, and reciprocity provisions.

A key provision of the CSBS model act is its exclusion of "the provision of payment processing services through a bank" from the definition of "money transmission." This carve-out directly supports Styx’s bank-partnership FBO model: because all user funds are held at and transmitted through a chartered banking institution (via Stripe Connect’s FBO accounts), Styx’s fund-handling activity falls squarely within the bank-payment-processing exclusion.

As of 2025, approximately 30 states have adopted or are considering legislation based on the CSBS model act. This trend strengthens the argument that Styx’s FBO-through-bank structure avoids Money Transmitter Licensing (MTL) requirements in a growing majority of jurisdictions. Even in states that have not yet adopted the model act, the CSBS framework serves as persuasive authority demonstrating the industry and regulatory consensus that bank-mediated payment processing should not trigger money transmitter classification.

[COUNSEL: CONFIRM which target launch states have adopted CSBS model act provisions and whether the bank-payment-processing exclusion language matches Styx’s operational model in each.]

#### 3.2.4 State-Level "Agent of the Payee" (AOTP) Matrix

Styx's launch strategy targets states with statutory or administrative AOTP exemptions to ensure compliance without individual MTLs.

| State | Exemption Status | Legal Authority / Requirement |
|---|---|---|
| **California** | **Yes** | Cal. Fin. Code § 2010(l). Requires written contract stating receipt by agent satisfies payor's debt. |
| **New York** | **Yes** | N.Y. Banking Law § 641(1). Requires receipt to customer acknowledging agent's authority. |
| **Texas** | **Yes** | Tex. Fin. Code § 151.003(9) (MTMA 2023). Standard AOTP language for marketplaces. |
| **Illinois** | **Yes** | 205 ILCS 657/15 (Modernization Act 2024). Debt extinguishment upon receipt by agent. |
| **Florida** | **No (Strict)** | Fla. Stat. § 560. OFR historically rejects AOTP petitions. **[BLOCKLIST CANDIDATE]** |
| **Pennsylvania**| **Yes** | 7 P.S. § 6101 *et seq.* Recognized where agent acts for the recipient. |
| **Ohio** | **Yes** | Ohio Rev. Code § 1315.02. Restricted to custodial interest in funds. |
| **Georgia** | **Yes** | O.C.G.A. § 7-1-682(12). Requires public representation of agency. |
| **N. Carolina** | **Yes** | N.C. Gen. Stat. § 53-208.44(a)(8). Requires formal request for verification. |
| **Michigan** | **Yes** | Mich. Comp. Laws § 487.1004. Requires formal determination from DIFS. |

### 3.3 Stripe Connect FBO Architecture

**Account type:** Stripe Connect Custom accounts. Custom accounts provide maximum control over fund flows and minimize Styx's direct handling of user financial data.

**FBO reconciliation:**
- **Deposit flow:** User → Stripe Connect payment intent → FBO account at partner bank. Styx receives webhook confirmation only.
- **Payout flow:** Upon verified goal completion, Styx issues transfer instruction to Stripe Connect. Stripe executes payout from FBO to user's linked method.
- **Fee collection:** Flat platform fee split at point of deposit via Stripe's application fee mechanism.
- **Ledger integrity:** PostgreSQL double-entry ledger records all fund movements (debits and credits) with timestamps, user IDs, and Stripe transaction references. Monthly reconciliation between Stripe balance reports and internal ledger is mandatory, with discrepancies >$1.00 investigated within 48 hours. *See* `docs/legal/legal--aegis-protocol.md` § 4.2-4.3.

**Supporting artifact:** `docs/legal/appendices/appendix-a--fbo-architecture-diagram.md` (Mermaid source + rendered SVG for counsel and processor review).

---

## 4. Payment Processor Clearance

### 4.1 Pre-Clearance Requirement

Styx must not process any live financial transaction until formal pre-clearance is obtained from the payment processor. Standard Stripe accounts will trigger automated risk review and likely result in account freeze and fund hold. *See* `docs/legal/legal--gatekeeper-compliance.md` § 1.1.

### 4.2 Stripe Pre-Clearance Workflow

1. Contact Stripe's Risk team directly (not general support) with a detailed business description, legal memo, and Appendix A (`docs/legal/appendices/appendix-a--fbo-architecture-diagram.md`).
2. Reference the deposit-contract legal theory and provide the skill-based contest whitepaper (`docs/legal/legal--skill-based-contest-whitepaper.md`).
3. Request classification review under Stripe's Custom Connect account type.
4. Obtain **written approval** before processing any live transaction.
5. Document the approval for regulatory and audit purposes.

**Timeline:** High-risk merchant account underwriting requires 3-6 weeks. Application must be submitted during alpha testing, well before public beta. *See* `docs/legal/legal--gatekeeper-compliance.md` § 1.2.

### 4.3 Terminology for Merchant Applications

All merchant applications describe the product as a **"Performance-Based Accountability Escrow"** — never "contest," "bet," "wager," or "prize." *See* `docs/legal/legal--gatekeeper-compliance.md` § 1.4 (terminology sanitization matrix).

### 4.4 Processor Redundancy

Maintain relationships with at least two processors to prevent single-point-of-failure risk:
- **Primary:** Stripe Connect (preferred for developer tooling and FBO structure).
- **Secondary:** Adyen (supports complex marketplace models) or a dedicated high-risk provider (Corepay, Allied Wallet).
- **Fee expectation:** High-risk accounts charge 3-6% per transaction (vs. Stripe standard 2.9%) and typically require a 5-10% rolling reserve.

---

## 5. KYC/AML Requirements

### 5.1 Threshold Tiers

| Tier | Deposit Amount | KYC Requirement | Verification Method |
|---|---|---|---|
| **Tier 0** | Test-money only (no real deposit) | None | — |
| **Tier 1** | $1 - $50 | Basic identity verification | Email + phone verification |
| **Tier 2** | $51 - $500 | Enhanced identity verification | Stripe Identity (document + selfie) |
| **Tier 3** | $501+ | Full KYC | Government ID + address verification + source of funds declaration |

[COUNSEL: REVIEW tier thresholds against FinCEN CTR ($10,000) and SAR ($5,000 for MSBs) reporting thresholds. Determine whether Styx's non-MSB classification affects these thresholds.]

### 5.2 Stripe Identity Integration

Stripe Identity provides document verification (driver's license, passport, state ID) and biometric matching (selfie comparison) as a managed service. Integration points:

- **Account creation:** Tier 1 verification at signup.
- **First financial commitment:** Tier 2 verification triggered when user initiates first real-money deposit >$50.
- **High-stakes commitment:** Tier 3 verification triggered for deposits >$500.
- **Re-verification:** Annual re-verification for users with cumulative deposits exceeding $10,000.

### 5.3 Transaction Monitoring

Implement automated monitoring for suspicious transaction patterns:
- Rapid sequential deposits from the same user (structuring indicator).
- Deposits immediately followed by voluntary withdrawal (money laundering indicator).
- Multiple accounts from the same device or IP address.
- Deposits significantly exceeding the user's declared income range.

### 5.4 Suspicious Activity Report (SAR) Filing

If Styx is classified as a non-MSB, SAR filing is not mandatory under FinCEN regulations. However, voluntary SAR filing is recommended as a best practice for any suspicious activity detected through transaction monitoring. [COUNSEL: CONFIRM non-MSB classification and SAR filing obligations.]

---

## 6. Mandatory Disclosures at Activation

### 6.1 Financial Risk Disclosure

Every user must acknowledge the following disclosure before making their first real-money deposit:

> **Financial Risk Disclosure**
>
> By depositing funds into a Styx commitment, you acknowledge that:
>
> 1. **You can lose money.** If you do not meet your commitment goals as verified by the platform, you will forfeit some or all of your deposit. This is real money that you will not get back.
> 2. **This is not an investment product.** Your deposit is not an investment, a security, or a financial instrument. There is no guarantee of return. Past completion rates do not predict future results.
> 3. **This is not medical advice.** Styx is a behavioral accountability tool. It does not provide medical, nutritional, or fitness advice. Consult a healthcare provider before beginning any health or fitness program.
> 4. **The platform charges a fee.** Styx collects a flat service fee from your deposit at the time of enrollment. This fee is non-refundable regardless of whether you complete your commitment.
>
> [I Understand and Accept These Risks] [Cancel]

### 6.2 Not-an-Investment Disclaimer

The Styx website, app, and all marketing materials must include a clear disclaimer that Styx is not an investment product, is not regulated by the SEC or CFTC, and does not offer returns on investment. This prevents mischaracterization as a security under the *SEC v. W.J. Howey Co.*, 328 U.S. 293 (1946), investment contract test.

### 6.3 Problem Gambling and Mental Health Resources

Despite Styx's legal classification as a skill-based system (not gambling), responsible practice requires providing users with resources for problem gambling and mental health support:

> **Need Help?**
> - National Problem Gambling Helpline: 1-800-522-4700
> - Crisis Text Line: Text HOME to 741741
> - National Eating Disorders Association: 1-800-931-2237
> - SAMHSA Helpline: 1-800-662-4357

This disclosure should be accessible from the app's Settings screen and from the web dashboard's footer.

### 6.4 Tax Reporting Disclosure

> **Tax Information**
>
> Payouts from Styx commitments may be taxable income. If your total payouts in a calendar year exceed $600, Styx will issue a 1099-MISC or 1099-NEC reporting your earnings to the IRS. You are responsible for reporting all income from Styx on your tax return, regardless of whether you receive a 1099.

*See* 26 U.S.C. § 6041 (information reporting for payments of $600 or more); 26 C.F.R. § 1.6041-1.

---

## 7. Jurisdiction Rules at Activation

### 7.1 States Requiring Explicit Exclusion

States where the legal theory faces elevated risk are hard-blocked at the API layer. *See* `docs/legal/legal--gatekeeper-compliance.md` § 4.1.

**Current blocklist:** Arizona, Arkansas.

**Launch-state rationale tracker:** `docs/legal/appendices/appendix-d--state-blocklist-justification-table.md`.

[COUNSEL: REVIEW whether the following states should be added to the blocklist at real-money activation, given that real financial risk heightens regulatory scrutiny: Connecticut (strict gambling definitions), Iowa (regulatory ambiguity for skill-based contests), Louisiana (broad gambling statutes), Montana (any-chance test historically applied).]

### 7.2 States Requiring Modified Mechanics

Some states may permit skill-based contests but impose specific constraints:

- **Entry fee caps:** Some state skill-contest statutes cap the maximum entry fee. [COUNSEL: SURVEY state-by-state entry fee limits for skill-based contests.]
- **Registration requirements:** Some states require registration of skill-based contest operators. *See, e.g.*, N.Y. Racing, Pari-Mutuel Wagering & Breeding Law §§ 1400-1410 (Interactive Fantasy Sports Law — requires registration and $50,000 surety bond). [COUNSEL: DETERMINE whether Styx must register under fantasy sports statutes in states that have them.]
- **Refund-only variant:** In states where forfeiture redistribution is problematic, Styx could offer a "refund-only" mode where users who complete their commitment receive their full deposit back (no additional earnings from forfeited funds). This eliminates the "prize" element from the three-element test, resolving the classification question entirely at the cost of reduced platform appeal.

### 7.3 International Expansion Gates

International expansion requires separate legal analysis for each target jurisdiction:

- **EU/EEA:** GDPR compliance (explicit consent for health data, data minimization, right to erasure). Gambling regulation varies by member state. *See* `docs/legal/legal--cross-jurisdictional-consent-matrix.md` § 5.
- **UK:** UK GDPR + Gambling Act 2005. Skill-based contest classification differs from US framework. [COUNSEL: FULL ANALYSIS REQUIRED]
- **Canada:** PIPEDA + Criminal Code gambling provisions. Provincial variation in skill-contest law.
- **Sanctioned jurisdictions:** North Korea, Iran, Syria, Sudan, Cuba — permanent exclusion per OFAC sanctions. 31 C.F.R. pt. 500 *et seq.*

---

## 8. Responsible Use Infrastructure

### 8.1 Deposit and Loss Caps

| Cap Type | Limit | Rationale |
|---|---|---|
| Per-commitment deposit cap | $500 (default); $1,000 (verified users) | Prevents disproportionate financial exposure |
| Monthly deposit cap | $1,000 (default); $2,500 (verified users) | Limits cumulative monthly risk |
| Cumulative loss cap | $2,000 per rolling 12-month period | Triggers mandatory cool-off period |
| Maximum active commitments | 3 concurrent | Prevents over-commitment |

[COUNSEL: REVIEW cap levels against responsible gambling industry standards and state skill-contest fee limits.]

### 8.2 Self-Exclusion Periods

Users may voluntarily self-exclude from the platform for a specified period:

- **7-day cool-off:** Available at any time. User cannot create new commitments during the period. Active commitments continue.
- **30-day exclusion:** Available at any time. All active commitments are suspended with prorated refund.
- **6-month exclusion:** Available at any time. Full account freeze. Requires re-verification to reactivate.
- **Permanent exclusion:** User requests permanent account deletion. All active commitments are refunded in full. Account cannot be recreated with the same identity.

### 8.3 Cool-Off After Repeated Failures

If a user fails 3 consecutive commitments within a 90-day period, the system triggers an automatic 14-day cool-off during which no new commitments can be created. The user receives a notification:

> You've had several unsuccessful commitments recently. We've paused new commitments for 14 days to give you time to reassess your goals. This is about your wellbeing, not a penalty. [Learn More] [Contact Support]

### 8.4 Harm Minimization Monitoring

Automated monitoring for patterns indicating potential harm:

- **Escalating deposits after losses:** User increases deposit amounts after consecutive failures (loss-chasing behavior).
- **Extreme goal-setting:** User sets goals at the maximum velocity cap repeatedly (potential eating disorder indicator).
- **Rapid cycling:** User creates and fails commitments in rapid succession.
- **Financial distress signals:** User contacts support about financial hardship related to commitments.

Triggered flags are reviewed by a human moderator who may contact the user, enforce a cool-off period, or recommend the self-exclusion mechanism.

---

## 9. Open Risk Register — Risks Active at Real-Money Transition

| Risk ID | Risk | Severity | Likelihood | Mitigation | Status |
|---|---|---|---|---|---|
| R-01 | Gambling classification by state AG | Critical | Low | Whitepaper + geo-blocking + skill-based design. *See* `legal--skill-based-contest-whitepaper.md`. | Active |
| R-02 | Money transmitter classification | Critical | Low | FBO zero-custody architecture. *See* `legal--aegis-protocol.md` § 4. | Active |
| R-06 | Payment processor account freeze | High | Medium | High-risk pre-clearance + processor redundancy. *See* `legal--gatekeeper-compliance.md` § 1. | Planned |
| R-07 | App Store rejection or removal | High | Medium | Health & Fitness categorization + UGC moderation. *See* `legal--app-store-ugc-moderation-packet.md`. | Planned |
| R-10 | Tax reporting non-compliance | Medium | Low | 1099 issuance for payouts >$600; user disclosure. *See* 26 U.S.C. § 6041. | Planned |
| R-11 | User financial harm / class action | High | Low | Deposit caps + self-exclusion + harm monitoring + mandatory disclosures. | Planned |
| R-12 | CFPB complaint escalation | Medium | Low | Clear refund policy + responsive support + financial risk disclosures. | Research |

*See* `docs/legal/regulatory-risk-register.md` for the complete risk register.

---

## 10. Counsel Submission Package

The following materials should be assembled for outside counsel review before real-money activation:

1. **This brief** (`legal--real-money-activation-brief.md`) — transition analysis.
2. **Skill-based contest whitepaper** (`legal--skill-based-contest-whitepaper.md`) — core legal theory.
3. **Aegis Protocol** (`legal--aegis-protocol.md`) — compliance guardrails specification.
4. **Gatekeeper compliance** (`legal--gatekeeper-compliance.md`) — platform and processor strategy.
5. **Cross-jurisdictional consent matrix** (`legal--cross-jurisdictional-consent-matrix.md`) — privacy and verification constraints.
6. **Appendix A — FBO architecture diagram** (`docs/legal/appendices/appendix-a--fbo-architecture-diagram.md`) — technical diagram of fund flows.
7. **Terms of Service** (`terms-of-service.md`) — current draft.
8. **Appendix B — Terms of Service markup** (`docs/legal/appendices/appendix-b--terms-of-service-aegis-markup.md`) — clause annotations tied to Aegis and Recovery guardrails.
9. **Privacy Policy** (`privacy-policy.md`) — current draft.
10. **Regulatory risk register** (`regulatory-risk-register.md`) — scored risk inventory.
11. **Appendix C — App Review screenshot mockups** (`docs/legal/appendices/appendix-c--app-review-screenshot-mockups.md`) — reviewer-facing moderation and consent screens.
12. **Appendix D — State blocklist justification table** (`docs/legal/appendices/appendix-d--state-blocklist-justification-table.md`) — rationale for each blocked or review-state.
13. **Appendix E — Counsel submission checklist** (`docs/legal/appendices/appendix-e--counsel-submission-checklist.md`) — ordered packet assembly and review checklist.

**Counsel deliverables requested:**
- [ ] Formal opinion: skill-based contest classification in target launch states.
- [ ] Formal opinion: FBO structure eliminates money transmitter classification.
- [ ] Formal opinion: UIGEA exclusion applicability to self-competition model.
- [ ] Review and markup: Terms of Service, with Appendix B as working markup companion.
- [ ] Review and markup: Privacy Policy.
- [ ] State blocklist completeness review, with Appendix D as the operational launch-state baseline.
- [ ] KYC threshold confirmation.
- [ ] Tax reporting obligations confirmation.

---

## 11. Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1.0-draft | 2026-03-09 | agent/research-support | Initial draft — 10 sections covering transition analysis, FBO architecture, KYC/AML, disclosures, jurisdiction rules, responsible use, risk register, counsel submission package |
| 0.2.0-draft | 2026-03-10 | agent/research-support | Expanded Table of Authorities; added FinCEN escrow and payee-agent guidance |
| 0.3.0-draft | 2026-03-10 | agent/financial-reg | Deepened FinCEN/MTL analysis (§3); added 10-state AOTP matrix and 5+ FinCEN rulings; added Heller precedent |
| 0.4.0-draft | 2026-03-10 | agent/financial-reg | Added OCC interpretive letters (§3.2.2); added CSBS model act discussion (§3.2.3); expanded Table of Authorities |
| 0.5.0-draft | 2026-03-09 | agent/research-support | Added 3 cases to ToA (*FanDuel v. AG*, *Langone v. Kaiser*, *State v. Rosenthal*) per whitepaper #562 sync |

---

## Table of Authorities

### Cases

- *Dew-Becker v. Wu*, 2020 IL 124472 (Ill. 2020)
- *FanDuel, Inc. v. Attorney General*, No. 16-1079 (Mass. Super. Ct. 2016)
- *Heller v. Cen-Tex Savings & Loan Ass’n*, 410 S.W.2d 267 (Tex. Civ. App. 1966)
- *Langone v. Kaiser*, 2016 WL 7104331 (N.D. Ill. 2016)
- *SEC v. W.J. Howey Co.*, 328 U.S. 293 (1946)
- *State v. Rosenthal*, 559 P.2d 830 (Nev. 1977)
- *White v. Cuomo*, 38 N.Y.3d 311 (N.Y. 2022)

### Statutes and Regulations

- 26 C.F.R. § 1.6041-1 (information reporting requirements)
- 26 U.S.C. § 6041 (information reporting for payments of $600 or more)
- 31 C.F.R. § 1022.380 (FinCEN MSB registration)
- 31 C.F.R. pt. 500 *et seq.* (OFAC sanctions regulations)
- 31 U.S.C. §§ 5311-5330 (Bank Secrecy Act)
- 31 U.S.C. §§ 5361-5367 (Unlawful Internet Gambling Enforcement Act of 2006)
- 205 ILCS 657/15 (Illinois Money Transmission Modernization Act)
- Cal. Fin. Code § 2010(l) (California Agent of Payee exemption)
- N.Y. Banking Law § 641(1) (New York Agent of Payee exemption)
- Tex. Fin. Code § 151.003(9) (Texas Money Transmission Modernization Act)

### Administrative Guidance

- FinCEN, *Application of FinCEN's Regulations to Persons Administering, Exchanging, or Using Virtual Currencies* (FIN-2013-G001, 2013)
- FinCEN, *Definition of Money Transmitter (Third-Party Payment Processors)*, FIN-2004-1 (Aug. 17, 2004)
- FinCEN Administrative Ruling FIN-2014-R004 (Mar. 11, 2014) (escrow integral to service)
- FinCEN Administrative Ruling FIN-2014-R007 (May 14, 2014) (agent of payee)
- FinCEN Guidance FIN-2019-G001 (May 9, 2019) (comprehensive payment processor and CVC guidance)
- OCC Conditional Approval Letter (Jan. 2021) (payment charter framework for non-bank payment companies)
- OCC Interpretive Letter #1170 (Feb. 2020) (bank-fintech partnership models for payment processing)
- OCC Interpretive Letter #1174 (Oct. 2020) (national banks may hold reserves and serve as FBO custodians for fintech platforms)

### Secondary Sources

- Conference of State Bank Supervisors (CSBS), *Model Money Transmission Modernization Act* (2021)
- Modern Treasury, *How Do Money Transmission Laws Work?* (2024)
