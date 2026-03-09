---
generated: true
department: PRD
artifact_id: P4
governing_sop: "SOP--feature-prioritization.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Feature Matrix

Comprehensive feature inventory for Styx with implementation status, phase gating, and priority classification.

## Status Legend

| Status | Meaning |
|--------|---------|
| **Built** | Feature is implemented, tested, and passes CI gates |
| **Partial** | Core logic exists but incomplete (missing edge cases, UI, or integration) |
| **Stub** | Interface/scaffold exists but no functional implementation |
| **Planned** | Designed but no code written |

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Must ship for private beta -- blocking |
| **P1** | Must ship for public beta |
| **P2** | Launch requirement |
| **P3** | Post-launch enhancement |

---

## Core Platform

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| User registration (email/password) | Built | Beta | P0 | |
| OAuth (Google, Apple) | Stub | Beta | P1 | Passport strategies scaffolded |
| Email verification | Built | Beta | P0 | |
| Password reset | Built | Beta | P0 | |
| JWT authentication | Built | Beta | P0 | Access + refresh token rotation |
| Role-based access (user, fury, practitioner, admin) | Built | Beta | P0 | NestJS guards |
| US-only geofencing (STYX_ALLOWLIST_US_ONLY) | Built | Beta | P0 | IP-based, feature flag controlled |
| Rate limiting | Built | Beta | P0 | Redis-backed, per-endpoint config |
| CORS configuration | Built | Beta | P0 | |

## Behavioral Contracts (Oaths)

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Contract CRUD | Built | Beta | P0 | All 7 oath categories |
| Biological Oath | Built | Beta | P0 | With Aegis validation |
| Cognitive Oath | Built | Beta | P0 | |
| Professional Oath | Built | Beta | P0 | |
| Creative Oath | Built | Beta | P1 | Lower priority wedge |
| Environmental Oath | Built | Beta | P1 | |
| Character Oath | Built | Beta | P1 | |
| Recovery Oath (no-contact) | Built | Beta | P0 | With Recovery Protocol guardrails |
| Contract duration config (7-90 days) | Built | Beta | P0 | |
| Verification frequency (daily/weekly) | Built | Beta | P0 | |
| Stake amount config (integrity-tier limited) | Built | Beta | P0 | |
| Grace days (2/month) | Built | Beta | P0 | |
| Contract cancellation (with forfeit) | Built | Beta | P0 | |
| Contract templates (B2B) | Partial | Beta | P1 | CRUD exists, template gallery not built |
| Batch contract creation (B2B) | Stub | Launch | P2 | API endpoint scaffolded |
| Contract sharing/public contracts | Planned | Post-launch | P3 | |
| Recurring contracts (auto-renew) | Planned | Post-launch | P3 | |

## Aegis Health Protocol

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| BMI floor enforcement (18.5) | Built | Beta | P0 | Gate 04 validates in CI |
| Weekly loss velocity cap (2%) | Built | Beta | P0 | Gate 05 validates in CI |
| Health disclaimer acceptance | Built | Beta | P0 | Required before biological oath creation |
| Automatic contract rejection on safety violation | Built | Beta | P0 | |
| Aegis tier reconciliation | Built | Beta | P0 | See `docs/architecture/architecture--aegis-tier-reconciliation.md` |

## Recovery Protocol

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Max 30-day duration enforcement | Built | Beta | P0 | Gate 07 validates |
| Max 3 no-contact targets | Built | Beta | P0 | Gate 07 validates |
| Mandatory cooldown between contracts | Built | Beta | P0 | |
| No-contact target anonymization (for Furies) | Built | Beta | P0 | Furies never see target identity |
| Digital exhaust monitoring (call/text log) | Partial | Beta | P0 | Screenshot-based; native API planned |
| Contact detection via native APIs | Planned | Post-launch | P3 | Requires CallKit/Android Telecom permissions |

## Fury Peer Audit Network

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Fury application and vetting | Built | Beta | P0 | Minimum integrity score threshold |
| Auditor stake ($2 per assignment) | Built | Beta | P0 | |
| 3-of-5 quorum consensus | Built | Beta | P0 | Gate 03 validates |
| Round-robin assignment | Built | Beta | P0 | Gate 08 validates fairness |
| Conflict-of-interest detection | Built | Beta | P0 | Social graph + geographic |
| Vote casting (PASS/FAIL/NEEDS_MORE_INFO) | Built | Beta | P0 | |
| Auditor reputation tracking | Built | Beta | P0 | |
| Auditor ejection (bad-faith) | Partial | Beta | P1 | Threshold exists, appeal process not built |
| Fury workbench UI | Built | Beta | P0 | Photo + metadata panel + vote buttons |
| Bounty calculation and distribution | Built | Beta | P0 | |
| Fury leaderboard | Planned | Launch | P2 | |
| Specialized auditor pools (by oath category) | Planned | Post-launch | P3 | |

## Financial Infrastructure

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Stripe FBO escrow integration | Built | Beta | P0 | |
| Double-entry ledger | Built | Beta | P0 | Gate 01 validates integrity |
| Platform fee collection ($9 per $39 contract) | Built | Beta | P0 | |
| Escrow settlement (success: return, failure: forfeit) | Built | Beta | P0 | |
| Stripe webhook processing (idempotent) | Built | Beta | P0 | |
| Wallet balance display | Built | Beta | P0 | |
| Withdrawal to bank (Stripe Connect) | Stub | Launch | P2 | Scaffold only, requires Connect onboarding |
| Refund processing | Built | Beta | P0 | For contract cancellation |
| Dispute resolution (elevated Fury review) | Partial | Launch | P1 | Basic flow exists, escalation path incomplete |
| Onboarding bonus ($5 credit) | Built | Beta | P0 | |
| Subscription billing (B2B practitioners) | Partial | Beta | P1 | Stripe Billing integrated, portal not built |
| Revenue reporting dashboard (admin) | Stub | Launch | P2 | |

## Integrity Scoring

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Base score (50) | Built | Beta | P0 | |
| Completion bonus (+5) | Built | Beta | P0 | |
| Failure penalty (-10) | Built | Beta | P0 | |
| Fury audit bonus (+2) | Built | Beta | P0 | |
| Tier-based stake limits | Built | Beta | P0 | |
| Public score display | Built | Beta | P0 | |
| Score history/timeline | Partial | Beta | P1 | Data stored, visualization not built |
| Score decay on inactivity | Planned | Post-launch | P3 | Open question in PRD |

## AI Features

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Grill Me (challenge motivation) | Built | Beta | P1 | Gemini-powered, challenges user's resolve |
| ELI5 (explain contract terms) | Built | Beta | P1 | Groq/Llama-powered |
| AI proof pre-screening | Planned | Launch | P2 | Reject obviously invalid proofs before Fury review |
| Contract recommendation engine | Planned | Post-launch | P3 | Suggest oath type/parameters based on history |
| Behavioral insight reports | Planned | Post-launch | P3 | AI-generated progress summaries |

## Dashboard and Notifications

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| User dashboard (active contracts, score, history) | Built | Beta | P0 | |
| SSE real-time notifications | Built | Beta | P0 | Contract events, audit results, escrow movements |
| Email notifications | Partial | Beta | P1 | Transactional emails built, digest not built |
| Push notifications (mobile) | Stub | Launch | P2 | Expo Push scaffolded |
| Verification window reminders | Built | Beta | P0 | |
| Weekly progress digest | Planned | Launch | P2 | |

## B2B Practitioner Module

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Practitioner registration | Built | Beta | P1 | License verification manual for beta |
| Practitioner dashboard | Partial | Beta | P1 | Basic client list, missing analytics |
| Client contract assignment | Built | Beta | P1 | |
| Compliance monitoring | Partial | Beta | P1 | View status, missing trend visualization |
| Outcome analytics | Stub | Launch | P2 | Data collected, reporting not built |
| White-label contract templates | Planned | Launch | P2 | |
| Practice branding | Planned | Post-launch | P3 | |
| Multi-practitioner practice accounts | Planned | Post-launch | P3 | |

## Compliance and Security

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| KYC (identity verification) | Stub | Beta | P1 | Stripe Identity integration planned |
| AML screening | Planned | Launch | P2 | Required for money transmitter compliance |
| Data encryption at rest | Built | Beta | P0 | PostgreSQL TDE |
| Data encryption in transit | Built | Beta | P0 | TLS 1.3 |
| EXIF metadata extraction and storage | Built | Beta | P0 | For proof verification |
| Proof photo storage (Cloudflare R2) | Built | Beta | P0 | |
| Audit trail (immutable ledger) | Built | Beta | P0 | |
| Admin moderation tools | Stub | Launch | P2 | |
| CCPA data deletion requests | Planned | Launch | P2 | |
| SOC 2 preparation | Planned | Post-launch | P3 | |

## Platforms

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Web app (Next.js 16) | Built | Beta | P0 | Primary platform |
| Mobile app (React Native/Expo) | Partial | Beta | P1 | Core flows built, camera placeholder |
| Desktop app (Tauri) | Stub | Post-launch | P3 | Window scaffolded, no unique features |
| Native camera integration (mobile) | Stub | Launch | P2 | Expo Camera placeholder |
| HealthKit integration (iOS) | Planned | Post-launch | P3 | For biological oath hardware verification |
| Google Fit integration (Android) | Planned | Post-launch | P3 | For biological oath hardware verification |
| Apple Watch companion | Planned | Post-launch | P3 | |

## Linguistic Cloaker

| Feature | Status | Phase | Priority | Notes |
|---------|--------|-------|----------|-------|
| Vocabulary mapping (internal to user-facing) | Built | Beta | P0 | See `docs/planning/ux-audit.md` |
| App store metadata compliance | Built | Beta | P0 | Descriptions use approved vocabulary |
| Dynamic string replacement | Built | Beta | P0 | Applied at render layer |
| Cloaker audit script | Planned | Beta | P1 | Automated check for uncloaked terms |

---

## Phase Summary

| Phase | P0 Features | P1 Features | Total |
|-------|-------------|-------------|-------|
| **Private Beta** | 38 | 14 | 52 |
| **Public Beta / Launch** | 0 | 4 | 16 (includes P2) |
| **Post-launch** | 0 | 0 | 14 (P3 only) |

## Feature Dependencies

```
Stripe FBO ──> Contract Creation ──> Fury Assignment ──> Proof Review ──> Settlement
    │                                      │
    └──> Wallet Display                    └──> Integrity Score Update
                                                      │
                                                      └──> Stake Limit Adjustment
```

**Critical path for beta:** Stripe FBO must be fully operational before any contract can be created. Fury pool must have minimum 15 auditors (3 quorums of 5) before contracts can be verified. These are hard prerequisites, not features that can be partially shipped.
