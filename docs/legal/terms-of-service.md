---
generated: true
department: LEG
artifact_id: L2
governing_sop: "SOP--legal-documentation.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Terms of Service (Draft)

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-03-08_
_Effective date: [TBD -- prior to beta launch]_

**IMPORTANT:** This is an internal draft for legal review. It is not a finalized, legally binding document. All provisions are subject to revision by qualified legal counsel before publication.

Companion markup for counsel review: `docs/legal/appendices/appendix-b--terms-of-service-aegis-markup.md`.

---

## 1. Definitions

**"Styx"** or **"Platform"** refers to the peer-audited behavioral contract platform operated by [ORGANVM Entity TBD] ("Company", "we", "us").

**"Oath"** means a behavioral contract created by a User on the Platform, specifying a habit commitment, verification criteria, duration, and financial deposit.

**"Vault"** means the For Benefit Of (FBO) escrow account where Oath deposits are held during the contract period.

**"Fury"** means a peer auditor who has been approved to verify User proof submissions on the Platform.

**"Integrity Score"** means the numerical reputation score assigned to each User and Fury based on their Platform activity history.

**"Aegis Protocol"** means the health and safety guardrail system that enforces minimum safety thresholds on biological Oaths.

**"Recovery Protocol"** means the specialized guardrail system for no-contact behavioral contracts.

**"Deposit"** means the financial amount a User places into the Vault when creating an Oath.

**"Platform Fee"** means the non-refundable service fee charged by the Company for each Oath ($9.00 for a standard $39.00 Oath, or proportional for other amounts).

**"Bounty"** means the compensation paid to Furies for completing proof verification audits.

## 2. Nature of the Service

### 2.1 Styx Is Not Gambling

Styx is a behavioral commitment platform, not a gambling service. The critical distinction:

- **Gambling** involves wagering on outcomes the participant cannot control (dice rolls, sports results, market movements).
- **Styx Oaths** involve committing to outcomes the participant directly controls (exercising, studying, maintaining no-contact).

The User has full agency over whether their Oath succeeds or fails. The financial deposit functions as a commitment device -- a well-established behavioral economics tool -- not a wager. The deposit creates loss aversion (lambda = 1.955 per Kahneman & Tversky) that motivates follow-through, not risk-seeking behavior.

For the complete legal analysis of this classification, see `docs/legal/legal--performance-wagering.md`.

### 2.2 No Investment or Financial Return

Vault deposits do not earn interest, yield, or appreciation. A successful Oath returns the original deposit amount. There is no mechanism for a User to receive more money than they deposited. Styx is not an investment platform, securities offering, or financial instrument.

## 3. Eligibility

### 3.1 Age Requirement

You must be at least 18 years old to use Styx. By creating an account, you represent and warrant that you are 18 or older.

### 3.2 Geographic Restriction

Styx is currently available only to Users located in the United States. This restriction is enforced by the `STYX_ALLOWLIST_US_ONLY` feature flag. Users who attempt to access the Platform from outside the United States will be denied registration. VPN circumvention of this restriction is a violation of these Terms and grounds for account termination with deposit forfeit.

Launch-state rationale companion: `docs/legal/appendices/appendix-d--state-blocklist-justification-table.md`.

### 3.3 Identity Verification

The Company reserves the right to require identity verification (KYC) at any time, including but not limited to:
- Account registration
- Vault deposits exceeding $100
- Fury auditor application
- Practitioner account creation
- Suspected fraud or Terms violation

## 4. Oaths (Behavioral Contracts)

### 4.1 Creation and Funding

When you create an Oath, you agree to:
- Deposit the specified amount into the Vault via Stripe
- Pay the non-refundable Platform Fee at the time of Oath creation
- Comply with the verification criteria you specified
- Submit proof of compliance within each verification window
- Accept the Fury audit process as the arbiter of compliance

### 4.2 Deposit Limits

Deposit amounts are limited by your Integrity Score tier:

| Integrity Score | Maximum Deposit per Oath |
|-----------------|-------------------------|
| 0-40 | $50 |
| 41-60 | $100 |
| 61-80 | $200 |
| 81-100 | $500 |

The Company reserves the right to adjust these limits at any time.

### 4.3 Grace Days

Each Oath includes 2 grace days per month. A grace day may be used when you are unable to submit proof due to illness, travel, or other reasonable circumstances. Grace days are non-transferable between months and do not accumulate.

### 4.4 Cancellation

You may cancel an active Oath at any time. Cancellation forfeits your Vault deposit. The Platform Fee is non-refundable. Cancellation is immediate and irreversible. There is no cooling-off period after Oath creation and funding.

### 4.5 Settlement

- **Successful Oath:** Your full Vault deposit is returned to your Platform wallet within 48 hours of final verification.
- **Failed Oath:** Your Vault deposit is forfeited. Forfeited funds are distributed as Fury bounties and Platform revenue according to the prevailing distribution schedule.
- **Disputed Oath:** If a Fury audit result is disputed, an elevated review panel of 7 Furies will re-evaluate. The elevated panel's decision is final.

### 4.6 Oath Categories and Special Protocols

**Biological Oaths** are subject to the Aegis Protocol. The Platform will reject any biological Oath that:
- Targets a BMI below 18.5
- Implies a weight loss rate exceeding 2% of body weight per week
- Otherwise violates health safety thresholds as determined by the Company

**Recovery Oaths** (no-contact contracts) are subject to the Recovery Protocol:
- Maximum duration: 30 days
- Maximum no-contact targets: 3 per Oath
- Mandatory cooldown period between consecutive Recovery Oaths
- No-contact target identities are never disclosed to Furies

See `docs/legal/legal--aegis-protocol.md` for Aegis Protocol details.
See `docs/legal/appendices/appendix-b--terms-of-service-aegis-markup.md` for the clause-to-guardrail mapping used in the counsel packet.

## 5. Fury Auditor Obligations

### 5.1 Application and Approval

Fury status is granted at the Company's sole discretion. Minimum requirements include:
- Integrity Score of 60 or higher
- Completed identity verification
- Agreement to the Fury Code of Conduct

### 5.2 Auditor Deposit

Furies deposit $2.00 per audit assignment. This deposit is returned upon casting a vote that aligns with the quorum consensus. Dissenting votes that are later overturned in an elevated review also result in deposit return. Furies who vote in bad faith (e.g., always voting PASS without reviewing proof) forfeit their deposit and may be permanently ejected.

### 5.3 Audit Standards

Furies must:
- Review proof submissions within 24 hours of assignment
- Base votes solely on the evidence presented (photo, metadata, supporting documentation)
- Recuse themselves from audits where they have a personal relationship with the User
- Not communicate with the User about pending audits
- Maintain confidentiality of all proof submissions

### 5.4 Quorum

A minimum of 3-of-5 assigned Furies must agree for a verdict to stand. If quorum cannot be reached within 48 hours, the audit is escalated to an elevated panel.

## 6. FBO Escrow and Financial Terms

### 6.1 Escrow Structure

All Vault deposits are held in a For Benefit Of (FBO) segregated account through Stripe. User funds are not commingled with Company operating funds. The Company does not use, invest, or derive interest from escrowed user funds.

Fund-flow diagram used in the counsel and processor packet: `docs/legal/appendices/appendix-a--fbo-architecture-diagram.md`.

### 6.2 Payment Processing

All payments are processed through Stripe. By using Styx, you also agree to Stripe's Terms of Service and Connected Account Agreement. The Company does not store credit card numbers or banking credentials.

### 6.3 Fees

| Fee Type | Amount | Refundable |
|----------|--------|------------|
| Platform Fee (standard Oath) | $9.00 | No |
| Oath Deposit (standard) | $30.00 (held in escrow) | Yes (on successful completion) |
| Fury Auditor Deposit | $2.00 per audit | Yes (on quorum-aligned vote) |
| Withdrawal Fee | $0.00 | N/A |

### 6.4 Taxes

Users are responsible for any tax obligations arising from Fury bounty income or deposit forfeitures. The Company will issue 1099 forms to Furies earning $600 or more in bounties per calendar year, as required by US tax law.

## 7. Prohibited Conduct

You agree not to:
- Create Oaths with the intent to defraud (e.g., creating easily-passable Oaths to farm Integrity Score)
- Submit fraudulent proof (fabricated photos, manipulated metadata)
- Collude with Furies to influence audit outcomes
- Use the Platform for money laundering or structuring
- Circumvent the US-only geographic restriction
- Create Oaths that endanger your health in violation of Aegis Protocol limits
- Harass, threaten, or retaliate against Furies for unfavorable audit decisions
- Create multiple accounts
- Automate proof submission without genuine compliance

## 8. Dispute Resolution

### 8.1 Elevated Review

Disputes about Fury audit decisions are resolved through the elevated review process (7-Fury panel). The elevated panel's decision is final and binding.

### 8.2 Arbitration

Any dispute not resolvable through the elevated review process shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. You waive the right to participate in class action lawsuits or class-wide arbitration.

### 8.3 Governing Law

These Terms are governed by the laws of the State of Oregon, without regard to conflict of law principles. Render infrastructure is hosted in Oregon.

## 9. Data and Privacy

User data is collected, stored, and processed in accordance with our Privacy Policy (see `docs/legal/privacy-policy.md`). Key data categories include:
- Account information (PII)
- Financial data (processed by Stripe)
- Behavioral data (Oath history, proof submissions)
- Device data (EXIF metadata from proof photos)

## 10. Limitation of Liability

THE PLATFORM IS PROVIDED "AS IS." TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR:
- Emotional distress arising from Oath failure or deposit forfeit
- Health consequences of behavioral commitments (even within Aegis Protocol limits)
- Fury audit decisions that the User considers unfair
- Stripe service interruptions affecting deposit or withdrawal processing
- Loss of data due to infrastructure failures

THE COMPANY'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT OF PLATFORM FEES PAID BY THE USER IN THE 12 MONTHS PRECEDING THE CLAIM.

## 11. Modifications

The Company reserves the right to modify these Terms at any time. Users will be notified of material changes via email and in-app notification at least 30 days before changes take effect. Continued use of the Platform after the effective date constitutes acceptance.

## 12. Termination

The Company may suspend or terminate your account for violation of these Terms. Upon termination:
- Active Oaths are cancelled with deposit forfeit
- Available wallet balance is returned within 30 days
- Fury status is revoked
- Account data is retained per the Privacy Policy retention schedule

## 13. Contact

For questions about these Terms, contact: [legal@styx.app -- TBD]

---

_This draft requires review by qualified legal counsel specializing in fintech, consumer protection, and state gaming law before publication. See `docs/legal/regulatory-risk-register.md` for identified legal risks._
