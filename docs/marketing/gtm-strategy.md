---
generated: true
department: GRO
artifact_id: G1
governing_sop: "SOP--go-to-market.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Go-to-Market Strategy

## Executive Summary

Styx ("The Blockchain of Truth") enters the $10B+ habit/wellness market as the only platform combining financial escrow, peer audit, and behavioral physics (λ=1.955). The GTM strategy follows a three-phase rollout: Private Beta → Public Beta → Launch, with B2B practitioner partnerships as the primary acquisition channel.

## Competitive Positioning

Styx is **not** a habit app, **not** gambling, and **not** therapy.

| Competitor | Model | Styx Differentiator |
|-----------|-------|---------------------|
| Beeminder | Self-reported data, pledge to charity | Fury peer audit eliminates self-reporting; money returns to user on success |
| StickK | Commitment contracts, charity stakes | Financial escrow (Stripe FBO) with double-entry ledger; peer verification |
| Habitica | Gamified habits, no real money | Real financial consequences; behavioral physics, not game mechanics |
| Streaks | Streak tracker, no stakes | Loss aversion λ=1.955 makes failure 2x as painful as success feels good |

**Positioning statement:** For adults who are serious about behavioral change, Styx is the only accountability platform where real money and peer auditors enforce follow-through — because willpower alone fails 92% of the time.

## Phase 1: Private Beta

**Timeline:** Weeks 1-8
**Goal:** Validate core loop (Oath → Stake → Proof → Fury Audit → Outcome) with controlled cohort

### Parameters
- **Access:** Invite-only via `STYX_PRIVATE_BETA` feature flag
- **Money mode:** Test money (Stripe test mode) — no real financial risk
- **Users:** 50-100 consumers recruited through 5-10 therapist/coach partners
- **Geography:** US-only (single jurisdiction simplifies compliance)
- **Oath categories:** Recovery + Biological only (highest urgency, clearest verification criteria)

### Success Criteria
- Contract completion rate ≥ 55%
- Fury audit accuracy ≥ 90% (agreement with ground truth)
- NPS ≥ 40 among active users
- Average proof submission latency < 12 hours
- Zero critical escrow accounting errors (double-entry ledger balanced)

### Practitioner Partner Selection
- 5-10 licensed therapists or certified coaches
- Must have 5+ active clients willing to participate
- Must be comfortable with digital tools and app-based workflows
- Preferred specializations: addiction recovery, CBT, executive coaching
- Onboarded with white-glove support (1:1 video calls, dedicated Slack channel)

### Feedback Loops
- Weekly check-in surveys (consumers + practitioners)
- Bi-weekly video debrief with practitioner partners
- In-app feedback widget on every screen
- Discord channel for beta participants (moderated)

## Phase 2: Public Beta

**Timeline:** Weeks 9-20
**Goal:** Validate real-money economics and organic acquisition

### Parameters
- **Access:** Open registration (waitlist removed)
- **Money mode:** Real money via Stripe production mode
- **Users:** 200-500 consumers, 20-30 practitioner partners
- **Oath categories:** Recovery + Biological + Cognitive (expand incrementally)
- **Contract amounts:** $39 minimum (includes $9 platform fee), $199 maximum during beta

### Key Activities
- Activate Stripe FBO production escrow
- Enable KYC/AML for stakes above $100
- Launch Discord community (public, moderated)
- Begin content marketing (blog, social, newsletter)
- Collect testimonials and completion rate data for marketing assets
- Run first A/B tests on contract creation flow

### Success Criteria
- 500 active users by end of Phase 2
- 15+ B2B partners actively assigning contracts
- $2K MRR from platform fees + practitioner subscriptions
- Contract completion rate ≥ 58%
- Organic sign-up rate growing 10% week-over-week
- Fury network: 50+ active auditors, < 2 hour average audit turnaround

### Risk Mitigations
- Aegis protocol active: health guardrails prevent dangerous contracts
- Linguistic Cloaker validated for all user-facing copy (app store readiness)
- Dispute resolution process documented and tested
- Financial reconciliation runs daily (automated double-entry audit)

## Phase 3: Launch

**Timeline:** Weeks 21-30
**Goal:** Full product launch with all oath categories and channels

### Parameters
- **Access:** General availability
- **Oath categories:** All 7 (Biological, Cognitive, Professional, Creative, Environmental, Character, Recovery)
- **Platforms:** Web (Next.js 16), iOS (React Native/Expo), Android (React Native/Expo), Desktop (Tauri)
- **B2B portal:** Full self-service with billing, analytics, custom templates
- **Contract amounts:** $39-$999 (expanded range)

### Launch Activities
- App store submissions (iOS + Android) — linguistic cloaker must pass review
- PR campaign: behavioral science angle, "put your money where your mouth is"
- B2B outreach at scale: therapy directories, coach conferences, wellness publications
- Referral program launch (practitioner-to-practitioner + consumer-to-consumer)
- Partnership announcements with founding practitioner cohort

### Launch Metrics (Month 1)
| Metric | Target |
|--------|--------|
| Total users | 1,000 |
| B2B partners | 10 |
| MRR | $5,000 |
| Contract completion rate | 60% |
| Fury network size | 100+ |
| App store rating | ≥ 4.2 stars |
| Support response time | < 4 hours |

## Channel Strategy

### 1. B2B Partnerships (Primary — 60% of acquisition)

Therapists, coaches, and rehab centers assign Styx contracts to their clients. This is the highest-leverage channel because:
- Practitioners bring built-in cohorts (5-50 clients each)
- Professional recommendation drives trust and completion rates
- Recurring practitioner subscriptions ($49-$999/mo) provide predictable revenue
- Low CAC: one sales conversation yields multiple end-users

**Tactics:**
- Direct outreach to therapists in Psychology Today directory
- Partnerships with coaching certification bodies (ICF, CCE)
- Conference presence at NAADAC, APA, and ICF events
- Free trial for Solo tier (30 days, 3 clients)

### 2. Content Marketing (20% of acquisition)

Behavioral science education content positions Styx as the authority on accountability economics.

**Content pillars:**
- Loss aversion and behavioral economics (academic credibility)
- Success stories and completion rate data (social proof)
- Recovery and wellness guidance (empathy-driven, SEO-rich)
- B2B practice optimization (practitioner audience)

### 3. Social Proof & Word of Mouth (10% of acquisition)

- Completion rate statistics published monthly ("78% of Styx users complete their Recovery oaths")
- User testimonials (with consent) featured on landing pages
- Discord community as organic referral engine
- "I survived Styx" badge/share mechanic after contract completion

### 4. App Store Organic (5% of acquisition)

- ASO for "accountability app", "commitment contract", "no-contact app"
- Linguistic Cloaker ensures all copy passes app store review guidelines
- Screenshot and video assets showing Oath creation + Fury audit flow

### 5. Referral Program (5% of acquisition)

- Consumer: refer a friend, both get $5 off next contract
- Practitioner: refer a colleague, referring practitioner gets 1 month free
- Fury: recruit a new auditor, earn bonus on their first 10 audits

## Budget Allocation

**Bootstrap phase: $0 paid acquisition.** All channels are organic-first.

| Category | Monthly Budget | Notes |
|----------|---------------|-------|
| Content creation | $0 | AI-assisted writing (ORGANVM system) |
| Social media | $0 | Organic posting, no paid ads |
| Conference attendance | $0 (Phase 1-2) | Virtual presence only until revenue supports travel |
| Email tooling | $0-$50 | Free tier (Resend/Postmark) until 1000+ subscribers |
| Discord | $0 | Free community server |
| Design assets | $0 | AI-generated + Figma free tier |
| **Total** | **$0-$50/mo** | Scale paid channels only after $5K MRR milestone |

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App store rejection (gambling classification) | Medium | High | Linguistic Cloaker + pre-submission legal review |
| Low Fury supply (not enough auditors) | Medium | High | Bootstrap with founding team + incentive bonuses |
| Practitioner resistance to money-based accountability | Low | Medium | Emphasis on evidence base (λ=1.955) + free trial |
| Stripe high-risk merchant restrictions | Medium | High | Pre-approval process, clean transaction history in beta |
| Regulatory challenge (is Styx gambling?) | Low | High | Legal opinion on file; skill-based + peer-audited ≠ gambling |

## Timeline Summary

| Week | Phase | Milestone |
|------|-------|-----------|
| 1-2 | Private Beta | First 5 practitioner partners onboarded |
| 3-4 | Private Beta | 50 users, first completed contracts |
| 5-8 | Private Beta | Beta readiness metrics validated |
| 9-12 | Public Beta | Real money activated, 200 users |
| 13-16 | Public Beta | Discord community live, content engine running |
| 17-20 | Public Beta | 500 users, 15+ B2B partners |
| 21-24 | Launch | App store submissions, PR campaign |
| 25-28 | Launch | All oath categories live, referral program |
| 29-30 | Launch | 1000 users, $5K MRR target |
