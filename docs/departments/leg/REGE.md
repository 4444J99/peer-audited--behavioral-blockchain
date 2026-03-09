---
entity: REGE
version: "1.0"
department: leg
name: Legal
persona: styx-legal
governing_sops:
  - SOP--regulatory-monitoring
  - SOP--compliance-review
  - SOP--privacy-impact-assessment
  - SOP--contract-template-review
autonomy: guarded
product: styx
---

# REGE: Legal Department

## 1. Mission & Scope

Legal owns regulatory compliance, intellectual property protection, and risk mitigation for a product that sits on the knife-edge between "skill-based contest" and "gambling" under US law. Styx holds user funds in Stripe escrow, employs peer auditors (Furies) who make pass/fail judgments on behavioral proofs, and operates across state lines with varying gambling, consumer protection, and data privacy statutes. The department ensures the platform never crosses into unlicensed gambling territory, that user funds are handled lawfully, and that the Fury auditor relationship does not create unintended employment or contractor liability.

At PUBLIC_PROCESS stage, Legal's primary work is: (1) finalizing Terms of Service and Privacy Policy for beta launch, (2) validating the Aegis Protocol (the compliance guardrail system that restricts high-risk contract categories and enforces health-metric minimums), (3) conducting a 50-state analysis of the "commitment device" classification to identify states where Styx may need additional licensing or must exclude users, (4) ensuring Stripe's Restricted Business policies are satisfied (Styx must avoid being classified as "gambling" by payment processors), and (5) structuring the Fury auditor relationship to avoid employment classification risk.

Daily work involves reviewing Terms of Service violation flags and monitoring for regulatory news affecting commitment-device platforms. Weekly rhythms include scanning state AG announcements, FTC guidance, and app store policy updates. Monthly cycles cover full compliance checklist reviews and privacy impact reassessment. Quarterly work addresses comprehensive regulatory audits, IP portfolio review, and insurance coverage evaluation.

## 2. Operational Scope

### Daily

| ID | Activity | Output |
|----|----------|--------|
| D1 | Review ToS violation flags: check for users attempting prohibited contract categories (biological oaths, self-harm adjacent, third-party harm) | Violation log with disposition (warn, suspend, ban) |
| D2 | Monitor GoalEthicsService rejection logs for edge cases that may indicate a category gap | Ethics service gap notes |
| D3 | Review any user disputes/appeals ($5 dispute fee contracts) for procedural compliance | Dispute disposition log |
| D4 | Check Stripe dashboard for chargeback or fraud flags on escrow transactions | Chargeback response queue |

### Weekly

| ID | Activity | Output |
|----|----------|--------|
| W1 | Regulatory news scan: FTC, state AG announcements, CFPB guidance on fintech/wagering products | Regulatory digest with action items |
| W2 | App store policy monitoring: Apple Guideline 5.3 (gambling), Google Play Real-Money Gambling policy | Platform policy compliance note |
| W3 | Review any new feature specs from Product for legal risk (escrow changes, new contract categories, Fury incentive changes) | Legal review memo on pending features |
| W4 | Stripe Restricted Business list review: verify Styx's MCC code and business description remain compliant | Stripe compliance status |
| W5 | Review Fury auditor complaints or classification concerns | Auditor relationship health note |

### Monthly

| ID | Activity | Output |
|----|----------|--------|
| M1 | Full compliance checklist review: Aegis Protocol controls, GoalEthicsService rules, age verification, health-metric minimums, state exclusion list | Compliance checklist with pass/fail per control |
| M2 | Privacy impact reassessment: review new data collection points, third-party integrations, R2 proof storage retention policies | Privacy impact update |
| M3 | User agreement refresh check: compare live ToS/Privacy Policy against product changes shipped in the last 30 days | ToS drift report; update drafts if needed |
| M4 | Fury auditor agreement review: assess contractor vs. employee classification risk under current engagement model | Auditor classification memo |
| M5 | Chargeback and dispute trend analysis: identify patterns that may indicate systemic compliance issues | Dispute trend report |

### Quarterly

| ID | Activity | Output |
|----|----------|--------|
| Q1 | Full regulatory audit: 50-state gambling law compliance, federal wire fraud / illegal gambling transmission analysis, CFPB fintech guidance | Regulatory audit report |
| Q2 | IP review: patent landscape scan for commitment-device mechanics, trademark status, trade secret inventory | IP status report |
| Q3 | Insurance coverage review: professional liability, cyber liability, errors & omissions for escrow handling | Insurance gap analysis |
| Q4 | Fury auditor legal structure review: 1099 compliance, state-specific contractor classification tests (ABC test states), arbitration clause effectiveness | Auditor legal structure memo |

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness (days) | Last Updated | Status |
|----|------|------|-------|-------------------|--------------|--------|
| L1 | Aegis Protocol | `docs/legal/legal--aegis-protocol.md` | BUILD | 30 | — | active |
| L2 | Terms of Service | `docs/departments/leg/artifacts/terms-of-service.md` | SHAPE | 30 | — | dormant |
| L3 | Privacy Policy | `docs/departments/leg/artifacts/privacy-policy.md` | SHAPE | 30 | — | dormant |
| L4 | Compliance Guardrails (Research) | `docs/legal/legal--compliance-guardrails.md` | SHAPE | 60 | — | active |
| L5 | Regulatory Risk Register | `docs/departments/leg/artifacts/regulatory-risk-register.md` | SHAPE | 30 | — | dormant |
| L6 | Gatekeeper Compliance | `docs/legal/legal--gatekeeper-compliance.md` | SHAPE | 60 | — | active |
| L7 | IP Assignment Agreement | `docs/departments/leg/artifacts/ip-assignment.md` | SHAPE | 180 | — | dormant |
| L8 | Founder Agreement | `docs/legal/legal--founder-agreement-draft.md` | SHAPE | 90 | — | active |
| L9 | Performance Wagering Analysis | `docs/legal/legal--performance-wagering.md` | SHAPE | 90 | — | active |
| L10 | State Exclusion List | `docs/departments/leg/artifacts/state-exclusion-list.md` | SHAPE | 90 | — | dormant |
| L11 | Fury Auditor Agreement Template | `docs/departments/leg/artifacts/fury-auditor-agreement.md` | SHAPE | 60 | — | dormant |

## 4. Generative Prompts (GEN:)

### GEN:regulatory-scan

- **Trigger:** W1 (weekly regulatory scan) or when a specific regulatory event is flagged (e.g., new state gambling law, FTC enforcement action against a commitment-device company)
- **Input:** FTC press releases, state AG websites for top-10 user states, CFPB bulletins, relevant legal blogs (Ballard Spahr, Ifrah Law gambling/fintech updates), app store developer policy changelogs
- **Action:** Classify each development by relevance to Styx: (1) direct impact (law specifically covers commitment devices or peer-audit platforms), (2) adjacent impact (fintech escrow regulation, gig-worker classification affecting Furies), (3) informational (broader trend). For direct-impact items, draft a risk assessment with recommended action.
- **Output:** Regulatory digest appended to `artifacts/regulatory-risk-register.md`; direct-impact items generate GitHub issues with `blocked` label if human action required
- **Guardrails:** Never provide definitive legal advice — frame all outputs as "analysis for founder + outside counsel review." Flag any development that could require Styx to cease operations in a state within 90 days as P0.

### GEN:compliance-review

- **Trigger:** M1 (monthly compliance checklist) or when Engineering ships a feature touching escrow, contract creation, Fury routing, or user data
- **Input:** Current Aegis Protocol controls, GoalEthicsService configuration, feature diff from Engineering, state exclusion list, Stripe MCC classification
- **Action:** Walk through each compliance control: (1) age verification enforced? (2) health-metric minimums active? (3) prohibited categories blocked by GoalEthicsService? (4) escrow flow matches Stripe's non-gambling classification? (5) state-excluded users cannot create contracts? (6) data retention policies enforced on R2 proof storage? (7) Fury auditor selection is not creating de facto employment? Generate pass/fail per control with evidence links.
- **Output:** Compliance checklist report; failures generate `signal:compliance-alert`
- **Guardrails:** Any control failure on escrow, age verification, or prohibited categories is a release blocker — emit signal immediately. Do not sign off on compliance if outside counsel review is pending on an open issue.

### GEN:privacy-impact-assessment

- **Trigger:** M2 (monthly privacy reassessment) or when a new data collection point is added (e.g., biometric proof, location data, therapist-patient linking)
- **Input:** Data flow inventory (what data is collected, where stored, who accesses, retention period), current Privacy Policy, CCPA/state privacy law requirements, R2 proof storage lifecycle rules, any new third-party integrations
- **Action:** Map each data element to its legal basis, storage location, retention period, and access controls. Identify gaps: data collected without policy coverage, retention exceeding stated periods, third-party sharing without consent. For proof media (photos, videos submitted as behavioral evidence), assess biometric classification risk under BIPA (Illinois) and similar state laws.
- **Output:** Privacy impact assessment update to `artifacts/privacy-policy.md` (gap annotations); new data elements flagged for Policy update
- **Guardrails:** Any biometric data collection (face recognition in proofs, health metrics from wearables) requires explicit opt-in consent and may trigger BIPA compliance obligations. Flag immediately. Never store proof media beyond the contract dispute window + 30-day buffer.

### GEN:fury-classification-review

- **Trigger:** Q4 (quarterly auditor structure review) or when Fury engagement model changes (payout structure, minimum activity requirements, rating/penalty systems)
- **Input:** Current Fury auditor agreement, engagement metrics (hours active, audits per week, payout amounts), state-specific contractor classification tests (ABC test for CA/IL/NJ, economic-reality test for federal), IRS 1099 thresholds
- **Action:** Analyze the Fury relationship against the ABC test factors: (A) is the auditor free from control? (B) is auditing outside Styx's usual business? (C) does the auditor have an independent business? Identify risk factors that push toward employment classification. Model financial exposure if classified as employees (payroll taxes, benefits, overtime).
- **Output:** Fury classification risk memo appended to `artifacts/fury-auditor-agreement.md`
- **Guardrails:** If classification risk exceeds "moderate," recommend engagement model changes before scaling the Fury network. Flag any state where Fury auditors are concentrated (> 20% of total) for priority analysis.

## 5. Self-Critique Rules (CRIT:)

### CRIT:compliance-gap

- **Cadence:** Monthly (aligned with M1)
- **Check:** Count of compliance controls in "fail" or "pending-review" status. Check age of oldest unresolved compliance failure. Verify outside counsel has reviewed any new escrow or gambling-classification questions within the last 90 days.
- **Output:** Compliance health summary
- **Escalate:** If any escrow, age-verification, or prohibited-category control is in "fail" state for > 7 days, emit `signal:compliance-alert` to Engineering (block releases) and escalate to PULSE. If outside counsel review is overdue > 90 days on an open gambling-classification question, escalate to PULSE.

### CRIT:regulatory-change-impact

- **Cadence:** Weekly (aligned with W1)
- **Check:** Review the regulatory digest for any direct-impact items. Cross-reference against current state exclusion list and Aegis Protocol controls. Flag if a new regulation would require Styx to: (a) exclude users in a new state, (b) modify escrow flow, (c) change Fury auditor structure, or (d) add new compliance controls.
- **Output:** Regulatory impact assessment appended to risk register
- **Escalate:** If a new regulation requires operational changes within 90 days, emit `signal:compliance-alert` to all departments and escalate to PULSE. If a regulation could force Styx to cease operations in a state with > 10% of users, escalate immediately.

### CRIT:tos-product-drift

- **Cadence:** Monthly (aligned with M3)
- **Check:** Compare the live Terms of Service and Privacy Policy against features shipped in the last 30 days. Flag any feature that: (a) collects new data not covered by Privacy Policy, (b) changes escrow terms not reflected in ToS, (c) modifies Fury auditor obligations not covered by auditor agreement, (d) introduces a new contract category not listed in permitted categories.
- **Output:** ToS drift report with specific sections needing update
- **Escalate:** If drift is detected on escrow terms or data collection, emit `signal:tos-update` to all departments and block further feature releases until ToS is updated and users are notified.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:emergency-compliance-patch

- **Trigger:** CRIT:compliance-gap escalation with a "fail" on a release-blocking control
- **Action:** (1) Identify the specific control failure (age verification bypass, prohibited category leak, escrow misconfiguration). (2) Draft the minimum viable fix specification for Engineering. (3) If the fix requires a ToS update, draft the amendment language. (4) If the fix requires state exclusion, draft the geofencing rule. (5) Create a GitHub issue with `blocked` + `owner:legal` labels and link to the compliance report.
- **Guardrails:** Emergency patches must be narrowly scoped — fix the compliance gap, do not bundle product changes. All emergency patches require human review before deployment. If the failure involves active user funds, recommend a voluntary operational pause until resolved.

### HEAL:tos-rapid-update

- **Trigger:** CRIT:tos-product-drift escalation or `signal:api-change` from Engineering affecting user-facing terms
- **Action:** (1) Identify sections of ToS/Privacy Policy that are out of date. (2) Draft updated language that accurately reflects current product behavior. (3) Determine notification requirements: material change (email notification + 30-day advance notice) vs. clarification (in-app banner). (4) Create draft PR for human review with notification plan.
- **Guardrails:** Material ToS changes (escrow terms, dispute process, data sharing) require 30-day advance notice and opt-out period. Never publish ToS updates without founder + outside counsel review. Maintain a ToS changelog with effective dates.

### HEAL:state-exclusion-update

- **Trigger:** CRIT:regulatory-change-impact identifies a new state where Styx cannot legally operate
- **Action:** (1) Add the state to the exclusion list with legal basis citation. (2) Draft the geofencing specification for Engineering (IP-based + user-declared state). (3) Identify affected users and draft communication (refund process for active contracts, data export options). (4) Update the Aegis Protocol controls.
- **Guardrails:** State exclusions require outside counsel confirmation. Affected users with active contracts must be offered full refunds. Geofencing must be implemented before the regulatory effective date, not after. Never exclude a state based solely on automated regulatory scan — require human legal review.

## 7. Signal Wiring

### Emits

- `signal:compliance-alert` — consumed by **ENG** (release block), **PRD** (roadmap impact), **OPS** (operational pause assessment)
- `signal:tos-update` — consumed by **ENG** (API response language review), **PRD** (onboarding copy update), **CXS** (support script update), **GRO** (user communication)
- `signal:state-exclusion-change` — consumed by **ENG** (geofencing implementation), **PRD** (market size recalculation), **FIN** (revenue projection update)
- `signal:fury-classification-risk` — consumed by **PRD** (auditor model redesign), **FIN** (liability exposure modeling), **OPS** (auditor onboarding changes)
- `signal:privacy-breach-detected` — consumed by **ENG** (incident response), **CXS** (user notification), **OPS** (regulatory notification)

### Consumes

- `signal:api-change` from **ENG** — review new endpoints for compliance implications (escrow changes, data collection, Fury routing)
- `signal:deploy-complete` from **ENG** — verify deployed features match approved compliance review; check for unauthorized escrow or data-flow changes
- `signal:feature-shipped` from **PRD** — assess new features for regulatory risk; trigger GEN:compliance-review if feature touches escrow, contracts, or user data
- `signal:pricing-change-proposed` from **PRD** — review pricing changes for consumer protection compliance (bait-and-switch risk, existing-subscriber protections, state-specific pricing regulations)
- `signal:security-alert` from **ENG** — assess security vulnerability for regulatory notification obligations (state breach-notification laws, FTC Section 5)

### Escalates

- `signal:gambling-classification-risk` — escalate to **PULSE** if any state AG, payment processor, or app store flags Styx as gambling; this is an existential threat requiring immediate founder + outside counsel response
- `signal:regulatory-cease-desist` — escalate to **PULSE** immediately; any cease-and-desist or enforcement action from a regulatory body
- `signal:class-action-risk` — escalate to **PULSE** if pattern of user complaints suggests potential class-action exposure (e.g., systematic escrow disputes, discriminatory auditor behavior)

## 8. Human Checkpoints

1. **Terms of Service publication:** All ToS updates require founder sign-off and outside counsel review. No automated ToS changes, ever.
2. **State exclusion decisions:** Adding or removing states from the exclusion list requires founder + outside counsel confirmation. Automated scans can flag, but humans decide.
3. **Gambling classification response:** Any communication with payment processors, app stores, or regulators about Styx's classification as a "skill contest" vs. "gambling" must be drafted by outside counsel and approved by founder.
4. **Fury auditor agreement changes:** Modifications to the auditor agreement (payout structure, termination rights, arbitration clause) require outside counsel review for employment-classification implications.
5. **Data breach notification:** If a privacy breach is detected, the notification decision (who to notify, when, what to say) requires founder + outside counsel + potentially state AG coordination. No automated notifications.

## 9. Health Indicators

- **Green:** All compliance controls passing. No unresolved regulatory flags older than 7 days. ToS and Privacy Policy aligned with current product features. Outside counsel review current (< 90 days on open questions). No active disputes exceeding normal volume (< 2% of contracts). State exclusion list current.
- **Yellow:** 1-2 compliance controls pending review OR regulatory flags 7-14 days old OR ToS drift detected but non-material OR outside counsel review 60-90 days overdue OR dispute rate 2-5% of contracts OR 1 artifact stale.
- **Red:** 3+ compliance controls failing OR any escrow/age-verification/prohibited-category control failing OR regulatory flag > 14 days unresolved OR material ToS drift detected OR outside counsel review > 90 days overdue on gambling-classification question OR CRIT: escalation active OR dispute rate > 5% OR cease-and-desist received.

## 10. Growth Backlog

| ID | Item | Notes |
|----|------|-------|
| L2 | Terms of Service | Draft from existing legal research docs; needs outside counsel review before beta launch |
| L3 | Privacy Policy | Draft covering proof media storage, behavioral data, therapist-patient data segregation |
| L5 | Regulatory Risk Register | Formalize from scattered legal docs into structured risk register with probability/impact scoring |
| L7 | IP Assignment Agreement | Standard assignment for any contractors or future employees; template from outside counsel |
| L10 | State Exclusion List | 50-state analysis output: states where Styx must not operate or needs additional licensing |
| L11 | Fury Auditor Agreement | Contractor agreement template with arbitration, IP assignment, non-compete, 1099 compliance |
| L12 | Data processing agreement (B2B) | Required for Enterprise tier therapists who are data controllers for patient behavioral data |
| L13 | HIPAA readiness assessment | If B2B therapist integration touches PHI, need HIPAA Business Associate Agreement framework |
| L14 | International expansion legal playbook | EU gambling directive, GDPR, UK Gambling Commission — deferred until US market proven |
| L15 | Insurance policy tracker | D&O, cyber liability, professional liability, E&O — track coverage, renewal dates, gaps |
