# Referral Loop — Program Design & Implementation
> Issue: #345
> Phase: Private Beta → Public Beta

## Overview

Styx's referral program turns users into an acquisition channel. Unlike traditional SaaS referrals (discount on next payment), Styx's model is uniquely suited to referral mechanics because: (a) every contract completion is a shareable social signal, (b) integrity scores create status-based incentives, and (c) practitioner cohorts are natural viral loops. Target: 0.7 viral coefficient within 90 days of public beta.

## Waitlist Mechanics

### Waitlist Structure

```
User joins waitlist
    ├── Receives unique referral link
    ├── Gets position number + referral counter
    ├── Referral progress bar (5 → 10 → 20 → 50)
    └── Milestone unlocks:
        1 referral  →  Priority access (skip 100)
        3 referrals →  Priority access + 1 free contract fee
        5 referrals →  Immediate access + 3 free contract fees
        10 referrals → Immediate access + 3 free fees + Beta Tester badge
```

### Waitlist → Full Access Flow

| Stage | Trigger | Action |
|-------|---------|--------|
| Joined | User submits email | Issue referral link, show position # |
| 1 referral | Friend signs up via link | "You moved up [X] spots!" notification |
| 3 referrals | Milestone hit | Unlock free contract fee coupon |
| 5 referrals | Milestone hit | Unlock immediate access + badge |
| Accepted | User gets full access | Referral link stays active for referral rewards |

### Waitlist Referral UI

**Submitted via:**
- Web: Banner on waitlist confirmation page + dashboard widget
- Email: Automated "Your referral link" email
- Mobile: App screen after beta access (Phase 2)

**Referral link format:** `styx.app/join?ref={user_id}`

## Cohort Invite System

### Practitioner-Led Cohorts

Practitioners get a cohort invite code that they distribute to clients. This is the highest-value referral loop because one practitioner can onboard 5-50 clients.

| Practitioner Tier | Invite Capacity | Invite Code Type | Client Benefit |
|-------------------|-----------------|------------------|----------------|
| Free trial (Solo) | 3 client invites | Single-use codes | 1st contract fee waived |
| Paid Solo ($49/mo) | 10 client invites | Reusable cohort code | 1st contract fee waived |
| Practice ($199/mo) | 50 client invites | Reusable + trackable | 1st contract fee waived + priority audit |
| Enterprise ($999/mo) | Unlimited | Custom codes per client group | 1st contract fee waived + dedicated support |

**Cohort code benefits to practitioner:**
- Dashboard shows cohort progress (completion rates per client)
- Referral rewards: practitioner gets 1 month free for every 3 clients who complete their first contract
- Cohort leaderboard: practitioners compete on client completion rates

### Consumer Invite Loops

| Loop Type | Mechanism | Viral Potential |
|-----------|-----------|-----------------|
| Completion share | "I just completed my Styx contract!" share card | Medium — pride-based sharing |
| Challenge invite | "I bet you can't complete this goal — $39 on it" | High — competitive framing |
| Fury recruitment | "I'm a Fury auditor — earn bounties by reviewing proofs" | Medium — economically motivated |
| Cohort referral | "My therapist uses Styx — here's my invite code" | Very high — trust-based |

### Share Card Content

Each shareable completion card contains:
- User's anonymized goal (e.g., "Completed: 30 days no-contact")
- Days completed / streak length
- Stake amount returned
- "I use Styx — here's how it works" CTA
- Referral link QR code
- Styx branding (minimal — let the story lead)

Generated server-side as an image (Cloudflare R2 + sharp) to avoid client-side social preview issues.

## Referral Incentives

### Consumer Incentive Tiers

| Action | Reward | Value | Redemption |
|--------|--------|-------|------------|
| Referral sign-up (waitlist) | Move up 50 positions | ~$5 equiv. | Automatic |
| Referral completes first contract | 50% off next contract fee | $4.50 | Coupon code |
| 3 referrals complete contracts | 1 free contract fee | $9.00 | Coupon code |
| 5 referrals complete contracts | 3 free contract fees | $27.00 | Coupon code |
| 10 referrals complete contracts | 1 month unlimited contracts | ~$36.00 | Feature unlock |

### Practitioner Incentive Tiers

| Action | Reward | Value |
|--------|--------|-------|
| Referral sign-up (practitioner) | 1 month free Solo tier | $49 |
| Referred practitioner's first client completes contract | $25 credit | $25 |
| 5 referred practitioners active | 1 month free Practice tier | $199 |
| 10 referred practitioners active | 1 month free Enterprise tier | $999 |

### Fury Auditor Incentives

| Action | Reward |
|--------|--------|
| Referral completes first audit | +0.5x bounty bonus on next 10 audits |
| 5 referrals active as auditors | Auditor badge + priority queue access |
| 10 referrals active as auditors | 1 month 1.5x bounty multiplier |

### Integrity Points Integration

Referral activity contributes to Integrity Score:

| Referral Action | Integrity Points |
|----------------|-----------------|
| Referral signs up | +5 |
| Referral completes first contract | +15 |
| Referral refers someone (chain) | +3 |
| Referral becomes active Fury | +20 |

Integrity Score formula: `Base(50) + 5/completion - 15/fraud - 20/strike - 1/inactive_month + referral_bonus`

## Viral Coefficient Targeting

### Target: 0.7 viral coefficient within 90 days

```
v = (invitations_sent_per_user) × (conversion_rate_of_invitations)
v = 2.5 × 0.28 = 0.7
```

### Levers to Pull

| Lever | Current Baseline | Target | Impact on v |
|-------|-----------------|--------|-------------|
| Invitations sent/user | 0.5 (organic) | 2.5 | Direct multiplier |
| Invitation conversion | 10% (cold) | 28% | Direct multiplier |
| Completion share rate | — | 15% of users | Increases invites |
| Practitioner cohort size | — | 5 clients/cohort | Step function |

### Break-Even Analysis

| Viral Coefficient | Growth Trajectory | Days to 1,000 Users |
|-------------------|-------------------|---------------------|
| 0.3 | Slow organic | ~180 |
| 0.5 | Moderate | ~90 |
| 0.7 (target) | Strong | ~45 |
| 1.0 | Viral | Never reached |
| >1.0 | Exponential | <30 |

### Accelerator Experiments

**First 30 days:** Manual high-touch referral seeding
```
1. Identify 20 "power users" (high completion rate, high engagement)
2. Equip them with 5 referral codes each
3. Personal outreach from founder: "You're our ideal advocate — here's what we need"
4. Track per-user referral performance
5. Double down on top 5 referrers
```

**After 100 users:** Automated referral flows

### Referral Funnel Optimization

| Funnel Stage | Current | Target | Optimization |
|-------------|---------|--------|--------------|
| Users who see referral CTA | 100% | 100% | Inline in dashboard + completion flow |
| Users who click CTA | 30% | 50% | Better placement, completion modal |
| Users who send referrals | 15% | 30% | Incentive preview, social proof |
| Referral sign-ups/invite | 10% | 28% | Landing page optimization |
| Referral contract completion | 60% | 70% | Onboarding improvement |

## Tracking Implementation

### Data Model

```yaml
ReferralCode:
  id: uuid
  owner_user_id: uuid
  code: string (e.g., "STYX-ALICE-2F7K")
  type: enum(waitlist, cohort, completion_share, fury_recruit)
  max_uses: int (nullable for unlimited)
  current_uses: int
  reward_tier: enum(skip_line, fee_discount, free_contract, badge)
  created_at: timestamp
  expires_at: timestamp (nullable)

ReferralEvent:
  id: uuid
  referrer_user_id: uuid
  referred_user_id: uuid
  referral_code_id: uuid
  event_type: enum(sign_up, first_contract, first_completion, first_audit)
  reward_granted: jsonb (what was awarded)
  created_at: timestamp

RewardPool:
  id: uuid
  user_id: uuid
  pending_rewards: jsonb (list of unredeemed coupons)
  total_rewards_granted: decimal
  created_at: timestamp
  updated_at: timestamp
```

### Implementation Notes

| Component | Location | Details |
|-----------|----------|---------|
| Referral code generation | API service (`src/api`) | Deterministic from user ID + salt |
| Reward calculation | Background job (BullMQ) | Event-driven, async |
| Coupon creation | Stripe API integration | Creates promotion code tied to user |
| Share card generation | API → R2 (sharp) | Server-side image with QR |
| Referral dashboard | Web app (`src/web`) | User-visible metrics + links |
| Analytics tracking | PostHog / custom events | Attribution funnel |

### Stripe Coupon Integration

When reward is triggered:
1. API calls `POST /v1/promotion_codes` with coupon ID
2. Coupon is restricted to the referred user's Stripe customer ID
3. Coupon has `max_redemptions: 1` and `expires_at` (30 days)
4. Coupon is associated with a "referral reward" product in Stripe for reporting

### Fraud Prevention

| Check | Implementation | Trigger |
|-------|---------------|---------|
| Same device/IP for referrer + referred | Fingerprint + IP check | Flag for manual review |
| Referral of self (email alias) | Email domain + name similarity | Auto-reject |
| High velocity from single referrer | >10 referrals in 24h | Rate limit + manual review |
| Low engagement referrers | Referrer has no completed contracts | Delay reward until referrer completes 1 contract |
| Referral spam | Pattern: same-name accounts, rapid sign-ups | Auto-block + flag to admin |

## Measurement & Reporting

| Metric | Tool | Frequency | Target |
|--------|------|-----------|--------|
| Viral coefficient (v) | Custom analytics | Weekly | 0.7 |
| Referral conversion rate | PostHog | Daily | 28% |
| Invitations sent/user | PostHog | Weekly | 2.5 |
| Rewards redeemed | Stripe dashboard | Monthly | 60% |
| Referral-attributed sign-ups | UTM + code tracking | Daily | 40% of total |
| Referral fraud rate | Manual + automated | Weekly | <2% |
| Cost per referral acquisition | Stripe + analytics | Monthly | <$2 |
| Practitioner cohort size | Dashboard | Monthly | 5 avg |

## Rollout Sequence

| Phase | Timeline | Referral Features Active |
|-------|----------|------------------------|
| Private beta | Week 1-8 | Manual referrals only (founder/practitioner assigns codes) |
| Public beta | Week 9-20 | Waitlist referral links, completion share cards, practitioner cohort invites |
| Launch | Week 21+ | Full automated program: all incentive tiers, Stripe coupons, viral loop optimization |
