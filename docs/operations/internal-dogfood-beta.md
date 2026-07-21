# Internal Dogfood Beta — Founder Onboarding & Trusted Tester Program
> Issue: #369
> Phase: Pre-Private Beta (Weeks 0-2)

## Overview

Before any external user touches Styx, the founding team and 5-10 trusted testers must eat their own dogfood. This validates the core loop (Oath → Stake → Proof → Fury Audit → Outcome) with real behavior change goals, surfaces UI/UX issues in a safe environment, and generates the first batch of completion data for marketing assets. This doc covers founder onboarding, tester selection, feedback channels, weekly syncs, and exit criteria.

## Founder Onboarding

### Day 1: Founders Create Real Contracts

Each founder creates 3 contracts using their own real goals:

| Founder | Goal | Contract Type | Stake | Duration |
|---------|------|---------------|-------|----------|
| Founder A | Strength training 4x/week | Fitness verified | $39 | 30 days |
| Founder A | No alcohol for 30 days | Recovery | $39 | 30 days |
| Founder A | Write 500 words daily | Creative | $29 | 14 days |
| Founder B | Meditate 10 min daily | Cognitive | $39 | 30 days |
| Founder B | Read 20 pages/day | Cognitive | $29 | 30 days |
| Founder B | No sugar for 14 days | Biological | $39 | 14 days |

### Founder Dogfood Checklist

- [ ] Create Styx account (dogfood instance)
- [ ] Set up Stripe test mode payment method
- [ ] Create 3 contracts with real stakes (see above)
- [ ] Submit first proof of completion
- [ ] Receive and review Fury audit verdict
- [ ] Experience successful completion (get money back)
- [ ] Try failure scenario (miss a deadline intentionally)
- [ ] Experience failed contract (money forfeit)
- [ ] View own analytics dashboard
- [ ] Submit in-app bug/feedback report
- [ ] Try mobile flow (web-based PWA)
- [ ] Try Fury auditor flow (review another founder's proof)

### Day 1 Verification

| Check | Expected | Actual |
|-------|----------|--------|
| Fund escrow successfully | Money held in Stripe test mode | |
| Proof upload works | File uploads to R2, hash recorded | |
| Audit assigned | Fury queue populates, worker picks up | |
| Verdict reaches consensus | ≥ 2 of 3 auditors agree | |
| Escrow released on success | Money returns to test account | |
| Escrow captured on failure | Money moves to counterparty | |
| Ledger balanced | Debits = credits on every transaction | |
| Notification received | Email + in-app for each status change | |

## Trusted Tester Selection

### Tester Profile

| Criteria | Must-Have | Nice-to-Have |
|----------|-----------|--------------|
| Relationship to founders | Personal or professional trust | Previous beta tester experience |
| Domain expertise | Understands accountability/habits | Background in behavioral science |
| Technical comfort | Can install test builds, report bugs | Can read API docs |
| Commitment | 4-week active testing, 2-3 feedback submissions/week | Willing to do video call |
| Demographics | Represents target user segments | US-based (for geo compliance testing) |

### Target Mix (10 Testers)

| Segment | Count | Source |
|---------|-------|--------|
| Recovery-curious (recent breakup, sobriety attempt) | 3 | Founder network |
| Productivity/ADHD | 2 | Founder network |
| Fitness enthusiast | 2 | Founder network |
| Biohacker/self-optimizer | 1 | Founder network |
| No specific segment (general curiosity) | 2 | Founder network |

### Tester Sourcing

| Source | Expected Yield | Approach |
|--------|---------------|----------|
| Close friends/family | 3-4 | Direct ask: "Help me test something I'm building" |
| Former colleagues | 2-3 | "I'm building a startup and need early feedback" |
| Professional network (LinkedIn) | 2-3 | "Looking for beta testers for an accountability tool" |
| Warm referrals from testers | 1-2 | "Know anyone who'd be good for this?" |

### Tester Recruitment Script

```
Subject: Help me test Styx — an accountability tool I'm building

Hey [Name],

I'm building something and I'd love your honest feedback.

Styx is a platform where you put money on the line for your goals,
and peer reviewers verify you actually did the thing. Think:
"I bet $39 I'll exercise 4x this week" — and if you do it, you
get your money back.

I need 10 people to test the beta before anyone else sees it.
You'd get early access, free contracts (test money), and my
personal support if anything breaks.

What I need from you:
- Create 1-2 real contracts per week
- Submit feedback when something's off
- One 15-min feedback call at the end

That's it. No NDA needed — just honest opinions.

Want in?

[Name]
```

### Tester Agreement

- No NDA required (but ask testers not to screenshot/share publicly)
- No payment (test mode — no real money at risk)
- Feedback is confidential during beta
- Tester identity kept private (unless they volunteer for testimonials)
- Can leave at any time (no hard feelings)

## Dogfood Environment

### Environment Specs

| Component | Value |
|-----------|-------|
| API URL | `https://styx-dogfood-api.onrender.com` |
| Web URL | `https://styx-dogfood.onrender.com` |
| Database | Separate PostgreSQL instance (Render) |
| Stripe mode | Test mode |
| Feature flags | All enabled (including Fury, KYC mock, etc.) |
| Monitoring | Sentry + PostHog (dogfood project) |
| Authentication | Email + magic link (no SMS yet) |

### Tester Account Setup

| Step | Owner | Time |
|------|-------|------|
| Create account (invite via email) | Founder | 2 min/tester |
| Verify email | Tester | 1 min |
| Add payment method (test card: `4242...`) | Tester | 2 min |
| Create first contract | Tester | 5 min |
| Submit first proof | Tester | 3 min |
| Complete full loop | Tester | 5 min |

### Test Data Seeding

Initial data for testing non-obvious edge cases:
- Contracts with various proof types (photo, video, screenshot, file upload)
- Contracts at different stages (pending, in_progress, late, disputed, completed)
- Test Fury queue with various audit scenarios

## Feedback Channels

### Channel Architecture

| Channel | Purpose | Tool | Access |
|---------|---------|------|--------|
| In-app feedback | Bug reports, friction points | Custom widget (dashboard) | All testers |
| Discord channel | Real-time discussion, community | Private Discord server | All testers |
| Weekly survey | Structured feedback | Typeform | All testers (weekly) |
| Bug tracker | Verified bug reports | Linear/GitHub Issues | Founders + testers |
| 1:1 calls | Deep-dive sessions | Calendly | Post-test (5 testers) |
| Anonymous form | Honest feedback without attribution | Google Forms | All testers (optional) |

### In-App Feedback Widget

```
┌────────────────────────────┐
│  [Feedback]                │
│                            │
│  What's on your mind?      │
│                            │
│  ○ Bug / something broke   │
│  ○ Confusing / frustrating │
│  ○ Feature idea            │
│  ○ General feedback        │
│                            │
│  ┌─────────────────────┐   │
│  │ Describe...          │   │
│  └─────────────────────┘   │
│                            │
│  [Screenshot attached?]    │
│                            │
│  [Submit]                  │
└────────────────────────────┘
```

### Feedback Prioritization Labels

| Label | Definition | Response Time |
|-------|------------|---------------|
| `P0 - blocker` | Cannot complete core loop | < 1 hour |
| `P1 - critical` | Major feature broken, workaround exists | < 4 hours |
| `P2 - major` | Feature works but not as expected | < 24 hours |
| `P3 - minor` | Cosmetic, nice-to-have | < 72 hours |
| `P4 - suggestion` | Future feature idea | < 1 week |
| `question` | Tester needs help understanding | < 2 hours |

## Weekly Syncs

### Weekly Tester Sync (30 min)

| Time | Day | Attendees | Format |
|------|-----|-----------|--------|
| 12pm ET | Thursday | All testers (optional) | Google Meet |

**Agenda:**

| Section | Time | Content |
|---------|------|---------|
| Product update | 5 min | What changed this week, what's coming next |
| Tester wins | 5 min | Share completion stories ("I bet $39 on X and actually did it!") |
| Tester pain | 10 min | "What was frustrating this week?" — open floor |
| Bug review | 5 min | Recent fixes, known issues, workarounds |
| Feature preview | 3 min | Preview next week's feature, ask for thoughts |
| Open Q&A | 2 min | Anything else |

### Internal Sync (Founders Only) — Weekly

| Time | Day | Format |
|------|-----|--------|
| 30 min | Friday | Internal (no testers) |

**Agenda:**

| Section | Content |
|---------|---------|
| Tester sentiment | Overall mood, churn risk, vocal testers |
| Bug trends | Most reported, most severe, most ignored |
| Feature signals | Which features drive engagement/retention |
| Critical decisions | Feature freeze? Ramp up? Pivot? |
| Next week priorities | Based on tester feedback |

## Exit Criteria

### Dogfood Phase Exit Criteria

All criteria must pass before external beta can begin:

| # | Criterion | Measure | Pass Condition | Verified |
|---|-----------|---------|----------------|----------|
| 1 | Core loop stable | 50+ successful contract completions | Zero critical failures in last 20 completions | |
| 2 | Ledger integrity | All transactions reconciled | Every debit has matching credit, balance = 0 | |
| 3 | Fury audit functional | 100+ audits processed | >90% accuracy, <12h average turnaround | |
| 4 | No P0 bugs | Bug tracker | Zero unaddressed P0 bugs | |
| 5 | ≤ 3 P1 bugs | Bug tracker | <3 open P1 bugs (all with workarounds) | |
| 6 | Tester NPS ≥ 40 | Survey results | Average of last 3 weekly surveys | |
| 7 | Founders active | Dashboard logs | Both founders created ≥3 contracts, completed ≥2 | |
| 8 | Mobile-usable | PWA tested on iOS + Android | Core loop works on mobile browser | |
| 9 | Notification delivery | Email + in-app | 100% delivery, <5 min latency | |
| 10 | Team confident | Vote | Both founders agree: "Ready for external beta" | |

### Termination Criteria (Fail-Fast)

If any of these trigger during dogfood, pause external beta immediately:

| Trigger | Action |
|---------|--------|
| Financial discrepancy > $0.01 in reconciliation | Freeze all contracts, investigate |
| Proof system allows clear fraud (single test case) | Pause, fix, retest |
| Any tester expresses serious harm concern (mental health) | Immediate check-in, remove contract type if needed |
| Two consecutive weeks with NPS < 20 | Stop and redesign |
| Weekly tester dropout rate > 30% | Stop and investigate |

## Dogfood Phase Timeline

| Day | Activity | Owner |
|-----|----------|-------|
| 0 | Deploy dogfood environment | Technical co-founder |
| 0 | Founders create contracts (3 each) | Both founders |
| 1-2 | Founders complete full loop | Both founders |
| 2 | Recruit testers (10 invitations) | Both founders |
| 3 | Tester onboarding (create accounts, first contracts) | All |
| 4-6 | First contracts in progress, first bugs reported | Testers |
| 7 | First weekly sync | All |
| 7 | First bug triage + fixes deployed | Technical co-founder |
| 8-13 | Continuous testing + iterative fixes | All |
| 14 | Second weekly sync | All |
| 14 | Mid-phase survey | Testers |
| 15-20 | Core loop stress test (concurrent contracts) | Testers |
| 21 | Third weekly sync | All |
| 21 | Edge case testing (all failure modes) | Founders |
| 22-27 | Final bug pass + regression | Technical co-founder |
| 28 | Exit criteria review | Both founders |
| 28 | Final sync + thank-you | All |
| 29 | Close dogfood environment | Technical co-founder |

## Post-Dogfood

### Tester Transition

| Tester Interest | Action |
|-----------------|--------|
| Wants to continue | Invite to private beta (real money optional) |
| Done testing | Thank-you email + "You helped build this" reference |
| Wants to become Fury | Onboard as first Fury auditors |
| Wants to refer others | Give referral codes (see docs/marketing/referral-loop.md) |

### Dogfood Data Usage

| Data Point | Use | Permission |
|------------|-----|------------|
| Completion rates | Marketing materials (anonymized) | Tester consent |
| Tester testimonials | Social proof | Explicit consent (separate form) |
| Bug patterns | Engineering priorities | Internal only |
| Feature requests | Product roadmap | Internal only |
| NPS scores | Pitch deck (aggregated) | Anonymized |
