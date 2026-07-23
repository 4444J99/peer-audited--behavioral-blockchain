# Open Beta Expansion -- Scaling to 500+ Users
> Issue: #376
> Phase: Public Beta (Weeks 9-20)

## Overview

Transitioning from private beta (50-100 users) to open beta (500+ users) changes the operational requirements significantly: infrastructure must scale, moderation becomes necessary, onboarding must be self-serve, community needs management, and metrics tracking must be systematic. This doc covers all aspects of the expansion.

## Scaling Infrastructure

### Current vs. Target Architecture

| Component | Private Beta (100 users) | Open Beta (500+ users) | Change Required |
|-----------|-------------------------|----------------------|-----------------|
| API (NestJS) | Render Starter ($7/mo) | Render Professional ($20/mo) | Scale up |
| Web (Next.js) | Render Starter ($7/mo) | Render Professional ($20/mo) | Scale up |
| PostgreSQL | Render Starter ($7/mo, 1GB) | Render Professional ($20/mo, 4GB) | Scale up |
| Redis | Render Free (25MB) | Render Starter ($7/mo, 250MB) | Scale up |
| CDN/WAF | Cloudflare Free | Cloudflare Pro ($20/mo) | Upgrade plan |
| File storage (R2) | Free tier (1GB) | Paid tier (~$0.015/GB) | Monitor usage |
| Email (Transactional) | Resend free (100/day) | Resend growth ($20/mo, 50K/mo) | Upgrade plan |
| Error tracking (Sentry) | Free (5K events/mo) | Team ($29/mo, 50K events/mo) | Upgrade plan |
| **Total monthly cost** | **~$21/mo** | **~$120/mo** | **5-6x increase** |

### Scaling Triggers

| Trigger | Action | Lead Time |
|---------|--------|-----------|
| API response time > 500ms p95 | Upgrade API to Professional | Same day |
| PostgreSQL CPU > 70% for 1 hour | Upgrade database | Same day |
| Redis memory > 80% | Upgrade Redis | Same day |
| Active users > 300 (buffer) | Pre-emptive upgrade | 1 week before |
| Sentry events > 80% of quota | Upgrade Sentry | 1 week before |
| Email volume > 80% of plan | Upgrade email service | 1 week before |

### Auto-Scaling (Render)

Render does not auto-scale. Manual upgrades:

| Action | Steps | Downtime |
|--------|-------|----------|
| Upgrade API plan | Render dashboard -> Service -> Settings -> Plan -> Save | < 1 min (restart) |
| Upgrade database | Render dashboard -> PostgreSQL -> Scale -> Plan | < 5 min (connection drain) |
| Upgrade Redis | Render dashboard -> Redis -> Scale -> Plan | < 1 min |

## Moderation

### Moderation Team

| Phase | Team Size | Composition |
|-------|-----------|-------------|
| Private beta | 1 (founder) | Founders only |
| Open beta start | 2 | Founder + 1 volunteer from community |
| Open beta steady | 3-4 | Founder + 2-3 community moderators |
| Post-launch | 5+ | Dedicated community manager + moderators |

### Moderator Recruitment

**Criteria:**
- Active community member for 2+ weeks
- Consistent positive contributions
- Level-headed under pressure
- No history of rule violations
- Willing to commit 2-3 hours/week

**Recruitment process:**
1. Identify candidates from active Discord members
2. Direct message: "We've noticed your positive contributions. Would you be interested in becoming a moderator?"
3. If yes: 30-min training call + shadow existing mods for 1 week
4. Then: grant mod role with limited permissions (mute, delete, warn)
5. After 2 weeks: grant full mod permissions if performing well

### Moderation Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| MEE6 | Auto-mod (spam, link filtering, profanity) | Configure keywords, spam thresholds |
| Wick | Moderation logging, auto-moderation | Set up ModMail for user reports |
| Carl-bot | Reaction roles, moderation commands | Configure mod commands (!warn, !mute, !kick) |
| ModMail | Private user-to-mod communication | Set up for confidential reports |

### Moderation Policy (Open Beta)

| Violation | First Offense | Second | Third |
|-----------|---------------|--------|-------|
| Spam / self-promotion | Warning + delete | 24h mute | 7-day mute |
| Harassment | Warning + delete | 24h mute | Ban |
| Gambling debate (bad faith) | Redirect to FAQ | 24h mute | 7-day mute |
| NSFW content | Delete + 24h mute | 7-day mute | Ban |
| Sharing others' contract data | Immediate 7-day mute | Ban | -- |
| Impersonation | Immediate ban | -- | -- |
| Doxxing | Immediate ban | -- | -- |

### Reporting Flow (Users)

```
User sees violation
    |
    v
1. Use @ModMail bot on Discord
2. OR DM any moderator
3. OR email abuse@styx.app
    |
    v
Moderator reviews:
+-- Clear violation -> Action (within 1 hour)
+-- Ambiguous -> Discuss in #mod-chat (2+ mods agree)
+-- False report -> "Thanks for flagging -- no action needed"
    |
    v
Action logged in #mod-log
```

## Onboarding at Scale

### Self-Serve Onboarding Flow

```
User signs up at styx.app
    |
    v
1. Email verification (automated)
    |
    v
2. Quick tutorial (3-step interactive guide)
    |  Step 1: "What's your goal?" (goal picker)
    |  Step 2: "How much do you want to stake?" (amount slider)
    |  Step 3: "Set your proof type" (photo, video, etc.)
    |
    v
3. Add payment method (Stripe)
    |  + Stripe test mode for free trial
    |  + Real card for live mode
    |
    v
4. Create first contract (guided template)
    |  Pre-filled: 7-day, $39, photo proof
    |  User can customize or accept defaults
    |
    v
5. Join Discord (optional but encouraged)
    |  Link sent in welcome email
    |
    v
6. First milestone: submit first proof
    |  Discord notification: "You're on your way!"
    |  Support available via help channel
```

### Onboarding Emails (Automated Sequence)

| Email | Delay | Content |
|-------|-------|---------|
| Welcome | Immediate | Account created, next steps, Discord link |
| First contract guide | 1 hour | How to create your first contract (step-by-step) |
| Progress check | 24 hours | "Did you create a contract?" (if not, encouragement + help) |
| First proof reminder | 3 days | "It's time to submit your first proof!" |
| Community invite | 5 days | "Meet other Styx users -- join our Discord" |
| Week 1 check-in | 7 days | Survey link + "How's it going?" |
| Inactive re-engagement | 14 days (if inactive) | "We miss you -- here's what's new" |

### Onboarding Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sign-up -> first contract created | > 60% | PostHog funnel |
| First contract -> first proof submitted | > 75% | PostHog funnel |
| First proof -> audit verdict received | > 90% | Internal metric |
| Time from sign-up to first contract | < 10 min | PostHog |
| Tutorial completion rate | > 80% | PostHog |
| Discord join rate | > 40% | Discord tracking |

### Support Scaling

| Volume | Support Method | SLA |
|--------|---------------|-----|
| < 10 tickets/day | Founders + in-app chat | < 4 hours |
| 10-30 tickets/day | Founders + part-time support hire | < 2 hours |
| 30-50 tickets/day | Part-time support + knowledge base | < 2 hours |
| 50+ tickets/day | Full-time support + dedicated escalation | < 1 hour |

**Knowledge base self-service target:** 40% of inquiries resolved via FAQ before ticket creation.

## Community Management

### Community Health Metrics

| Metric | Target | Frequency | Tool |
|--------|--------|-----------|------|
| Daily active users (Discord) | > 20% of total members | Daily | Discord analytics |
| Messages per day | > 100 | Daily | Discord analytics |
| Response time (support channel) | < 30 min | Live | Manual spot-check |
| Community NPS | > 30 | Monthly | Survey |
| Positive/negative sentiment ratio | > 5:1 | Weekly | Sentiment analysis (manual) |
| User-generated content (tips, stories) | > 10/week | Weekly | Channel audit |
| Flagged content rate | < 1% of messages | Weekly | Mod log |

### Community Rituals

| Ritual | Frequency | Format | Owner |
|--------|-----------|--------|-------|
| Weekly check-in thread | Weekly | Discord thread: "What's your goal this week?" | Moderator |
| Completion celebration | Per completion | Auto-post in #contract-showcase | Automated (bot) |
| Feature spotlight | Bi-weekly | Announcement + demo video | Founder |
| AMA with founders | Monthly | Live text AMA in #general | Both founders |
| User spotlight | Bi-weekly | Interview with active user | Non-technical founder |
| "What we shipped" post | Per sprint | Changelog in #announcements | Technical founder |
| Friday fun thread | Weekly | Off-topic in #off-topic | Moderator |

### Community Guidelines (Pinned in #welcome)

```
1. BE RESPECTFUL -- Disagree without being disagreeable.
2. NO SPAM -- Don't promote your project without asking first.
3. STAY ON TOPIC -- Support questions go in #getting-help.
4. BE HONEST -- Don't fake proof, don't game the system.
5. NO HARASSMENT -- This includes DMs. Report to mods.
6. NO NSFW -- Keep it work-safe.
7. SHARE YOUR WINS -- We celebrate completion. Post in #contract-showcase.
8. GIVE FEEDBACK -- It's why we're all here. Be specific, be kind.
9. NO FINANCIAL ADVICE -- Styx is a tool, not investment advice.
10. HAVE FUN -- Behavioral change is hard. We're in this together.
```

### Community Growth Targets

| Week | Discord Members | Daily Messages | Moderators Needed |
|------|----------------|----------------|-------------------|
| Week 1 (public beta) | 100 | 50 | 1 |
| Week 4 | 300 | 150 | 2 |
| Week 8 | 500 | 300 | 3 |
| Week 12 | 800 | 500 | 4 |
| Week 16 | 1200 | 750 | 5 |

## Metrics Tracking

### Core Metrics Dashboard

| Category | Metric | Tool | Frequency | Target |
|----------|--------|------|-----------|--------|
| **Acquisition** | New sign-ups | PostHog | Daily | 50+/week |
| **Acquisition** | Sign-up to first contract rate | PostHog | Daily | > 60% |
| **Activation** | First proof submission rate | PostHog | Daily | > 75% |
| **Activation** | Time to first proof | PostHog | Daily | < 3 days |
| **Engagement** | Weekly active users | PostHog | Daily | > 40% of enrolled |
| **Engagement** | Contracts created/user/week | PostHog | Weekly | > 1.0 |
| **Engagement** | Contracts completed/user/week | PostHog | Weekly | > 0.6 |
| **Retention** | Week 1 retention | PostHog | Weekly | > 60% |
| **Retention** | Week 4 retention | PostHog | Monthly | > 40% |
| **Revenue** | Total platform fees (when live) | Stripe + internal | Daily | $TBD |
| **Revenue** | Practitioner subscriptions | Stripe | Weekly | $TBD |
| **Quality** | Contract completion rate | Internal | Weekly | > 55% |
| **Quality** | Fury audit accuracy | Internal | Weekly | > 90% |
| **Quality** | Average audit turnaround | Internal | Daily | < 12 hours |
| **Health** | NPS (weekly survey) | Survey tool | Weekly | > 30 |
| **Health** | Support tickets/user/week | Support tool | Weekly | < 0.5 |
| **Health** | Crash-free session rate | Sentry | Daily | > 99.5% |

### Growth Accounting

```yaml
Total registered users: 500
  Active (weekly): 200 (40%)
    High engagement (>2 contracts/week): 80 (16%)
    Medium engagement (1-2 contracts/week): 70 (14%)
    Low engagement (<1 contract/week): 50 (10%)
  Churned (30+ days inactive): 100 (20%)
  Never activated (no contract created): 200 (40%)
    Still in onboarding flow: 50
    Dropped off: 150
```

### Weekly Growth Review

**Format:** 30-min internal meeting, Friday 3pm.

**Agenda:**

| Section | Time | Content |
|---------|------|---------|
| Acquisition | 5 min | Sign-ups, top channels, CAC (if paid) |
| Activation | 5 min | Funnel conversion rates, drop-off points |
| Retention | 5 min | Weekly cohorts, retention curves |
| Revenue | 5 min | MRR, ARPU, conversion rate (if live money) |
| Quality | 5 min | Completion rate, audit accuracy, support volume |
| Community | 3 min | Discord growth, engagement, moderation issues |
| Action items | 2 min | What to change, what to test next week |

## Scaling Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server overload during viral spike | Low | High | Pre-emptive upgrade at 300 users; monitoring alerts |
| Support overwhelmed | Medium | High | Recruit community moderators early; build FAQ first |
| Low activation rate at scale | Medium | High | A/B test onboarding flow before open beta starts |
| Moderation issues (toxic users) | Low | Medium | Establish clear policies + mod team before scaling |
| Stripe flags as high-risk | Low | Critical | Clean transaction history in private beta; compliance documentation ready |
| Fraud/sybil attack on referral program | Medium | Medium | Fraud detection rules; manual review threshold |
| Feedback quality drops with scale | High | Medium | Move from personal to survey-based feedback; sample size for qualitative |
| Community fragmentation (Discord vs. in-app) | Low | Low | Discord is primary; in-app for transactional only |

## Expansion Readiness Checklist

### Infrastructure

- [ ] API upgraded to Render Professional
- [ ] Web upgraded to Render Professional
- [ ] PostgreSQL upgraded to minimum 4GB
- [ ] Redis upgraded to minimum 250MB
- [ ] Cloudflare Pro activated if needed
- [ ] Sentry plan upgraded (if > 5K events/mo)
- [ ] Email service upgraded (if > 100 emails/day)
- [ ] R2 bucket monitoring configured
- [ ] Load testing performed at 500 concurrent users
- [ ] Database connection pooling verified (pgBouncer if needed)

### Onboarding

- [ ] Self-serve onboarding flow built + tested
- [ ] Automated email sequence configured
- [ ] Tutorial (interactive guide) built
- [ ] Knowledge base / FAQ published (40+ articles)
- [ ] First contract template optimized (fastest path to success)
- [ ] Payment method flow streamlined
- [ ] Discord auto-invite link in welcome email

### Community

- [ ] Discord server open to public
- [ ] Moderation team in place (2-3 mods)
- [ ] Moderation guidelines documented + pinned
- [ ] ModMail bot configured
- [ ] Auto-moderation (MEE6/Wick) configured
- [ ] Community rituals scheduled (weekly threads, etc.)
- [ ] #announcements channel ready

### Support

- [ ] Crisp/Intercom configured for in-app chat
- [ ] Canned responses created for top 20 issues
- [ ] SLA targets documented and shared (internal)
- [ ] Escalation path defined
- [ ] Support schedule: founder coverage 9am-9pm ET
- [ ] Emergency contact protocol documented

### Metrics

- [ ] PostHog tracking all core events
- [ ] Growth accounting dashboard built
- [ ] Weekly reporting template created
- [ ] Alert thresholds configured (server, crash, error)
- [ ] Survey tools ready (weekly + monthly)
- [ ] Funnel analysis configured (sign-up -> first completion)
