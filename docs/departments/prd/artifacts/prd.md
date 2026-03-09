---
generated: true
department: PRD
artifact_id: P1
governing_sop: "SOP--product-requirements.md"
phase: genesis
product: styx
date: "2026-03-08"
---

# Product Requirements Document: Styx

**Tagline:** The Blockchain of Truth -- peer-audited behavioral contracts enforced by financial stakes.

## 1. Problem Statement

People fail at behavior change because the consequences of failure are abstract and deferred. Research consistently shows that 92% of New Year's resolutions fail, therapy homework completion rates hover around 30-40%, and self-reported habit tracking has a well-documented honesty gap.

The core psychological insight: humans are loss-averse. Kahneman and Tversky's prospect theory demonstrates that losses loom approximately twice as large as equivalent gains (lambda = 1.955). Yet no existing product fully exploits this asymmetry with real financial stakes, decentralized verification, and domain-specific safety protocols.

Existing commitment device apps (stickK, Beeminder, Forfeit) suffer from:
- **Self-reporting fraud.** Users verify their own compliance. The fox guards the henhouse.
- **No real consequences.** Donations to charity on failure feel virtuous, not punishing.
- **No safety guardrails.** A user can set a weight-loss goal that incentivizes anorexia.
- **No peer economy.** Verification is binary (yes/no), not audited by an independent network.

See `docs/research/research--commitment-device-market-analysis.md` and `docs/research/research--competitor-teardown-v2.md` for detailed competitive analysis.

## 2. Solution

Styx is a peer-audited behavioral market that uses loss aversion to enforce habit follow-through via financial stakes.

**How it works:**
1. **Oath creation.** A user creates a behavioral contract (an "Oath") specifying the habit, verification criteria, duration, and financial stake ($39 standard contract).
2. **Vault funding.** The stake is deposited into an FBO (For Benefit Of) escrow account via Stripe. The money is real and at risk.
3. **Proof submission.** At each verification window, the user submits proof of compliance (photo, check-in, or sensor data).
4. **Fury audit.** A decentralized network of peer auditors ("Furies") reviews the proof. A quorum of 3-of-5 must agree on pass/fail. Auditors stake $2 of their own money to participate, aligning incentives.
5. **Settlement.** On contract completion, the user's stake is returned. On failure, the stake is forfeited (distributed to Furies and the platform).
6. **Integrity scoring.** A persistent reputation score (base 50 + completions - penalties) determines stake limits, Fury eligibility, and platform trust tier.

**Key differentiators:**
- Real money at risk (not charity donations)
- Decentralized peer audit (not self-reporting)
- Domain-specific safety (Aegis protocol for health, Recovery protocol for breakups)
- Double-entry ledger (financial-grade accounting)
- B2B channel (therapists/coaches assign contracts to clients)

## 3. Target Users

### 3.1 Primary: Breakup Recovery (No-Contact)

The initial wedge market. People going through breakups who want to enforce no-contact commitments. This segment is emotionally motivated, willing to pay, and has a clear binary verification criterion (did you contact the ex or not). Recovery contracts use the Recovery Protocol with specific guardrails (max 30 days, max 3 no-contact targets, mandatory cooldown).

### 3.2 Secondary: Fitness and Health Goals

Users setting biological oaths (exercise frequency, dietary compliance, weight targets). This segment uses the Aegis protocol to enforce safety (BMI floor 18.5, 2% weekly loss velocity cap). Hardware oracle integration (HealthKit, Google Fit) planned for post-beta.

### 3.3 Tertiary: Professional Habits

Users committing to professional development (study hours, project milestones, skill practice). These contracts use the Professional oath category with proof-of-work verification (screenshots, time-tracking exports).

### 3.4 B2B: Therapists and Coaches

Licensed practitioners who subscribe to assign behavioral contracts to their clients. The practitioner dashboard provides: client contract management, compliance reporting, batch contract creation, and outcome analytics. Subscription tiers: Solo ($49/mo, 10 clients), Practice ($199/mo, 50 clients), Enterprise ($999+/mo, unlimited).

See `docs/planning/user-personas.md` for detailed persona profiles.

## 4. Core Features

### 4.1 Behavioral Contracts (Oaths)

- 7 oath categories: Biological, Cognitive, Professional, Creative, Environmental, Character, Recovery
- Configurable parameters: duration (7-90 days), verification frequency (daily/weekly), stake amount ($10-$500 based on integrity tier)
- Grace period: 2 days per month (configurable by practitioner in B2B)
- Onboarding bonus: $5 credit on first contract completion

### 4.2 Fury Peer Audit Network

- Auditors apply and are vetted (minimum integrity score, identity verification)
- $2 auditor stake per assignment (skin in the game)
- 3-of-5 quorum for pass/fail decisions
- Round-robin assignment with conflict-of-interest detection
- Auditor reputation tracking and ejection for bad-faith audits

### 4.3 Double-Entry Ledger

- Every financial movement produces balanced debit/credit entries
- Immutable audit trail (soft deletes only, no modifications)
- Real-time balance reconciliation against Stripe FBO
- Gate 01 (Phantom Money) validates integrity in CI

### 4.4 Integrity Scoring

- Base score: 50
- Completion bonus: +5 per successful contract
- Failure penalty: -10 per failed contract
- Fury audit bonus: +2 per accurate audit
- Score determines: maximum stake amount, Fury eligibility threshold, platform trust tier
- Score is public (viewable by other users and Furies)

### 4.5 Aegis Health Protocol

- BMI floor enforcement (18.5) on biological oaths
- 2% weekly loss velocity cap on weight-related oaths
- Mandatory health disclaimer acceptance
- Automatic contract rejection if parameters violate safety bounds
- See `docs/legal/legal--aegis-protocol.md`

### 4.6 Recovery Protocol

- No-contact contract specialization
- Max 30-day duration
- Max 3 no-contact targets per contract
- Mandatory cooldown between consecutive recovery contracts
- Specialized verification (digital exhaust monitoring, not physical proof)
- See `docs/research/research--digital-exhaust-no-contact-contracts.md`

### 4.7 Escrow (Vault)

- Stripe FBO (For Benefit Of) escrow
- Platform fee: $9 per $39 standard contract
- Funds held in segregated account (not commingled with operating funds)
- Automated settlement on contract completion/failure
- Dispute resolution via elevated Fury review

### 4.8 B2B Practitioner Module

- Practitioner dashboard with client management
- Batch contract creation
- Compliance reporting and outcome analytics
- White-label contract templates per practice
- Subscription billing (Stripe, monthly)

## 5. Success Metrics

| Metric | Beta Target (3 months) | Launch Target (12 months) |
|--------|----------------------|--------------------------|
| Contract completion rate | > 60% | > 65% |
| Fury audit accuracy | > 90% | > 95% |
| User retention (30-day) | > 40% | > 50% |
| User retention (90-day) | > 20% | > 30% |
| MRR | $1,000 | $10,000 |
| B2B practitioner subscribers | 5 | 50 |
| Fury auditor pool | 20 | 200 |
| Ledger discrepancy incidents | 0 | 0 |
| Aegis safety violations | 0 | 0 |

## 6. Non-Goals

- **Styx is not a gambling platform.** Contracts are commitment devices with user-controlled outcomes, not bets on external events. See `docs/legal/legal--performance-wagering.md` for the legal analysis.
- **Styx is not a social media platform.** There is no feed, no followers, no viral mechanics. Social features are limited to Fury auditing and practitioner-client relationships.
- **Styx is not a general productivity app.** It does not compete with Todoist, Notion, or Habitica. Styx is specifically for high-stakes behavioral commitments where financial consequences matter.
- **Styx does not provide medical advice.** The Aegis protocol is a safety guardrail, not a health recommendation. Users with eating disorders or body dysmorphia should consult healthcare professionals.
- **Styx does not offer investment returns.** Stake returns are binary (full return on success, forfeit on failure). There is no yield, interest, or appreciation.

## 7. Technical Constraints

- **US-only initially.** The `STYX_ALLOWLIST_US_ONLY` feature flag restricts registration to US-based users. International expansion requires per-jurisdiction regulatory analysis (see `docs/legal/regulatory-risk-register.md`).
- **No native HealthKit/Google Fit integration yet.** Biological oath verification relies on photo proof and manual check-in during beta. Hardware oracle integration is post-beta.
- **High-risk merchant underwriting.** Stripe classifies behavioral contracts as potentially high-risk. FBO escrow structure mitigates this but requires Stripe approval and ongoing compliance.
- **Linguistic cloaker required for app stores.** Apple and Google app stores flag gambling-adjacent language. The linguistic cloaker maps internal terminology (stake, bet, wager) to approved vocabulary (vault, oath, commitment).

## 8. Phases

| Phase | Timeline | Scope |
|-------|----------|-------|
| Genesis | Complete | Architecture, research, legal analysis, competitor teardown |
| Foundation | Complete | Core implementation, CI/CD, test suite, 8 validation gates |
| Hardening | Current | Load testing, security audit, legal review, UX audit |
| Private Beta | Q2 2026 | 50-100 users, breakup recovery focus, manual Fury network |
| Public Beta | Q3 2026 | Open registration, automated Fury matching, B2B soft launch |
| Launch | Q4 2026 | Full B2B, mobile apps, marketing push |

## 9. Open Questions

1. Should Fury auditors be allowed to specialize by oath category, or must they be generalists?
2. What is the minimum viable Fury pool size for a functioning audit market?
3. Should failed stake forfeitures go 100% to Furies, or should a portion fund a "community pool" for bonuses?
4. How do we handle proof submission for cognitive/character oaths where verification is inherently subjective?
5. Should integrity scores decay over inactivity, or persist indefinitely?
