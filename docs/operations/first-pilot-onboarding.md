# First Pilot Onboarding — Practitioner Intake to Active Use
> Issue: #363
> Phase: Private Beta (First 1-3 Practitioners)

## Overview

The first 1-3 practitioner partners are Styx's most important early adopters. Their feedback shapes the product, their testimonials drive future B2B sales, and their client cohorts provide the behavioral data that proves the model. This doc covers the full onboarding process: intake call → account setup → configuration → training → feedback collection.

## Practitioner Selection Criteria

### Must-Have

- Licensed or certified practitioner (therapist, coach, recovery specialist)
- 5+ active clients willing to try a new accountability tool
- Comfortable with digital tools and app-based workflows
- Willing to provide weekly feedback (structured + unstructured)
- Can commit to 8-week pilot period

### Nice-to-Have

- Existing interest in behavioral economics or commitment devices
- Frustrated with current client follow-through methods
- Active social media presence (helps with recruitment)
- Previous experience with beta programs

### Qualification Call Checklist

- [ ] Verify credentials (license number, certification)
- [ ] Confirm client caseload size and demographic
- [ ] Assess comfort level with technology (1-5 scale)
- [ ] Explain pilot commitment (8 weeks, weekly feedback)
- [ ] Discuss moral alignment: financial stakes for behavior change
- [ ] Confirm HIPAA/compliance understanding (Styx stores no health data)
- [ ] Set expectations: bugs expected, features may change rapidly
- [ ] Answer: "Why do you want to be part of this?"
- [ ] Schedule onboarding call (if qualified)

## Intake Call

### Pre-Call

- Send calendar invite with video link
- Share one-pager (see docs/marketing/practitioner-outreach.md)
- Share Styx privacy white paper (one-page)
- Request: "Think of 2-3 clients who struggle with between-session follow-through"

### Call Agenda (30 minutes)

| Section | Time | Talking Points |
|---------|------|----------------|
| Introduction | 3 min | Founders intro, Styx mission, why we built it |
| Practitioner needs | 5 min | "What's your biggest challenge with client accountability?" |
| Problem validation | 2 min | "Does that sound right?" — confirm shared understanding |
| Solution walkthrough | 5 min | Contract lifecycle: oath → stake → proof → audit → outcome |
| Practitioner value | 3 min | Dashboard, analytics, contract templates, privacy firewall |
| Demo | 5 min | Create a contract together, show client view, show audit result |
| Pilot details | 3 min | Timeline (8 weeks), expectations, support, incentives |
| Q&A | 3 min | Address objections (see docs/marketing/practitioner-outreach.md) |
| Next steps | 1 min | "I'll send setup instructions. Let's schedule your onboaring call." |

### Post-Call

- Send thank-you email with:
  - Link to one-pager
  - Link to scheduling for setup call
  - Pilot agreement (DocuSign or equivalent)
- Add to pilot tracker (spreadsheet or CRM)
- Tag as "Intake Complete" in tracker

## Account Setup

### Practitioner Account Creation

| Step | Owner | Estimated Time |
|------|-------|----------------|
| Create Styx practitioner account | Founder | 5 min |
| Select tier (Solo beta = free, 10 clients) | Founder | 1 min |
| Set up dashboard preferences | Practitioner | 5 min |
| Configure contract templates | Practitioner + Founder | 15 min |
| Link Stripe Connect account (for future payouts) | Practitioner | 10 min |
| Invite first test client | Practitioner | 2 min |

### Practice Configuration

| Setting | Default | Notes |
|---------|---------|-------|
| Practitioner name/credentials | Required | Displayed to clients |
| Practice name | Required | For client-facing contract pages |
| Default contract fee | $39 | Can be overridden per contract |
| Default platform fee | $9 | Fixed during beta |
| Contract template presets | Recovery, Biological, Cognitive | Custom templates available |
| Notification preferences | Email + in-app | Daily digest or real-time |
| Client limit | 10 during beta (Free Solo tier) | Can request increase |

### Technical Setup

- [ ] Practitioner creates password (we send magic link for first login)
- [ ] Dashboard walkthrough (recorded Loom video sent after)
- [ ] Styx Connect account linked (practitioner Stripe account)
- [ ] Notification channel configured (email verified)
- [ ] Contract templates created or selected
- [ ] Test contract created with founder as "client"
- [ ] Test proof submitted and audited successfully

## Configuration

### Contract Template Configuration

Assist the practitioner in setting up 3-5 contract templates for their clients:

| Template Type | Example | Default Stake | Proof Type | Duration |
|---------------|---------|---------------|------------|----------|
| Recovery | "No contact with ex" | $39 | Screenshot (block confirmation) | 30 days |
| Biological | "Exercise 3x/week" | $39 | Gym check-in photo + timestamp | 7 days |
| Cognitive | "Read 20 min/day" | $29 | Screen time log + photo | 14 days |
| Custom | Practitioner's choice | Practitioner-set | Practitioner-defined | Variable |

### Dashboard Configuration

- [ ] Set notification preferences (email alerts for contract status changes)
- [ ] Configure reporting frequency (daily, weekly, or monthly digest)
- [ ] Set default contract duration for new templates
- [ ] Set client invitation method (email invite or direct link)
- [ ] Review privacy settings (what data is visible to practitioner vs. Styx)

## Training & Support

### Practitioner Training Materials

| Resource | Format | Delivery |
|----------|--------|----------|
| Dashboard walkthrough | Loom video (10 min) | Email after setup |
| Contract creation guide | Notion page | Email + dashboard help link |
| Client invitation guide | Notion page | Email + dashboard help link |
| Fury audit explanation | Loom video (5 min) | Email |
| Privacy & compliance FAQ | PDF | Email + dashboard help link |
| Troubleshooting guide | Notion page | Dashboard help link |

### Training Call (30 minutes)

| Section | Time | Content |
|---------|------|---------|
| Dashboard tour | 5 min | All screens, key actions |
| Create a contract | 5 min | Walk through template → customize → assign |
| Client experience | 5 min | Show client registration, stake, proof upload |
| Audit review | 3 min | Show audit results, discrepancy handling |
| Analytics | 3 min | Completion rates, client progress, trends |
| Edge cases | 5 min | What happens when: late submission, dispute, cancellation |
| Support channels | 2 min | Email, in-app chat, Slack (founder pager) |
| Q&A | 2 min | Open floor |

### Support Channels

| Channel | Response SLA | Best For |
|---------|--------------|----------|
| In-app chat (dashboard widget) | < 2 hours | Quick questions |
| Email (`practitioners@styx.app`) | < 4 hours | Detailed issues |
| Slack/Discord DM (founder) | < 1 hour (business hours) | Urgent issues during pilot |
| Phone (emergency only) | < 30 min | System down, data issues |

### First Week Support Cadence

| Day | Touchpoint | Owner |
|-----|------------|-------|
| 1 | Setup complete, training sent | Founder |
| 1 | Practitioner creates first test contract | Practitioner |
| 2 | Founder reviews test contract, provides feedback | Founder |
| 3 | Practitioner invites first real client | Practitioner |
| 4 | Check-in: "How's your first client's experience?" | Founder |
| 5 | Client submits first proof | Client |
| 6 | Audit completes, founder reviews result | Founder |
| 7 | First week check-in call (15 min) | Founder |

## Feedback Collection

### Structured Feedback (Weekly)

| Question | Format | Frequency |
|----------|--------|-----------|
| How many contracts did your clients create this week? | Number | Weekly |
| How many contracts did your clients complete? | Number | Weekly |
| On a scale of 1-10, how easy was contract creation? | Scale | Weekly |
| On a scale of 1-10, how useful is the dashboard? | Scale | Weekly |
| What was the biggest friction point this week? | Free text | Weekly |
| What feature would most improve your experience? | Free text | Weekly |
| Did any client express concern about the financial stakes? | Yes/No + details | Weekly |
| Would you recommend Styx to a colleague this week? | Yes/No + why | Weekly |

### Unstructured Feedback (Continuous)

- In-app feedback widget (always available)
- "Report a bug" button (dashboard header)
- Open Slack/Discord channel
- "Customer support" email alias
- Founder availability for ad-hoc calls

### Feedback Collection Channels

| Channel | Implementation | Priority for Response |
|---------|----------------|----------------------|
| In-app widget | Frontend component (Every screen) | Medium |
| Weekly survey | Typeform/Google Forms (automated email) | High |
| Slack/Discord | Direct message + shared channel | Urgent |
| Email | `feedback@styx.app` (dedicated alias) | Medium |
| Usage analytics | PostHog (product analytics) | Passive |
| Dashboard feedback | "Was this helpful?" micro-surveys | Low |

### Weekly Feedback Review

**Process:**

```
Day 1: Send automated weekly survey (Sunday evening)
Day 2: Practitioner completes survey (Monday)
Day 2: Founder reviews survey results (Monday PM)
Day 3: Founder follows up on any issues (Tuesday)
Day 3: Update product backlog with feedback items (Tuesday)
Day 4: Internal weekly sync — review all practitioner feedback (Wednesday)
Day 5: Send "This week's changes" update to practitioners (Thursday)
```

**Outputs:**
- Updated product backlog (prioritized by practitioner impact)
- Bug tickets for confirmed issues
- Feature requests with practitioner attribution
- "Wins" documented for future testimonials
- Churn risk assessment (practitioners showing low engagement)

## Pilot Completion & Evaluation

### Exit Criteria (8 Weeks)

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Practitioner active use | 6 of 8 weeks with active contracts | Dashboard activity log |
| Client contracts created | ≥ 10 per practitioner | Contract count |
| Contract completion rate | ≥ 55% | Completed / total contracts |
| Practitioner NPS | ≥ 40 | Weekly NPS question |
| Critical bugs reported | ≤ 3 | Bug tracker |
| Feature requests submitted | ≥ 5 per practitioner | Feedback forms |
| Willing to provide testimonial | Yes | Direct ask |

### Pilot Completion Call

| Section | Time | Content |
|---------|------|---------|
| Practitioner reflection | 5 min | "How was the experience overall?" |
| Metric review | 3 min | Share their completion rates, client outcomes |
| What worked | 5 min | Specific features, workflows they loved |
| What didn't work | 5 min | Pain points, abandoned workflows |
| Future commitment | 5 min | "Would you continue at $49/mo?" |
| Testimonial request | 3 min | "Would you be willing to..." (quote, case study, referral) |
| Referral request | 2 min | "Do you know 2 other practitioners who would benefit?" |
| Next steps | 2 min | Post-pilot transition plan |

### Pilot Outcomes

| Outcome | Action |
|---------|--------|
| Happy + willing to continue | Convert to paid Solo tier ($29/mo beta lock-in) |
| Happy + not willing to pay | Offer 3-month free extension + feedback retainer |
| Mixed — product gaps | Prioritize their feature requests, schedule 30-day re-check |
| Unhappy — product doesn't fit | Friendly offboarding, collect final feedback, learn from it |
| Unhappy — product bugs | Fix bugs urgently, offer apology + 1 month free extension |

## Pilot Tracker

### Fields

| Field | Example |
|-------|---------|
| Practitioner ID | P001 |
| Name | Dr. Jane Smith |
| Practice type | Licensed therapist (LCSW) |
| Specialty | Addiction recovery |
| Location | New York, NY |
| Intake call date | 2026-07-15 |
| Setup date | 2026-07-18 |
| Active clients | 7 |
| Total contracts created | 12 |
| Completion rate | 67% |
| Weekly NPS (avg) | 52 |
| Status | Active (week 4 of 8) |
| Churn risk | Low |
| Testimonial given | Pending |
| Notes | "Loves the Fury audit — clients find it motivating" |

### Tool

Simple spreadsheet (Google Sheets or Airtable) during beta. Migrate to CRM (HubSpot) at launch.
