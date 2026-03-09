---
generated: true
department: FIN
artifact_id: F6
governing_sop: "SOP--grant-applications.md"
phase: genesis
product: styx
date: "2026-03-08"
---

# Funding Application Template — Styx

## Overview

This document provides reusable pitch material, budget templates, and program-specific guidance for pursuing grants, accelerators, and early-stage funding for Styx. The core thesis: Styx applies behavioral economics research (loss aversion, commitment devices) to a novel technical architecture (peer-audited double-entry ledger) with applications in mental health, addiction recovery, and financial wellness.

## Core Pitch Material

### One-Sentence Description

Styx is a peer-audited behavioral market where users stake money on habit commitments and a decentralized auditor network verifies follow-through, achieving projected 65% completion rates through calibrated loss aversion.

### Elevator Pitch (30 seconds)

People fail at habits because there are no real consequences for quitting. Styx fixes this by letting users put money on the line — $39 per behavioral contract — and routing verification to a network of peer auditors called Furies who stake their own money on honest reviews. Every dollar is tracked in a double-entry ledger. No phantom money, no gaming the system. The result: completion rates 2-3x higher than gamification-only habit apps. We charge a $9 platform fee per contract and sell practitioner subscriptions to therapists and coaches who use behavioral contracts as a clinical tool.

### Problem Statement

Behavioral change programs have a 70-80% failure rate. Existing habit apps rely on gamification (badges, streaks, social accountability) which research shows produces only marginal improvement over no intervention. Financial commitment devices — where users stake real money — consistently show 2-3x improvement in completion rates, but existing implementations (Beeminder, StickK) rely on self-reporting or single-referee verification, making them vulnerable to gaming.

### Solution

Styx introduces three innovations:

1. **Fury Audit Network:** A decentralized pool of peer auditors who stake $2.00 per review. False accusations carry a 3x penalty, making honest auditing the dominant strategy. This eliminates the self-reporting problem.

2. **Double-Entry Behavioral Ledger:** Every financial movement (stake deposit, escrow hold, forfeiture, refund, auditor bounty) is recorded as a balanced debit-credit pair. The ledger is continuously reconciled — if debits and credits ever diverge, the system halts and alerts. No phantom money can exist.

3. **Loss Aversion Calibration (λ=1.955):** Contract parameters are tuned using Kahneman-Tversky prospect theory. A $39 stake is perceived as ~$76 of potential loss. The $9 platform fee (23% of stake) sits below the pain threshold where users would reconsider the commitment.

### Traction (Pre-Launch)

- 499+ automated tests across the full stack
- 8 validation gates (security, ledger integrity, API readiness, performance)
- Complete deployment pipeline: Docker → GitHub Actions → Render
- Terraform IaC for infrastructure reproducibility
- Double-entry ledger with continuous reconciliation
- B2B analytics dashboard with 3 subscription tiers

### Technical Differentiation

| Feature | Styx | Beeminder | StickK | Habit Apps |
|---------|------|-----------|--------|-----------|
| Verification method | Peer audit network | Self-report | Single referee | None / self-report |
| Financial integrity | Double-entry ledger | Simple balance | Charity escrow | N/A |
| Auditor incentives | Stake + bounty + penalty | N/A | N/A | N/A |
| B2B clinical channel | Yes (3 tiers) | No | No | Limited |
| Hardware oracle path | Planned (wearables) | Partial (integrations) | No | Partial |
| Loss aversion model | Calibrated (λ=1.955) | Pledge escalation | Fixed | None |

## Applicable Funding Programs

### Federal Grants

#### NSF SBIR Phase I — Behavioral Technology

- **Program:** National Science Foundation Small Business Innovation Research
- **Amount:** $275,000 (Phase I), $1,000,000 (Phase II)
- **Fit:** Styx applies behavioral economics research to a novel distributed systems architecture. The Fury consensus mechanism and loss-aversion-calibrated contract design are research contributions.
- **Key angle:** "Computational behavioral economics" — using algorithmic mechanism design to enforce honest auditing through game-theoretic incentives.
- **Timeline:** Rolling submissions, 6-month review cycle

#### NIH SBIR — Digital Therapeutics / Mental Health Technology

- **Program:** National Institutes of Health, specifically NIMH (mental health) or NIDA (substance abuse)
- **Amount:** $275,000 (Phase I)
- **Fit:** Styx's Recovery Protocol is a multi-phase behavioral contract system designed for addiction recovery and mental health habit formation. The B2B tier integrates directly with therapist workflows.
- **Key angle:** "Digital adjunct to behavioral therapy" — Styx as a between-session tool that therapists prescribe to reinforce treatment plans.
- **Required:** IRB approval for any human subjects research, clinical advisor

#### SAMHSA Grants — Substance Abuse Prevention

- **Program:** Substance Abuse and Mental Health Services Administration
- **Amount:** $100,000-$500,000
- **Fit:** Recovery Protocol contracts for substance abuse recovery, with peer audit verification replacing self-reporting (a known failure mode in recovery programs).
- **Key angle:** Community-verified recovery accountability

### Accelerators

#### Y Combinator

- **Amount:** $500,000 (standard deal)
- **Fit:** Novel market mechanism (behavioral contracts + peer audit), strong technical foundation, clear business model
- **Application emphasis:** Completion rate differential (65% vs 25-30% for alternatives), B2B clinical channel as distribution moat
- **Timeline:** Biannual batches (Jan, Jun)

#### Techstars (multiple tracks)

- **Amount:** $120,000
- **Relevant tracks:** Healthcare, Social Impact, AI
- **Fit:** Healthcare track for mental health / recovery applications; Social Impact for financial literacy and behavioral empowerment
- **Timeline:** Annual per track

#### Indie.vc / Calm Fund / Earnest Capital

- **Amount:** $100,000-$250,000
- **Fit:** Revenue-based financing aligned with Styx's bootstrappable economics (breakeven at ~60-150 users). These funds specifically target profitable-by-design businesses.
- **Application emphasis:** Unit economics ($8.44 contribution margin per contract, 98%+ gross margin), low burn rate ($49/mo pre-launch)

### Arts / Humanities (if creative angle)

#### NEA — Technology + Arts Intersection

- **Amount:** $10,000-$100,000
- **Fit:** If Styx is framed as a creative practice tool — artists committing to daily practice through behavioral contracts
- **Key angle:** "Creative accountability infrastructure" — enabling artistic discipline through game-theoretic commitment devices
- **Weak fit, but worth monitoring**

## Budget Template: $50,000 Grant (6 months)

| Category | Amount | % | Description |
|----------|--------|---|-------------|
| **Infrastructure** | $3,000 | 6% | Render upgrades, R2 storage, monitoring tools |
| **Development** | $15,000 | 30% | AI-assisted development tools, contractor for mobile app |
| **User Research** | $8,000 | 16% | Behavioral economics study with 100+ participants |
| **Clinical Partnerships** | $5,000 | 10% | Therapist/coach onboarding, B2B pilot with 5 practices |
| **Marketing** | $7,000 | 14% | Content marketing, behavioral science conference attendance |
| **Legal** | $5,000 | 10% | Terms of service, privacy policy, escrow compliance review |
| **Testing / QA** | $3,000 | 6% | Penetration testing, load testing, security audit |
| **Contingency** | $4,000 | 8% | Unexpected costs, scope adjustments |
| **TOTAL** | **$50,000** | **100%** | |

## Budget Template: $150,000 Grant (12 months)

| Category | Amount | % | Description |
|----------|--------|---|-------------|
| **Infrastructure** | $8,000 | 5% | Production-grade Render, CDN, monitoring stack |
| **Personnel** | $50,000 | 33% | Part-time contractor (frontend), part-time support hire |
| **Development** | $25,000 | 17% | AI tools, hardware oracle integrations (Apple Health, Fitbit) |
| **User Research** | $20,000 | 13% | Controlled study: Styx vs self-report, 500+ participants, IRB |
| **Clinical Partnerships** | $12,000 | 8% | B2B pilot expansion to 20 practices, clinical advisory board |
| **Marketing** | $15,000 | 10% | Paid acquisition testing, conference talks, case studies |
| **Legal / Compliance** | $10,000 | 7% | Money transmitter analysis, state-by-state compliance review |
| **Contingency** | $10,000 | 7% | |
| **TOTAL** | **$150,000** | **100%** | |

## Impact Metrics

These metrics should be cited in applications to demonstrate measurable outcomes:

### Primary Metrics

| Metric | Target (6 mo) | Target (12 mo) | Measurement |
|--------|---------------|----------------|-------------|
| Contracts completed | 500 | 5,000 | Ledger records |
| Completion rate | 60%+ | 65%+ | Completed / total contracts |
| Unique users | 200 | 2,000 | Account registrations |
| B2B practitioners | 5 | 20 | Subscription records |
| Fury audit accuracy | 90%+ | 92%+ | Correct audits / total audits |

### Secondary Metrics

| Metric | Target (12 mo) | Measurement |
|--------|----------------|-------------|
| Recovery Protocol enrollments | 50 | Contracts with recovery category |
| Therapist-referred contracts | 200 | Contracts created via B2B portal |
| Repeat contract rate | 40%+ | Users with 2+ contracts |
| Average stake amount | $35-$50 | Ledger records |
| Ledger integrity incidents | 0 | Reconciliation alerts |

### Research Metrics (for academic-oriented grants)

| Metric | Description |
|--------|-------------|
| λ validation | Measured loss aversion coefficient vs theoretical 1.955 |
| Completion rate by stake size | Dose-response curve for financial commitment |
| Fury accuracy by experience | Auditor learning curve |
| Self-report vs Fury-verified discrepancy | Quantifies gaming reduction |

## Styx-Specific Pitch Points by Audience

### For Behavioral Science Reviewers

- Loss aversion coefficient (λ=1.955) as a design parameter, not just a theoretical reference
- Fury mechanism as an implementation of mechanism design (Myerson, Maskin)
- Double-entry ledger as institutional commitment to financial integrity
- Completion rate claims are projections from literature, not fabricated — cite Royer et al. (2015), Charness & Gneezy (2009)

### For Technology Reviewers

- TypeScript monorepo (Turborepo) with NestJS 11, Next.js 16, React Native/Expo, Tauri
- BullMQ for asynchronous Fury routing with configurable priority queues
- PostgreSQL double-entry ledger with continuous reconciliation
- 499+ tests, 8 validation gates, Playwright E2E, full CI/CD
- Terraform IaC, Docker Compose local dev, Render deployment

### For Mental Health / Clinical Reviewers

- Recovery Protocol: multi-phase contracts for substance abuse, eating disorders, behavioral addictions
- B2B integration: therapists create and monitor contracts for clients
- Privacy-first: PII encrypted at rest, behavioral data separated from financial data
- Crisis routing: contracts can be paused/modified if user enters crisis (clinical override)
- Not a replacement for therapy — a between-session accountability tool

### For Financial / Business Reviewers

- $9 platform fee per $39 contract, 98%+ contribution margin
- B2B SaaS ($49-$999+/mo) provides recurring revenue stability
- Breakeven at ~60-150 users depending on scenario
- Pre-launch burn rate: ~$49/mo
- Clear path to profitability without external funding

## Application Checklist

For any funding application, prepare:

- [ ] Executive summary (1 page) — use elevator pitch + problem/solution above
- [ ] Technical architecture diagram — from `docs/architecture/`
- [ ] Financial projections — from `docs/finance/financial-projections.md`
- [ ] Unit economics summary — from `docs/finance/unit-economics.md`
- [ ] Demo video or screenshots — deploy beta, record walkthrough
- [ ] Team bio — solo founder with AI-augmented development capability
- [ ] Letters of intent — from 2-3 potential B2B practitioners
- [ ] Budget narrative — use templates above, customize to program requirements
- [ ] Impact measurement plan — use metrics tables above
- [ ] IRB protocol (if clinical) — required for NIH, SAMHSA
- [ ] Compliance analysis — money transmitter status, state licensing
