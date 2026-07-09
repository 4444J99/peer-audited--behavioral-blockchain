---
generated: true
department: LEG
artifact_id: L3
governing_sop: "SOP--legal-documentation.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Privacy Policy (Draft)

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-03-08_
_Effective date: [TBD -- prior to beta launch]_

**IMPORTANT:** This is an internal draft for legal review. It is not a finalized, legally binding document. All provisions are subject to revision by qualified legal counsel before publication. Special attention is needed for CCPA compliance, health data handling, and AI processing disclosures.

---

## 1. Introduction

This Privacy Policy describes how [ORGANVM Entity TBD] ("Company", "we", "us") collects, uses, stores, and shares personal information through the Styx platform ("Platform"). Styx is a peer-audited behavioral contract platform where users stake financial deposits on habit commitments and peer auditors ("Furies") verify compliance.

Because Styx handles financial, behavioral, and potentially health-adjacent data, this policy is more detailed than a typical consumer app privacy policy. We take the sensitivity of this data seriously.

## 2. Information We Collect

### 2.1 Account Information (PII)

Collected at registration and profile creation:

| Data Point | Purpose | Required |
|------------|---------|----------|
| Full legal name | Identity verification, 1099 issuance | Yes |
| Email address | Account access, notifications, communications | Yes |
| Password (hashed) | Authentication | Yes |
| Date of birth | Age verification (18+ requirement) | Yes |
| Phone number | Two-factor authentication, account recovery | Optional |
| Mailing address | 1099 issuance (Furies earning $600+/year) | Conditional |
| Profile photo | Account identification | Optional |

### 2.2 Financial Data

Processed through Stripe (we do not store raw payment credentials):

| Data Point | Purpose | Stored By |
|------------|---------|-----------|
| Credit/debit card details | Vault deposit funding | Stripe (PCI-DSS compliant) |
| Bank account details | Withdrawal processing | Stripe |
| Transaction history | Ledger integrity, dispute resolution | Styx (double-entry ledger) |
| Vault deposit amounts | Escrow management | Styx + Stripe FBO |
| Platform fee payments | Revenue accounting | Styx + Stripe |
| Fury bounty earnings | Bounty distribution, tax reporting | Styx + Stripe |

### 2.3 Behavioral and Health Data

Collected through Oath creation and proof submission:

| Data Point | Purpose | Sensitivity |
|------------|---------|-------------|
| Oath parameters (habit type, duration, frequency) | Contract management | Medium |
| Oath category (Biological, Recovery, etc.) | Feature routing, safety protocols | High |
| Proof photos | Fury audit verification | High |
| Proof submission timestamps | Verification window compliance | Medium |
| Completion/failure history | Integrity Score calculation | Medium |
| BMI data (biological oaths only) | Aegis Protocol safety validation | High |
| Weight targets (biological oaths only) | Aegis velocity cap enforcement | High |
| No-contact target identifiers (recovery oaths) | Recovery Protocol enforcement | Very High |
| Call/text log screenshots (recovery oaths) | No-contact verification | Very High |

**Special note on health data:** Styx is not a healthcare provider and does not claim HIPAA compliance. However, biological Oath data (BMI, weight targets) and recovery Oath data (behavioral patterns) are treated with health-data-level security controls. See Section 7 for retention and deletion.

### 2.4 Device and Technical Data

Collected automatically through Platform use:

| Data Point | Purpose | Source |
|------------|---------|--------|
| IP address | Geofencing (US-only), security | Server logs |
| Browser/device fingerprint | Fraud detection | Client-side |
| EXIF metadata from proof photos | Timestamp/location verification for Fury audits | Photo uploads |
| GPS coordinates (from EXIF) | Proof location verification | Photo uploads |
| Device type and OS | Compatibility, bug triage | Client-side |
| Session duration and navigation | UX analytics | Client-side |

**EXIF metadata disclosure:** When you upload a proof photo, we extract and store EXIF metadata including timestamp, GPS coordinates, camera model, and image dimensions. This metadata is shared with Fury auditors to verify proof authenticity. If you prefer not to share location data, you may disable GPS in your device camera settings, but Furies may consider location-free proofs less verifiable.

### 2.5 AI Processing Data

Data processed by third-party AI services:

| Feature | AI Provider | Data Sent | Data Retained by Provider |
|---------|-------------|-----------|---------------------------|
| Grill Me (motivation challenge) | Google Gemini | Oath description, user prompt | Per Google's AI terms (transient) |
| ELI5 (explain terms) | Groq (Llama) | Contract parameters, user question | Per Groq's terms (not retained) |
| Proof pre-screening (future) | TBD | Proof photo, Oath criteria | TBD |

We do not send financial data, PII, or no-contact target identities to AI providers. AI prompts are constructed with anonymized context only.

## 3. How We Use Your Information

### 3.1 Core Platform Operations

- Creating and managing Oaths
- Processing Vault deposits and settlements through Stripe FBO
- Assigning and managing Fury audits
- Calculating and updating Integrity Scores
- Enforcing Aegis Protocol safety thresholds
- Enforcing Recovery Protocol guardrails
- Sending notifications (verification windows, audit results, escrow movements)

### 3.2 Safety and Security

- Verifying US-only eligibility (IP geofencing)
- Detecting fraud (fake proofs, collusion, multiple accounts)
- Enforcing rate limits and abuse prevention
- Identity verification (KYC) when required
- AML screening for high-value transactions

### 3.3 Communication

- Transactional emails (Oath confirmations, audit results, settlement notices)
- Account security alerts (password changes, new device logins)
- Product updates (with opt-out)
- Tax documentation (1099 forms for Furies)

### 3.4 Analytics and Improvement

- Aggregate usage statistics (anonymized)
- A/B testing for UX improvements
- Error monitoring and debugging
- Performance optimization

## 4. How We Share Your Information

### 4.1 With Fury Auditors

When a Fury is assigned to audit your proof submission, they receive:
- Your proof photo
- EXIF metadata (timestamp, GPS coordinates)
- Oath category and verification criteria
- Your current Integrity Score

Furies do **NOT** receive:
- Your name, email, or any PII
- Your financial details or deposit amount
- No-contact target identities (Recovery Oaths)
- Your full Oath history

### 4.2 With Third-Party Processors

| Processor | Data Shared | Purpose | Location |
|-----------|-------------|---------|----------|
| **Stripe** | Financial data, identity data (for KYC) | Payment processing, FBO escrow | US |
| **Cloudflare R2** | Proof photos | Object storage | US (Oregon) |
| **Render** | Application data (encrypted at rest) | Infrastructure hosting | US (Oregon) |
| **Google Gemini** | Anonymized Oath context | Grill Me AI feature | US |
| **Groq** | Anonymized contract parameters | ELI5 AI feature | US |
| **SendGrid** (or equivalent) | Email addresses | Transactional email delivery | US |

### 4.3 With Law Enforcement

We will disclose personal information when required by law, subpoena, court order, or government request. We will notify you of such requests unless prohibited by law.

### 4.4 With B2B Practitioners

If your Oath was assigned by a B2B practitioner (therapist/coach), the practitioner receives:
- Oath status (active, completed, failed)
- Compliance rate (percentage of verification windows met)
- Completion date

Practitioners do **NOT** receive access to your proof photos, EXIF metadata, or Fury audit details unless you explicitly grant permission.

## 5. Data Storage and Security

### 5.1 Encryption

- **In transit:** TLS 1.3 for all connections
- **At rest:** PostgreSQL transparent data encryption (TDE)
- **Proof photos:** Encrypted in Cloudflare R2 with server-side encryption
- **Passwords:** bcrypt hashed with per-user salt (never stored in plaintext)

### 5.2 Access Controls

- Role-based access control (RBAC) for all internal systems
- Admin access requires two-factor authentication
- Database access restricted to application service accounts
- No employee has direct access to production user data without audit trail

### 5.3 Infrastructure

- Hosted on Render (US-Oregon region)
- PostgreSQL 15 with automated daily backups (30-day retention)
- Redis 7 for session management and job queues (ephemeral, not backed up)
- Cloudflare R2 for proof photo storage (99.999999999% durability)

## 6. Your Rights

### 6.1 Access

You may request a copy of all personal data we hold about you. We will provide this within 30 days in a machine-readable format (JSON).

### 6.2 Correction

You may update your account information at any time through your Profile settings. For corrections to ledger entries or Integrity Score, contact support.

### 6.3 Deletion

You may request deletion of your account and associated data. Upon deletion:
- Account PII is permanently erased within 30 days
- Proof photos are deleted from Cloudflare R2 within 30 days
- Ledger entries are anonymized (financial records retained for tax/compliance, but de-identified)
- Integrity Score history is deleted
- Fury audit records you participated in are anonymized (your identity removed, audit data retained for system integrity)

**Exception:** We retain anonymized transaction records for 7 years as required by US tax law and financial regulations.

### 6.4 Portability

You may export your data in JSON format, including:
- Oath history (parameters, outcomes)
- Proof submission history (metadata, not photos -- photos available as separate download)
- Integrity Score history
- Ledger transaction history
- Fury audit history (if applicable)

### 6.5 Opt-Out

You may opt out of:
- Marketing communications (one-click unsubscribe)
- Analytics tracking (browser Do Not Track honored)
- AI feature processing (disable Grill Me and ELI5 in settings)

You may **NOT** opt out of:
- Transactional communications (Oath confirmations, audit results)
- EXIF metadata extraction from proof photos (required for Fury verification)
- Security monitoring and fraud detection

## 7. Data Retention

| Data Category | Retention Period | Basis |
|---------------|-----------------|-------|
| Account PII | Duration of account + 30 days after deletion | Service provision |
| Financial records (ledger) | 7 years (anonymized after account deletion) | US tax law, IRS requirements |
| Proof photos | Duration of Oath + 90 days, or until account deletion | Dispute resolution window |
| EXIF metadata | Same as proof photos | Tied to proof lifecycle |
| Fury audit records | 3 years (anonymized) | Platform integrity |
| Behavioral data (Oath history) | Duration of account + 30 days after deletion | Service provision |
| No-contact target identifiers | Duration of Recovery Oath + 30 days | Recovery Protocol |
| Server logs (IP, requests) | 90 days | Security, debugging |
| AI processing logs | Not retained by Styx; see provider terms | Transient |

## 8. CCPA Compliance (California Residents)

If you are a California resident, the California Consumer Privacy Act (CCPA) provides additional rights:

### 8.1 Right to Know

You have the right to request disclosure of:
- The categories of personal information collected
- The sources of personal information
- The business purpose for collection
- The categories of third parties with whom we share personal information
- The specific pieces of personal information collected about you

### 8.2 Right to Delete

You have the right to request deletion of personal information collected from you, subject to the exceptions in Section 6.3.

### 8.3 Right to Non-Discrimination

We will not discriminate against you for exercising your CCPA rights. You will not receive different pricing, service quality, or access levels.

### 8.4 Categories of Information Sold

**We do not sell personal information.** We have not sold personal information in the preceding 12 months. We do not intend to sell personal information.

### 8.5 Authorized Agents

You may designate an authorized agent to submit CCPA requests on your behalf. The agent must provide written authorization signed by you.

### 8.6 Contact for CCPA Requests

CCPA requests may be submitted to: [privacy@styx.app -- TBD]

We will verify your identity before processing any request. Response time: within 45 days, extendable to 90 days with notice.

## 9. Children's Privacy

Styx is not directed at children under 18. We do not knowingly collect personal information from anyone under 18. If we discover that a user is under 18, we will immediately terminate their account and delete all associated data, including forfeiting any active Vault deposits to the Company (not distributed as bounties).

## 10. International Users

Styx is currently available only in the United States. If you access the Platform from outside the US in violation of the Terms of Service, be aware that your data will be processed and stored in the United States. We make no representations about compliance with non-US data protection laws (including GDPR) at this time.

## 11. Changes to This Policy

We will notify you of material changes to this Privacy Policy via email and in-app notification at least 30 days before changes take effect. Non-material changes (formatting, clarifications) may be made without notice. The "Last updated" date at the top of this document reflects the most recent revision.

## 12. Contact

For privacy-related questions or requests: [privacy@styx.app -- TBD]

For data deletion requests: [privacy@styx.app -- TBD] with subject line "Data Deletion Request"

---

_This draft requires review by qualified legal counsel specializing in consumer privacy, CCPA, and health data handling before publication. Particular attention needed for: (1) whether BMI/weight data triggers HIPAA-adjacent obligations, (2) EXIF/GPS data consent requirements by state, (3) AI processing disclosure adequacy under emerging AI regulation._
