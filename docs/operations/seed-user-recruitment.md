# Seed User Recruitment -- Creator Outreach & First Cohort Admissions
> Issue: #373
> Phase: Private Beta (Weeks 1-4)

## Overview

The first cohort of seed users defines Styx's initial product-market fit signal. These 50-100 users need to be high-intent, feedback-rich, and representative of target segments. This doc covers outreach templates, application process, cohort size targeting, admission criteria, and onboarding flow.

## Outreach Templates

### Template 1: Reddit Direct Message (Recovery Segment)

```
Subject: Saw your post about [topic]

Hey [username],

I saw your post in r/[subreddit] about [reference their post].

I'm building a tool that uses financial stakes and peer verification to help people follow through on goals -- especially the hard ones like no-contact, sobriety, or boundaries. The research is solid: loss aversion is roughly 2x more powerful than reward-seeking, and having an external auditor makes cheating nearly impossible.

We're looking for our first 50 beta users. Free contracts (test money, no real risk), and your feedback will shape the product.

Would you be interested in trying it? Happy to answer questions here or in DMs.

[Name]
Styx founder
```

### Template 2: Twitter/X DM (Productivity / ADHD)

```
Hey [@handle] -- big fan of your content on [topic].

I'm building a tool around something you've probably talked about: the gap between intention and action. It uses financial stakes (loss aversion at work) and peer auditing to make follow-through actually happen. Think Beeminder meets Stripe escrow.

Looking for first beta users who care about this problem. Would love to have you try it (free contracts, test money, 5 min setup). Your feedback would be incredibly valuable.

Interested?
```

### Template 3: Discord DM (Fitness / Biohacker)

```
Hey! Saw you in the [server name] server.

I'm working on a project that directly addresses [specific pain point]. It's a platform where you stake money on your goals and peer reviewers verify completion. If you complete the goal, money back. If not, it's forfeited.

I'm looking for 50 people to test the beta. You get free access, test money (no real risk), and direct line to the founders for feedback.

Want a beta invite?
```

### Template 4: Instagram DM (Recovery / Wellness)

```
Hey [@handle], love your content on [topic].

I'm building something I think your followers would be interested in. Styx -- a platform where you put money on the line for your goals and peer reviewers verify you actually did the work.

I'm looking for beta testers and would love your perspective. Would you be open to trying it out? Free, test money, no risk.

Let me know!
```

### Template 5: Warm Email (Professional Network)

```
Subject: Beta test for something I'm building

Hey [Name],

Hope you're doing well.

I'm building Styx -- a platform that uses financial stakes (loss aversion) and peer verification to make goal follow-through actually work.

I'm reaching out because I think you'd be great as an early beta tester. Specifically:
- [Reason 1: why they fit a segment]
- [Reason 2: their feedback would be valuable]

Beta is free (test money, no real risk), takes about 5 min to set up, and you'd have direct access to me for support.

Want in?

Best,
[Name]
```

### Template 6: Practitioner-Invited Client (Via Practitioner)

```
Subject: Your practitioner recommended you try Styx

Hi [Client Name],

Your practitioner, [Practitioner Name], thought you might benefit from Styx -- a tool that helps people follow through on their goals by putting a small financial stake on them.

Here's how it works:
1. You choose a goal related to your work with [Practitioner Name]
2. You stake $39 via Stripe (secure escrow)
3. You submit proof when you complete it
4. Peer reviewers verify your proof
5. Complete the goal, get your money back

Your practitioner sees only your completion status, not your proof or personal data.

[Beta Invite Link]

Questions? Reply to this email or talk to [Practitioner Name].

-- Styx Team
```

## Application Process

### Application Landing Page

**URL:** `styx.app/beta/apply`

**Page content:**

| Section | Content |
|---------|---------|
| Headline | "Be among the first 50 to try Styx" |
| Subhead | "The accountability platform where your money is on the line -- and peer reviewers keep you honest" |
| Value prop | "Free access during beta. Test money (no real risk). Shape the product." |
| Application form | (see below) |
| Social proof | "Built on behavioral economics (loss aversion lambda=1.955) and Stripe escrow" |
| FAQ | Quick answers: "Is this gambling?" "How does the escrow work?" "How long is the beta?" |

### Application Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| First name | Text | Yes | 2-50 chars |
| Email | Email | Yes | Valid format |
| Device | Dropdown: iOS / Android / Web only | Yes | -- |
| Goal category | Multi-select: Recovery, Fitness, Productivity, Cognitive, Biological, Creative, Professional | Yes | At least 1 |
| Experience with commitment devices | Radio: Never tried / Tried once or twice / Regular user / Expert | Yes | -- |
| Willingness to provide weekly feedback | Radio: Yes / No | Yes | Must be "Yes" to proceed |
| How did you hear about us? | Dropdown: Reddit / Twitter/X / Discord / Practitioner / Friend / Other | Yes | -- |
| Why do you want to join the beta? | Textarea | Yes | 50-500 chars |
| Discord username | Text | No | For support channel |
| Age verification | Checkbox: "I confirm I am 18 or older" | Yes | Must check |

### Application Review Funnel

```
Application submitted
    |
    v
Automated screening:
+-- Age 18+? -> No -> Reject
+-- Email valid? -> No -> Reject
+-- Feedback willing? -> No -> Reject (or move to waitlist)
    |
    v
Manual review (founders):
+-- Segment fit? -> Score 1-5
+-- Motivation strength? -> Score 1-5
+-- Device compatibility? -> Pass/Fail
+-- Written response quality? -> Score 1-3
    |
    v
Decision:
+-- Accepted -> Onboarding email (immediate)
+-- Waitlisted -> "You're on the list" email
+-- Rejected -> "Not right now" email (polite + reason)
```

### Application Scoring Matrix

| Criterion | Weight | 1 Point | 3 Points | 5 Points |
|-----------|--------|---------|----------|----------|
| Segment fit | 3x | Tonally off-topic | Relevant segment | High-need segment (recovery, ADHD) |
| Motivation | 2x | "Looks cool" | "I've tried [tool]" | "I need this because [specific pain]" |
| Written response | 1x | One sentence | Good effort | Detailed, insightful |
| Device match | Gate | Wrong platform | -- | Correct platform |
| Feedback commitment | Gate | "No" | -- | "Yes" |

### Application Processing SLA

| Volume | Processing Time | Method |
|--------|----------------|--------|
| < 10/day | Same day | Manual |
| 10-50/day | < 24 hours | Manual + automated sorting |
| 50+/day | < 48 hours | Automated scoring + manual spot-check |

## Cohort Size Targeting

### Beta Phases & Cohort Sizes

| Phase | Cohort Name | Size | Duration | Focus |
|-------|-------------|------|----------|-------|
| Private Beta A | Founders + Trusted | 10 | 2 weeks | Dogfood (see docs/operations/internal-dogfood-beta.md) |
| Private Beta B | Pioneers | 25 | 4 weeks | Core loop validation, iOS |
| Private Beta C | Early Adopters | 35 | 4 weeks | Cross-platform, feature coverage |
| Public Beta A | Growth Wave | 100 | 6 weeks | Scale, real money, marketing |
| Public Beta B | Expansion | 200+ | Ongoing | All segments, full feature set |

### Recruitment Pipeline

```
Phase         Target      Applications  Acceptance Rate
Pioneers      25          100           25%
Early          35          200           17.5%
Growth        100          500           20%
Expansion     200+         1000+         ~20%
```

### Capacity Considerations

| Resource | Max Supported | Bottleneck |
|----------|---------------|------------|
| Support (founder time) | 50 active users | < 50: founders can handle. 50+: need part-time support |
| Fury audit capacity | 100 active users (with 10 auditors) | < 100: founding team audits. 100+: need Fury recruitment |
| Server cost (Render) | 500 concurrent users | ~$0.50/user/month at Starter plan |
| Stripe test mode | Unlimited | No limit on test transactions |
| Feedback processing | 50 active users | Each user needs ~30 min/week attention |

**Decision:** Keep first 2 cohorts at 50 total users. This keeps support load manageable (founders only).

## Admission Criteria

### Must-Accept

| Criteria | Rationale |
|----------|-----------|
| Target segment (recovery, ADHD, productivity, fitness, cognitive) | Aligns with product focus |
| Strong written application ("I've tried X, Y, Z and nothing works") | High intent user |
| Willing to give weekly feedback | Critical for iteration |
| Compatible device | Must be able to test core loop |
| Age 18+ | Legal/compliance requirement |

### Bonus Criteria

| Criteria | Points |
|----------|--------|
| Previous commitment device user | +2 |
| Active on Reddit / Discord / Twitter | +1 |
| Practitioner referral | +3 |
| Willing to be interviewed for case study | +2 |
| Non-US user (helps test geofencing) | +1 |
| Has both iOS and Android devices | +1 |

### Waitlist Criteria

| Criteria | Action |
|----------|--------|
| Strong application but cohort full | Waitlist (promise: "next cohort in 2-4 weeks") |
| Weak application but correct segment | Waitlist (may mature with product) |
| Wrong device (Android expecting iOS first) | Waitlist (notify when Android build ready) |
| No feedback commitment | Waitlist (low-priority) |

### Rejection Criteria

| Criteria | Reason | Notification |
|----------|--------|--------------|
| Under 18 | Legal requirement | "Styx is for users 18+ due to financial escrow requirements" |
| Inappropriate application | Bad faith | Polite rejection, no detail |
| Duplicate application | Spam | Silent rejection |
| Obvious competitor | Business risk | "Not a fit right now" |

## Onboarding Flow

### Acceptance Email

```
Subject: You're in! Welcome to the Styx beta

Hi [Name],

You've been accepted into the Styx private beta. Welcome aboard.

Here's what to do next:

1. CREATE YOUR ACCOUNT
   Link: [magic link / invite link]
   (Use the email you applied with)

2. SET UP TEST PAYMENT
   Add test card: 4242 4242 4242 4242 (any future date, any CVC)
   This is test money -- no real charges.

3. CREATE YOUR FIRST CONTRACT
   Choose a goal you actually want to achieve.
   Stake $39 test money.
   Commit to a timeline (7-30 days).

4. JOIN OUR DISCORD
   [discord.styx.app/invite]
   This is where you'll get support, report bugs, and connect with other testers.

5. SUBMIT YOUR FIRST FEEDBACK (WEEK 1)
   [feedback form link]
   Due by end of your first week.

IMPORTANT: During the beta, contracts use TEST money. You won't lose real money if you fail, and you won't get real money if you succeed. Real money mode will come later.

Questions? Reply to this email or ping us on Discord.

Let's make some goals happen.

-- [Founder Name], Styx
```

### Onboarding Sequence (First 7 Days)

| Day | Touchpoint | Channel | Content |
|-----|------------|---------|---------|
| 1 | Welcome email | Email | Account setup, first contract creation |
| 1 | Discord invite | Email | Community onboarding |
| 2 | In-app guide | App | First-impression walkthrough (tooltip sequence) |
| 3 | Check-in DM | Discord | "How's your first contract going?" |
| 5 | Support reach-out | Discord/Email | "Need any help?" |
| 7 | Week 1 survey | Email | Structured feedback form |

### First Contract Guidance

Help users create a successful first contract:

```
Tips for your first contract:
1. Start small: 7 days, $39 stake
2. Choose something you're confident you'll do
3. Pick clear proof: "Photo of gym check-in" > "I exercised"
4. Set realistic duration: don't commit to 30 days on day 1
5. If you're nervous, start with just one contract
```

### Activation Milestones

| Milestone | Metric | Target | Intervention if Falling Short |
|-----------|--------|--------|-------------------------------|
| Account created | % of accepted users who create account | > 90% | Reminder email on day 2 |
| First contract created | % of account holders who create >= 1 contract | > 80% | Discord DM support |
| First proof submitted | % of contract creators who submit proof | > 75% | Proactive check-in |
| First audit completed | % of proof submitters with audit verdict | > 90% (expected) | System issue check |
| Week 1 survey submitted | % of active users | > 60% | Direct email request |

## Metrics & Tracking

### Recruitment Funnel

| Stage | Target (Cohort A) | Actual | Conversion Rate |
|-------|-------------------|--------|-----------------|
| Applications received | 100 | | -- |
| Qualified (passes screening) | 80 | | 80% |
| Accepted | 25 | | 31% |
| Onboarding email opened | 24 | | 96% |
| Account created | 22 | | 92% |
| First contract created | 18 | | 82% |
| Active at week 4 | 14 | | 78% (of contract creators) |

### Outreach Metrics

| Channel | Reach | Applications | Conversion | Quality (avg score) |
|---------|-------|--------------|------------|---------------------|
| Reddit DMs | 50 | 30 | 60% | 4.2 |
| Twitter/X DMs | 30 | 12 | 40% | 3.8 |
| Discord DMs | 20 | 14 | 70% | 4.5 |
| Reddit posts | 3 posts | 25 | N/A (organic) | 3.5 |
| Practitioner referral | 5 | 15 | N/A (per practitioner) | 4.8 |
| Warm email | 20 | 16 | 80% | 4.6 |

### Cohort Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg. contracts created/user/week | 1.5 | PostHog |
| Contract completion rate | > 55% | Internal |
| Weekly feedback submission rate | > 60% | Survey tool |
| NPS (weekly) | > 30 | Survey |
| Churn (users who stop logging in) | < 20%/month | PostHog |
| Bug reports/user | 2-5 in first 2 weeks | Bug tracker |
| Feature requests/user | 2-3 in first month | Feedback forms |
