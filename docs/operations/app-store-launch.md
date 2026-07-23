# App Store Launch Plan -- Pre-Launch, Launch Day & Post-Launch
> Issue: #378
> Phase: Launch (Weeks 21-30)

## Overview

App Store launch is Styx's public debut. Both Apple App Store and Google Play Store require careful preparation: the Linguistic Cloaker must pass review, screenshots must be compelling, and the launch day playbook must coordinate press, community, and support. This doc covers the full launch plan: pre-launch checklist (T-30), launch day playbook (T=0), post-launch monitoring (T+1 to T+14), press/PR coordination, and phased rollout strategy.

## Pre-Launch Checklist (T-30 Days)

### App Store Technical Setup

#### App Store Connect (iOS)

| Item | Owner | Done |
|------|-------|------|
| Apple Developer account active ($99/yr) | Technical founder | |
| App ID registered (com.styx.app) | Technical founder | |
| App record created in App Store Connect | Technical founder | |
| Bundle version matches current build | Technical founder | |
| Certificates + profiles generated | Technical founder | |
| Build uploaded via Xcode/CI | Technical founder | |
| TestFlight beta approved + active | Technical founder | |
| App privacy questionnaire completed | Both founders | |
| Export compliance: no encryption (exempt) or declared | Technical founder | |
| Demo account credentials for reviewer | Technical founder | |
| Review notes written (see below) | Technical founder | |
| App Store pricing + availability configured | Non-technical founder | |

#### Google Play Console (Android)

| Item | Owner | Done |
|------|-------|------|
| Google Play Developer account active ($25) | Technical founder | |
| App created (internal track -> closed -> production) | Technical founder | |
| App bundle (AAB) uploaded | Technical founder | |
| Content rating questionnaire completed | Technical founder | |
| Target API level (34) compliant | Technical founder | |
| Privacy policy linked | Both founders | |
| App pricing configured | Non-technical founder | |
| Closed beta track active (for staged rollout) | Technical founder | |

### App Store Listing Assets

#### Screenshots (Required)

| Device | Count | Resolution | Content |
|--------|-------|-----------|---------|
| iPhone 6.7" (primary) | 6 | 1290x2796 | Hero, Create Oath, Stake, Proof Upload, Fury Audit, Completion |
| iPhone 6.5" | 6 | 1242x2688 | Same content (re-rendered) |
| iPad (if supported) | 6 | 2048x2732 | Same content (re-rendered) |
| Android phone | 8 | Varies per device | Same content (re-rendered) |

**Screenshot content plan:**

| Screen # | Screen Name | Visual Focus | Caption |
|----------|-------------|--------------|---------|
| 1 | Hero | App logo + tagline + completion celebration | "Put your money where your goals are" |
| 2 | Create Oath | Goal creation form with category picker | "What will you commit to?" |
| 3 | Stake | $39 stake confirmation + escrow explanation | "Real stakes, real follow-through" |
| 4 | Proof Upload | Camera/gallery picker with example proof | "Show -- don't just tell" |
| 5 | Fury Audit | Audit in progress + verdict screen | "Peer-reviewed accountability" |
| 6 | Completion | Success screen + money returned + streak | "You did it. You get your money back." |

#### App Icon

| Format | Size | Status |
|--------|------|--------|
| iOS | 1024x1024 PNG (no transparency) | Needed |
| Android | 1024x1024 PNG + adaptive icon | Needed |

#### App Description (iOS)

**Name:** Styx: Goal Accountability
**Subtitle:** Put money on your goals
**Promotional text (what's new):** "Welcome to Styx! Create your first contract, stake real money, and prove you followed through. Peer-reviewed accountability that actually works."

**Description (4000 chars max):**

```
Styx is the accountability platform where real stakes meet peer-reviewed proof.

Unlike habit trackers or gamified apps, Styx uses behavioral economics (loss aversion coefficient = 1.955) and financial escrow to make goal follow-through automatic.

HOW IT WORKS:
1. CREATE AN OATH -- Choose your goal: fitness, recovery, learning, productivity, or creative.
2. STAKE REAL MONEY -- Your stake is held securely in Stripe escrow.
3. SUBMIT PROOF -- Photo, video, or screenshot showing you did the work.
4. PEER AUDIT -- Anonymous reviewers ("Furies") verify your proof.
5. GET PAID -- Complete the goal, get your money back. Fail, and it's forfeited.

WHY STYX WORKS:
- Loss aversion makes failure 2x more painful than success feels good
- Peer audit eliminates cheating -- Furies earn rewards for correct verdicts
- Double-entry ledger ensures every dollar is trackable
- Aegis Protocol provides health guardrails (no dangerous contracts)
- Your data stays private -- we never store health information

WHO IT'S FOR:
- Anyone who has tried and failed with willpower alone
- Recovery (no-contact, sobriety, boundaries)
- Fitness goals that need extra motivation
- Learning and productivity targets
- Biohackers and quantified-self enthusiasts
- Practitioners who want better client follow-through

WHAT USERS SAY:
"[Quote from beta tester]"

PRICING:
Download free. Create contracts from $39. Platform fee: $9 per contract.
Practitioner plans: $49-$999/month.

Note: Styx is not gambling. The outcome is controlled entirely by your behavior, not chance. Real-money contracts require identity verification for stakes above $100.

Terms of Service: [link]
Privacy Policy: [link]
```

#### App Description (Android)

Similar to iOS, adapted for Google Play's longer format (4000 chars).

#### Keywords (iOS, 100 chars)

`accountability,goal tracker,commitment contract,habit,stakes,peer review,fury,recovery,no contact,fitness,behavioral economics,loss aversion,escrow,streaks,self improvement,discipline`

### Linguistic Cloaker Validation

Before App Store submission, the Linguistic Cloaker must be verified across all user-facing text:

| Term | Cloaked Term | Location | Verified |
|------|-------------|----------|----------|
| bet | commitment | App copy, marketing | |
| wager | stake | Contract creation | |
| gamble | risk | FAQ, help | |
| betting pool | escrow pool | System messages | |
| odds | completion probability | Analytics | |
| payout | return | Completion screen | |
| loss | forfeit | Failure screen | |
| win | succeed | Completion modal | |
| lose | fail | Failure modal | |
| pot | stake pool | Fury system | |

**Validation script:** `bash scripts/validation/04-redacted-build-check.sh`

**Expected output:** Zero uncloaked gambling terminology in production build.

### Pre-Launch Marketing Assets

- [ ] Press kit live at styx.app/press (see docs/marketing/pr-strategy.md)
- [ ] Product Hunt listing drafted
- [ ] Hacker News post drafted (technical deep-dive)
- [ ] Reddit posts drafted (r/startups, r/productivity, r/getdisciplined)
- [ ] Social media posts scheduled (7 days of content)
- [ ] Email blast to beta users + waitlist drafted
- [ ] Blog post: "Why we built Styx" scheduled
- [ ] Demo video (30s) embedded on App Store listing
- [ ] Screenshots uploaded + approved by Apple/Google

### Legal & Compliance

- [ ] Terms of Service updated for public launch
- [ ] Privacy Policy updated for public launch
- [ ] Refund policy published
- [ ] EULA (if required by Apple) prepared
- [ ] COPPA compliance verified (not directed at children under 13)
- [ ] GDPR compliance (if serving EU users -- not initially)
- [ ] CCPA compliance (California users)
- [ ] Accessibility (WCAG 2.1) checked for critical flows
- [ ] Age rating questionnaire completed (17+ for financial/medical content)

## Launch Day Playbook (T=0)

### Timeline (All Times EST)

| Time | Action | Owner | Channel |
|------|--------|-------|---------|
| 12:01 AM | App goes live (Apple + Google approval pending but scheduled) | Technical founder | App Store + Play Store |
| 12:01 AM | Embargo lifts for press (press release distributed) | Non-technical founder | PRWeb / email |
| 6:00 AM | First social media posts go live | Non-technical founder | Twitter, LinkedIn |
| 7:00 AM | Product Hunt listing goes live | Non-technical founder | Product Hunt |
| 8:00 AM | Email sent to all beta users + waitlist | Non-technical founder | Email |
| 8:30 AM | Reddit post: I'm one of the co-founders of Styx... AMA | Technical founder | Reddit (r/startups) |
| 9:00 AM | Founder AMA on Product Hunt | Non-technical founder | Product Hunt |
| 10:00 AM | Monitor for press coverage (Tier 1 expected) | Both founders | All channels |
| 11:00 AM | Reddit post: r/productivity | Technical founder | Reddit |
| 12:00 PM | Mid-day metrics check | Technical founder | Internal |
| 1:00 PM | Hacker News post (if applicable) | Technical founder | HN |
| 2:00 PM | Community check-in on Discord | Non-technical founder | Discord |
| 3:00 PM | Social media engagement (reply to all comments) | Non-technical founder | Twitter, LinkedIn |
| 5:00 PM | Day 1 metrics snapshot | Technical founder | Internal |
| 6:00 PM | Evening social recap | Non-technical founder | Twitter |
| All day | Press inquiry handling (respond within 2 hours) | Both founders | Email + phone |

### Launch Day Roles

| Role | Person | Responsibilities |
|------|--------|-----------------|
| Command center | Non-technical founder | Social media, press, community, Product Hunt AMA |
| Engineering on-call | Technical founder | Monitor servers, fix critical bugs, deploy hotfixes |
| Support lead | Non-technical founder (secondary) or part-time hire | Answer support tickets, triage issues |
| Press contact | Non-technical founder | Journalist inquiries, interview scheduling |

### Launch Day Monitoring

**Check every 30 minutes:**

| What | How | OK / Not OK |
|------|-----|-------------|
| Server response time | Render dashboard + Sentry | < 500ms p95 |
| Error rate | Sentry | < 1% |
| Sign-up rate | PostHog | Trending up |
| Crash-free rate | Sentry | > 99.5% |
| Stripe API status | Stripe status page | Normal |
| App Store/Play Store status | Apple/Google dashboards | Approved, listed |
| Social mentions | Brand monitoring (manual) | Volume + sentiment |
| Support ticket queue | Crisp/Intercom | < 5 unacknowledged |

## Post-Launch Monitoring (T+1 to T+14)

### First 72 Hours

| Hour | Check | Action if Concern |
|------|-------|-------------------|
| +1h | Server load, crash rate | Scale infra, fix P0 crashes |
| +3h | App Store approval confirmed | Verify listing is searchable |
| +6h | First day sign-ups vs target | Adjust marketing spend/channel |
| +12h | First contract creation rate | Check onboarding funnel |
| +24h | Day 1 metrics review | Adjust day 2 plan |
| +48h | Day 2 metrics + trend vs day 1 | Iterate |
| +72h | Week 1 trend established | Plan week 2 marketing |

### Daily Cadence (T+1 to T+14)

| Time | Activity | Owner |
|------|----------|-------|
| 9:00 AM | Overnight metrics review | Technical founder |
| 9:30 AM | Bug triage (new reports overnight) | Technical founder |
| 10:00 AM | Press coverage roundup | Non-technical founder |
| 10:30 AM | Social media engagement (reply to all) | Non-technical founder |
| 11:00 AM | Support queue review | Non-technical founder |
| 12:00 PM | Mid-day checkpoint | Both founders |
| 3:00 PM | Second-wave social post | Non-technical founder |
| 4:00 PM | Support queue review | Non-technical founder |
| 5:00 PM | Day metrics snapshot | Technical founder |
| 6:00 PM | Evening social recap | Non-technical founder |

### Week 1 Metrics Review

| Metric | Target | Actual |
|--------|--------|--------|
| App Store downloads (iOS) | 500 | |
| Play Store installs (Android) | 300 | |
| Total sign-ups | 800 | |
| First contract created rate | > 60% | |
| Active daily users (week 1) | 200 | |
| App Store rating | > 4.0 | |
| Support tickets | < 50 | |
| Crash-free rate | > 99.5% | |
| Press articles | 5+ | |
| Product Hunt (upvotes) | Top 10 of day | |

### Post-Launch Week 2

- [ ] Tier 2 + Tier 3 press follow-up (outlets that didn't cover launch)
- [ ] App store ratings campaign: ask happy users to rate
- [ ] "What we learned from launch week" blog post
- [ ] Bug fix sprint (fix all P1/P2 bugs from launch)
- [ ] Onboarding flow optimization based on launch data
- [ ] Second-wave social media campaign
- [ ] Practitioner outreach acceleration

## Press/PR Coordination

### Launch Day Press

See docs/marketing/pr-strategy.md for full press plan.

**Day-of checklist:**

- [ ] Press release distributed (12:01 AM)
- [ ] Tier 1 journalist alert (pre-briefed, expected to publish)
- [ ] Monitor coverage (Google Alerts + manual)
- [ ] Share coverage on social media (tag the journalist)
- [ ] Update website with "As seen in..." logos

### Interview Requests

| Request Type | Response | Owner |
|--------------|----------|-------|
| Podcast interview | Accept (schedule within 2 weeks) | Non-technical founder |
| Written interview (email) | Respond within 24 hours | Non-technical founder |
| Live TV/radio | Accept if pre-recorded; caution on live | Both founders |
| Technical interview | Route to technical founder | Technical founder |
| Background briefing | Accept (off the record) | Non-technical founder |
| Controversy/crisis interview | Pause, prepare statement, then respond | Both founders + counsel |

### Press Inquiry Protocol

1. All press inquiries to `press@styx.app`
2. Respond within 2 hours on launch day
3. Prepare talking points before each interview
4. Never speculate -- "I'll need to check on that and get back to you"
5. Always mention: $39 stake, Stripe escrow, peer audit, loss aversion
6. After interview: send follow-up with links, assets, data

## Phased Rollout Strategy

### Phase 1: Soft Launch (Day 1-3)

| Setting | Value | Rationale |
|---------|-------|-----------|
| App Store availability | All countries | Maximize organic download |
| Marketing push | Low-key | Let organic discovery work first |
| Paid acquisition | $0 | Bootstrap mode |
| Beta user upgrade | Notified but optional | Existing users can stay in beta mode |
| Contract types | Recovery, Biological, Cognitive | Start with most proven categories |
| Maximum stake | $199 | Limit financial risk during soft launch |
| KYC threshold | $100+ stakes | Ensure compliance before scaling amounts |

### Phase 2: Scaled Launch (Day 4-14)

| Setting | Value | Rationale |
|---------|-------|-----------|
| Marketing push | Medium | Start social media campaign, content marketing |
| Paid acquisition | $0 (organic only) | Evaluate conversion before spending |
| Practitioner onboarding | Accelerate | Convert beta practitioners to paid |
| Contract types | Add Professional, Creative | Expand use cases |
| Maximum stake | $499 | Increase for verified users |
| Referral program | Active | Turn users into acquisition channel |

### Phase 3: Full Launch (Week 3+)

| Setting | Value | Rationale |
|---------|-------|-----------|
| Marketing push | Full | Content engine, community, partnerships |
| Paid acquisition | Evaluate | If unit economics work, start small budget |
| B2B sales motion | Active | Dedicated practitioner outreach |
| All contract types | 7 categories | Full product vision |
| Maximum stake | $2,000 | Premium contracts available |
| Enterprise tier | Active | B2B self-serve portal |

### Rollout Decision Gates

| Gate | Criteria | If Not Met |
|------|----------|------------|
| Gate 1: Day 3 | Crash-free > 99.5%, error rate < 1%, NPS > 30 | Pause Phase 2, fix stability |
| Gate 2: Day 7 | Sign-ups > 500, activation rate > 50%, App Store rating > 3.5 | Extend Phase 1, improve onboarding |
| Gate 3: Day 14 | Retention (week 1) > 40%, completion rate > 55%, support tickets manageable | Pause Phase 3, fix product |
| Gate 4: Week 4 | Revenue (if live money), NPS > 30, growth rate sustainable | Adjust strategy or timeline |

## Launch Risks & Contingencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App Store rejection (gambling) | Medium | Critical | Linguistic Cloaker validation; pre-submission review notes; legal opinion ready |
| Server overload from viral traffic | Low | High | Pre-scale to Pro tier at 300 users; monitoring + auto-alert |
| Negative press / gambling accusations | Medium | Medium | FAQ pre-drafted; crisis PR protocol; legal counsel on standby |
| Low conversion (download -> contract) | Medium | High | A/B test onboarding during soft launch |
| Competitor response (Beeminder/StickK) | Low | Low | Monitor; no direct response unless provoked |
| Stripe flags as high-risk post-launch | Low | Critical | Clean transaction history; compliance documentation; risk review prepared |
| Android fragmentation issues | Medium | Medium | Test on top 10 devices; crash reporting for quick detection |

## Post-Launch Retrospective (Week 4)

### Retro Agenda

| Section | Time | Content |
|---------|------|---------|
| Metrics review | 15 min | All launch metrics vs targets |
| What went well | 10 min | Wins, positive surprises |
| What went wrong | 15 min | Failures, close calls, missed targets |
| User feedback synthesis | 15 min | Top themes from launch users |
| Engineering retrospective | 15 min | Bugs, stability, infra performance |
| Marketing retrospective | 10 min | Channel performance, press ROI |
| Business impact | 10 min | Sign-ups, revenue, partnerships |
| Next phase priorities | 10 min | What to fix, what to build, what to double down on |

### Success Criteria

| Criterion | Target | Actual |
|-----------|--------|--------|
| Total users (month 1) | 1,000 | |
| B2B practitioners | 10 | |
| MRR from platform fees | $2,500 | |
| Contract completion rate | > 55% | |
| NPS | > 30 | |
| App Store rating | > 4.0 | |
| Press articles | 5+ | |
| Fury network size | 50+ auditors | |
| Support response time | < 4 hours | |
| Zero financial discrepancies | Pass | |
