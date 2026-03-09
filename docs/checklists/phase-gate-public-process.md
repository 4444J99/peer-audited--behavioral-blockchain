---
generated: true
department: CROSS
artifact_id: X1
governing_sop: "SOP--promotion-and-state-transitions.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Phase Gate Checklist: PUBLIC_PROCESS → GRADUATED

## Overview

This checklist defines the requirements for promoting Styx from PUBLIC_PROCESS to GRADUATED status in the ORGANVM promotion state machine. Every item must be checked before the promotion is executed via `organvm governance promote peer-audited--behavioral-blockchain GRADUATED`.

**Current status:** PUBLIC_PROCESS
**Target status:** GRADUATED
**Promotion prerequisites:** All items below must be complete. No state skipping — this is enforced by `governance/state_machine.py`.

---

## 1. Engineering Quality

### Validation Gates
- [ ] Gate 01 (Schema Validation) — All data contracts pass JSON Schema validation
- [ ] Gate 02 (Seed Contract) — `seed.yaml` validates against `seed-v1.schema.json`, all edges declared
- [ ] Gate 03 (Dependency Graph) — No illegal cross-organ back-edges, unidirectional flow verified
- [ ] Gate 04 (Registry Consistency) — `registry-v2.json` entry matches actual repo state
- [ ] Gate 05 (CI Green) — All CI workflows passing on main branch
- [ ] Gate 06 (Lint Clean) — Zero ruff/ESLint errors on all source files
- [ ] Gate 07 (Type Safety) — TypeScript strict mode with zero errors, Pyright basic with zero errors
- [ ] Gate 08 (Security Audit) — Dependabot alerts resolved, CodeQL clean, no critical/high findings

### Test Coverage
- [ ] Unit test coverage ≥ 70% lines across all packages (NestJS API, Next.js web, shared libs)
- [ ] Integration test suite covering all API endpoints with real database
- [ ] Fury audit flow tested end-to-end (contract creation → proof submission → audit → verdict → payout)
- [ ] Escrow accounting tests verify double-entry ledger balance after every transaction type
- [ ] Aegis protocol tests verify health guardrail activation on dangerous contract terms
- [ ] Recovery protocol tests verify no-contact tracking edge cases (emergency contact, unsolicited messages)

### End-to-End Testing
- [ ] Playwright E2E suite green on Chrome (latest)
- [ ] Playwright E2E suite green on Firefox (latest)
- [ ] Playwright E2E suite green on Safari (latest)
- [ ] Playwright E2E suite green on Edge (latest)
- [ ] Mobile viewport E2E tests passing (375px, 414px, 390px widths)
- [ ] Beta readiness suite passing (`scripts/beta-readiness.sh`)

### Performance
- [ ] Load test completed: API p99 < 2 seconds at 1,000 concurrent users
- [ ] Database query analysis: no N+1 queries, all critical paths indexed
- [ ] Proof submission upload: p99 < 5 seconds for 10MB image
- [ ] Dashboard page load: LCP < 1.5 seconds on 4G connection
- [ ] Background job queue: Fury assignment latency < 30 seconds

---

## 2. Financial & Legal

### Stripe Production
- [ ] Stripe production mode activated (real money transactions enabled)
- [ ] FBO (For Benefit Of) escrow account configured and verified by Stripe
- [ ] High-risk merchant underwriting approved by Stripe (escrow + behavioral contracts)
- [ ] Webhook endpoints configured for all Stripe events (payment, dispute, refund, payout)
- [ ] Financial reconciliation script tested: double-entry ledger balances to the penny
- [ ] Refund flow tested: successful contract → money released within 3-5 business days
- [ ] Failure flow tested: failed contract → stake forfeited, distributed correctly

### KYC/AML
- [ ] KYC identity verification enabled for stakes above $100 (via Stripe Identity)
- [ ] AML screening enabled for high-value transactions
- [ ] Age verification: 18+ requirement enforced at account creation

### Legal Documents
- [ ] Terms of Service published at styx.app/terms and reviewed by legal counsel
- [ ] Privacy Policy published at styx.app/privacy and reviewed by legal counsel
- [ ] Escrow Agreement published (terms governing stake holding and release)
- [ ] Fury Auditor Agreement published (terms governing peer audit obligations)
- [ ] Dispute Resolution Policy published (appeal process, panel review, timelines)
- [ ] Cookie Policy and consent banner implemented (CCPA compliance for US users)
- [ ] Gambling classification legal opinion on file (Styx is skill-based + peer-audited, not gambling)

---

## 3. Infrastructure & Operations

### Monitoring & Alerting
- [ ] Sentry error tracking configured for all services (API, web, mobile, worker)
- [ ] Uptime monitoring configured (< 5 minute detection for P1 outages)
- [ ] Database connection pool monitoring with alerting at 80% capacity
- [ ] Redis memory usage monitoring with alerting at 80% capacity
- [ ] Escrow balance monitoring: alert if ledger imbalance detected
- [ ] Fury audit queue monitoring: alert if unassigned audits > 50 or average wait > 4 hours

### Deployment
- [ ] Deployment procedure documented (step-by-step runbook)
- [ ] Rollback procedure documented and tested (< 5 minute rollback to previous version)
- [ ] Zero-downtime deployment verified (blue-green or rolling update)
- [ ] Database migration procedure tested (forward and rollback)
- [ ] Environment variable management documented (Render dashboard, no secrets in code)

### Backup & Recovery
- [ ] Database backup schedule verified (daily automatic via Render)
- [ ] Database recovery procedure tested (restore from backup to staging environment)
- [ ] Point-in-time recovery tested (recover to specific timestamp within 7-day window)
- [ ] R2 storage backup strategy documented (proof submission files)

### Security
- [ ] Security audit completed by independent third party (no critical/high findings open)
- [ ] Penetration test completed (no critical/high findings open)
- [ ] All Dependabot alerts resolved (zero open critical/high advisories)
- [ ] CodeQL analysis clean (zero high-severity findings)
- [ ] Rate limiting configured on all public endpoints (auth, contract creation, proof upload)
- [ ] CORS policy restricted to known origins
- [ ] CSP headers configured and tested
- [ ] Responsible disclosure policy published at styx.app/.well-known/security.txt

---

## 4. Product Readiness

### App Store Submission
- [ ] Linguistic Cloaker validated: all user-facing copy passes Apple App Review Guidelines
- [ ] Linguistic Cloaker validated: all user-facing copy passes Google Play Developer Program Policies
- [ ] iOS build signing configured (Apple Developer Program)
- [ ] Android build signing configured (Google Play Console)
- [ ] App store screenshots prepared (6.7" iPhone, 6.5" iPhone, iPad, Pixel 7)
- [ ] App store description, keywords, and category selected
- [ ] Privacy nutrition label completed (App Store) / Data safety section completed (Play Store)

### B2B Readiness
- [ ] B2B practitioner onboarding flow tested with ≥ 3 real practitioners
- [ ] Practitioner dashboard analytics verified with real client data
- [ ] Custom contract template creation tested by practitioners
- [ ] Client invitation flow tested (email → acceptance → contract assignment)
- [ ] Solo tier ($49/mo) billing tested (subscription creation, renewal, cancellation)
- [ ] Practice tier ($199/mo) billing tested
- [ ] Enterprise tier ($999+/mo) billing tested (custom invoicing if needed)

### Customer Support
- [ ] FAQ/help center published at styx.app/help (30+ articles)
- [ ] In-app support widget configured (email fallback during beta, live chat at launch)
- [ ] Support response time SLA established (< 4 hours during beta)
- [ ] Escalation procedure documented (P1 → founder, P2 → within 4 hours, P3/P4 → next business day)
- [ ] Dispute resolution team identified (initial: founder + 3 senior Furies for appeal panels)
- [ ] Discord community moderated with clear guidelines and active moderators

---

## 5. Business Metrics Validation

### Beta Data Requirements
- [ ] Minimum 100 completed contracts with real users (test money or real money)
- [ ] Contract completion rate ≥ 55% across all categories
- [ ] Fury audit accuracy ≥ 85% (agreement rate on appeal panel reviews)
- [ ] NPS ≥ 30 among active beta users
- [ ] Practitioner retention: ≥ 80% of beta practitioners still active after 30 days
- [ ] Proof submission latency: average < 12 hours from window open to submission

### Financial Projections
- [ ] Financial projections document validated against beta data
- [ ] Unit economics verified: platform fee ($9/contract) covers per-contract infrastructure costs
- [ ] Practitioner LTV/CAC ratio > 3:1 for Solo tier
- [ ] Monthly burn rate documented and runway calculated (≥ 6 months at current rate)

---

## 6. ORGANVM System Integration

### Omega Scorecard
- [ ] Omega criterion #1 (Soak Test): 30-day soak test passing
- [ ] Omega criterion #3 (CI Health): All CI workflows green for 14+ consecutive days
- [ ] Omega criterion #5 (Registry): Entry in registry-v2.json is complete and accurate
- [ ] Omega criterion #6 (Seed Contract): seed.yaml fully wired with all edges
- [ ] Omega criterion #8 (Documentation): CLAUDE.md, README.md, and docs/ complete
- [ ] Omega criterion #9 (Test Coverage): Test count and coverage meet GRADUATED threshold
- [ ] Omega criterion #13 (Pitch Deck): docs/pitch/index.html generated and accurate
- [ ] Omega criterion #17 (Context Sync): CLAUDE.md auto-synced with latest organ map

### Registry Update
- [ ] `registry-v2.json` entry for `peer-audited--behavioral-blockchain` updated:
  - `promotion_status`: `GRADUATED`
  - `implementation_status`: `ACTIVE`
  - `last_validated`: current date
  - `ci_workflow`: `true`
  - `platinum_status`: all criteria met

---

## Promotion Execution

Once all items above are checked:

```bash
# Verify all gates
organvm governance audit --repo peer-audited--behavioral-blockchain

# Execute promotion
organvm governance promote peer-audited--behavioral-blockchain GRADUATED

# Verify
organvm registry show peer-audited--behavioral-blockchain
```

**Approver:** Project owner (human review required — no automated promotion to GRADUATED)
**Date completed:** ________
**Notes:** ________
