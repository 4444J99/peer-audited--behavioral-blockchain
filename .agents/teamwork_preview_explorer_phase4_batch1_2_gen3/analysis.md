# Comprehensive Issue Analysis — Phase 4 Batch 1 (Issues 352, 361, 362)

## Executive Summary
This document presents the detailed architectural and domain analysis for issues **352**, **361**, and **362** assigned to Explorer 2 (Gen3) in `phase4-batch1`. All three issues pertain to B2B, Enterprise sales enablement, pricing models, and compliance infrastructure.

---

## 1. Issue 352: B2B Pricing Model ($49 / $149 / $349 / $999+ Tiers)

### 1.1 Context & Triage Status
- **Issue ID**: 352
- **Title**: `B2B pricing model — $49/$149/$349/$999+ tiers`
- **Labels**: `["finance"]`
- **Current State in `docs/triage.json`**: `OPEN`, batch: `phase4-batch1`
- **Domain Home**: `docs/departments/fin/artifacts/pricing-strategy.md`

### 1.2 Analysis & Ground Truth Findings
- **Repository Standard Alignment**: Across `docs/enterprise/README.md`, `docs/finance/README.md`, `docs/research/research--b2b-expansion-heartbreak-niche.md`, `docs/planning/planning--timeline-with-owners--2026-03-06.md`, and `docs/planning/planning--monthly-calendar--2026-03-08.md`, the canonical B2B pricing model is defined as:
  1. **Starter**: $49/mo (5 clients capacity) — Solo coaches & emerging practitioners
  2. **Growth**: $149/mo (25 clients capacity) — Established solo coaches
  3. **Scale**: $349/mo (75 clients capacity) — Small coaching agencies & group practices
  4. **Enterprise**: $999+/mo (Unlimited capacity) — Large clinics, IOPs, digital health platforms
- **Discrepancy in `pricing-strategy.md`**: `docs/departments/fin/artifacts/pricing-strategy.md` currently lists an older 3-tier structure ($49 Solo / $199 Practice / $999+ Enterprise).
- **Required Changes**:
  1. Update `docs/departments/fin/artifacts/pricing-strategy.md` (lines 58–90) to reflect the complete 4-tier model ($49/$149/$349/$999+), updating client limits, feature matrices, and price/client/mo value ratios.
  2. Update `docs/triage.json` for Issue 352:
     - `"action"`: `"CLOSE"`
     - `"state"`: `"CLOSED"`
     - `"evidence"`: `"docs/departments/fin/artifacts/pricing-strategy.md:58"`

### 1.3 Proposed Changes (Patch / Snippet)
```markdown
### Tier Structure

| Feature | Starter ($49/mo) | Growth ($149/mo) | Scale ($349/mo) | Enterprise ($999+/mo) |
|---------|:---:|:---:|:---:|:---:|
| Client limit | 5 | 25 | 75 | Unlimited |
| Dashboard access | Basic | Full | Full + custom views | Full + custom data lake |
| Contract templates | 5 standard | 20 + custom | Unlimited custom | Unlimited custom |
| Analytics | Summary stats | Detailed trends | Cohort & predictive | Custom BI & exports |
| Compliance reporting | — | Standard | HIPAA ready | SOC 2 + HIPAA BAA |
| SSO/SAML | — | — | — | Yes |
| Webhook integrations | — | 3 endpoints | 10 endpoints | Unlimited |
| API access | — | Read-only | Full CRUD | Full CRUD + dedicated |
| Dedicated support | Email (48h) | Email (24h) | Priority Email (12h) | Slack channel (4h) |
| White-label option | — | — | Add-on ($250/mo) | Included / Add-on ($500/mo) |
| Client data export | CSV | CSV + JSON | CSV + JSON + Parquet | Full data lake sync |
```

### 1.4 Test & Verification Requirements
- Verify that `docs/departments/fin/artifacts/pricing-strategy.md` contains the four tiers ($49, $149, $349, $999+).
- Verify that `triage.json` records Issue 352 as CLOSED with evidence path `docs/departments/fin/artifacts/pricing-strategy.md:58`.

---

## 2. Issue 361: Enterprise Demo Environment (Sandboxed Render Instance)

### 2.1 Context & Triage Status
- **Issue ID**: 361
- **Title**: `Enterprise demo environment — sandboxed Render instance`
- **Labels**: `["b2b", "enterprise"]`
- **Current State in `docs/triage.json`**: `OPEN`, batch: `phase4-batch1`
- **Domain Home**: `render.yaml` (or `render.demo.yaml`) and `docs/departments/b2b/artifacts/demo-environment.md`

### 2.2 Analysis & Ground Truth Findings
- `render.yaml` currently defines production services (`styx-api`, `styx-web`, `styx-redis`, `styx-db`).
- An Enterprise demo environment requires an isolated, sandboxed Render instance blueprint where enterprise prospects and sales engineers can walk through practitioner and client flows without touching production data or real payment gateways.
- Key requirements for the demo environment:
  1. Dedicated Render services: `styx-api-demo`, `styx-web-demo`, `styx-db-demo`, `styx-redis-demo`.
  2. Environment variables: `IS_DEMO_ENVIRONMENT=true`, `STRIPE_MOCK_MODE=true`, `DEMO_AUTO_RESET_INTERVAL=24h`.
  3. Pre-populated seed data: 5 synthetic practitioner accounts, 25 client accounts across various habit & recovery oaths, and mock Fury audit logs.
  4. Automated daily database reset via seed script.
  5. Detailed B2B department artifact documenting architecture, access control, and maintenance protocols.

### 2.3 Proposed Changes
1. Create `docs/departments/b2b/artifacts/demo-environment.md` detailing the architecture, security isolation, mock payment handling, automated 24-hour reset mechanism, and prospect onboarding procedure.
2. Add `render.demo.yaml` or append demo environment blueprint specs to Render configuration.
3. Update `docs/triage.json` for Issue 361:
   - `"action"`: `"CLOSE"`
   - `"state"`: `"CLOSED"`
   - `"evidence"`: `"docs/departments/b2b/artifacts/demo-environment.md:1"`

### 2.4 Test & Verification Requirements
- Ensure `docs/departments/b2b/artifacts/demo-environment.md` exists and contains complete technical specifications for the sandboxed Render instance.
- Ensure `render.demo.yaml` defines `styx-api-demo` and `styx-web-demo` with `IS_DEMO_ENVIRONMENT=true`.
- Verify `triage.json` state transition for Issue 361 to CLOSED.

---

## 3. Issue 362: Security Questionnaire Template (Pre-filled Answers)

### 3.1 Context & Triage Status
- **Issue ID**: 362
- **Title**: `Security questionnaire template — pre-filled answers`
- **Labels**: `["b2b", "owner:legal-compliance", "enterprise"]`
- **Current State in `docs/triage.json`**: `OPEN`, batch: `phase4-batch1`
- **Domain Home**: `docs/departments/b2b/artifacts/security-questionnaire.md`

### 3.2 Analysis & Ground Truth Findings
- **Existing Artifact**: `docs/departments/b2b/artifacts/security-questionnaire.md` is ALREADY fully generated and stored in the repository.
- **Content Verification**: The file spans 158 lines and includes pre-filled responses across 12 critical security and compliance domains:
  1. Data Encryption (AES-256 at rest, TLS 1.3 in transit)
  2. Authentication & Authorization (bcrypt cost 12, JWTs, SAML 2.0 planned, RBAC)
  3. Infrastructure & Hosting (Render Oregon, Cloudflare, Stripe)
  4. Data Residency & Privacy (US Oregon, PII/behavioral data, export/deletion)
  5. Backup & Disaster Recovery (automatic daily backups, 7-day retention, RTO < 4h, RPO < 24h)
  6. Incident Response (P1-P4 severity levels, response SLAs)
  7. Compliance & Certifications (SOC 2 Type II roadmap, HIPAA BAAs planned, PCI DSS SAQ A-EP)
  8. Penetration Testing & Vulnerability Management (Dependabot, CodeQL, ESLint/TypeScript strict, Pyright)
  9. Subprocessors (Stripe, Render, Cloudflare, Google Gemini AI, Groq, Sentry, Resend/Postmark)
  10. Access Controls & Employee Security (Least privilege, RBAC, access logging)
  11. Data Deletion & Retention (30-day grace period, financial records 7 years)
  12. Third-Party Risk (Subprocessor vetting & breach notification)
- **State Transition Requirement**: The issue implementation is complete. The remaining step for state transition is updating `docs/triage.json`:
  - `"action"`: `"CLOSE"`
  - `"state"`: `"CLOSED"`
  - `"evidence"`: `"docs/departments/b2b/artifacts/security-questionnaire.md:11"`

### 3.3 Test & Verification Requirements
- Confirm `docs/departments/b2b/artifacts/security-questionnaire.md` exists and contains all 12 security sections.
- Verify `triage.json` state transition for Issue 362 to CLOSED with evidence pointing to line 11 of `security-questionnaire.md`.

---

## 4. State Transition Summary Table

| Issue ID | Title | Domain File Location | State | Action | Evidence Link |
|:---|:---|:---|:---|:---|:---|
| **352** | B2B pricing model ($49/$149/$349/$999+) | `docs/departments/fin/artifacts/pricing-strategy.md` | `CLOSED` | `CLOSE` | `docs/departments/fin/artifacts/pricing-strategy.md:58` |
| **361** | Enterprise demo environment (Render sandbox) | `docs/departments/b2b/artifacts/demo-environment.md` | `CLOSED` | `CLOSE` | `docs/departments/b2b/artifacts/demo-environment.md:1` |
| **362** | Security questionnaire template (pre-filled) | `docs/departments/b2b/artifacts/security-questionnaire.md` | `CLOSED` | `CLOSE` | `docs/departments/b2b/artifacts/security-questionnaire.md:11` |
