# Beta Feedback Synthesis -- Collection, Prioritization & Iteration
> Issue: #374
> Phase: Private Beta (Continuous)

## Overview

Beta feedback is the signal that guides product iteration. Without a disciplined synthesis process, feedback becomes noise: founders chase the loudest voice, critical patterns go unnoticed, and the product drifts from market need. This doc defines the collection methods, synthesis cadence, priority framework, iteration cycle (2-week sprints), and feedback-to-feature pipeline.

## Collection Methods

### Input Channels

| Channel | Data Type | Volume (est.) | Tool |
|---------|-----------|---------------|------|
| In-app feedback widget | Structured + free text | 5-10/day | Custom widget -> API -> database |
| Weekly survey | Structured (NPS + 3 questions) | 30-50/week (60% response rate) | Typeform / Google Forms |
| Discord #bugs | Unstructured bug reports | 3-8/day | Discord channel (manually logged) |
| Discord #feature-requests | Unstructured ideas | 2-5/day | Discord channel (manually logged) |
| Discord #general | Unstructured sentiment | 10-30/day | Passive monitoring |
| Support tickets | Structured issue reports | 2-5/day | Crisp / Intercom |
| 1:1 user calls | Deep qualitative feedback | 2-3/week | Notes -> database |
| Crash reports (Sentry) | Automated error data | Real-time | Sentry dashboard |
| Product analytics (PostHog) | Behavioral data (clicks, drop-offs) | Passive | PostHog dashboard |
| App store reviews (beta) | Public feedback | 0-2/week (infrequent) | App Store Connect / Play Console |

### In-App Feedback Widget Schema

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "bug | confusing | feature_idea | general",
  "message": "string",
  "url": "string (page where submitted)",
  "screenshot_url": "string (optional)",
  "device_info": {
    "platform": "ios | android | web",
    "os_version": "string",
    "app_version": "string"
  },
  "created_at": "timestamp"
}
```

### Weekly Survey Schema

```json
{
  "user_id": "uuid",
  "week_number": 1,
  "nps": 8,
  "contracts_created": 2,
  "contracts_completed": 1,
  "biggest_friction": "string",
  "almost_quit_reason": "string",
  "feature_most_wanted": "string",
  "support_resolved": true,
  "additional_feedback": "string"
}
```

## Synthesis Cadence

### Daily Triage (15 min)

| Time | Activity | Owner | Tool |
|------|----------|-------|------|
| 9:00 AM | Review new bug reports + crash alerts | Technical founder | Sentry + bug tracker |
| 9:15 AM | Tag by severity (P0-P4) | Technical founder | Bug tracker |
| 9:20 AM | Deploy fix for P0 bugs (if any) | Technical founder | GitHub |
| 9:30 AM | Review new feature requests | Non-technical founder | Feature tracker |
| 9:35 AM | Tag feature requests by theme | Non-technical founder | Feature tracker |

### Weekly Synthesis (1 hour)

| Day | Time | Activity | Owner | Output |
|-----|------|----------|-------|--------|
| Monday | 10:00 AM | Compile all feedback from last 7 days | Non-technical founder | Raw feedback dump |
| Monday | 10:30 AM | Categorize + tag each item | Both founders | Tagged feedback |
| Tuesday | 10:00 AM | Score by impact + effort (see below) | Both founders | Prioritized list |
| Tuesday | 10:30 AM | Select top 5 items for next sprint | Both founders | Sprint backlog |
| Wednesday | 10:00 AM | Update product roadmap + communicate | Non-technical founder | "What we're working on" post |
| Friday | 4:00 PM | Review sprint progress, adjust priorities | Both founders | Sprint status |

### Monthly Deep Dive (2 hours)

| Section | Time | Content |
|---------|------|---------|
| Quantitative review | 30 min | NPS trends, completion rates, churn rate, activation rate |
| Qualitative themes | 30 min | Top 5 friction themes, top 5 feature requests |
| Segment analysis | 20 min | How do recovery vs. ADHD vs. fitness users differ? |
| Practitioner feedback | 15 min | Practitioner-specific issues, B2B signals |
| Product roadmap update | 15 min | What stays, what changes, what drops |
| Strategy implications | 10 min | Is our product-market fit hypothesis holding? |

## Priority Framework

### The RICE Score

Each feedback item is scored on 4 dimensions:

| Dimension | Definition | Scale | Weight |
|-----------|------------|-------|--------|
| **Reach** | How many users experience this issue/request? | 1-10 | 2x |
| **Impact** | How much does this affect user satisfaction or retention? | 1-10 | 3x |
| **Confidence** | How sure are we that this is the right fix? | 1-10 (50% = 5, 90% = 9) | 1x |
| **Effort** | How much engineering time? (inverted: high effort = lower score) | 1-10 (2 days = 8, 2 weeks = 3) | 1x |

**Score = (Reach * 2 + Impact * 3 + Confidence + Effort) / 7**

### Scoring Examples

| Item | Reach | Impact | Confidence | Effort | RICE | Priority |
|------|-------|--------|------------|--------|------|----------|
| "Proof upload is confusing" | 7 | 8 | 9 | 8 (easy fix) | 8.0 | P0 |
| "Want Apple Health integration" | 3 | 5 | 4 | 2 (hard) | 3.7 | P3 |
| "Contract creation takes too long" | 6 | 7 | 8 | 6 (moderate) | 6.7 | P1 |
| "Fury audit too slow" | 5 | 9 | 7 | 4 (complex) | 6.4 | P1 |
| "Dark mode" | 8 | 3 | 6 | 5 | 5.1 | P2 |

### Priority Bands

| RICE Score | Priority | Action | Response Time |
|------------|----------|--------|---------------|
| 7.0 - 10.0 | P0 - Critical | This sprint | Immediate |
| 5.0 - 6.9 | P1 - High | Next sprint | < 2 weeks |
| 3.0 - 4.9 | P2 - Medium | Next 2-3 sprints | < 6 weeks |
| 1.0 - 2.9 | P3 - Low | Backlog | Indefinite |
| < 1.0 | P4 - Icebox | Archive | Will not do (revisit quarterly) |

### Signal vs. Noise Filter

Not every piece of feedback should be scored. Apply filters first:

| Filter | Action |
|--------|--------|
| Single user complaint, no repeat | Log but don't score. Revisit if 3+ users report similar. |
| Feature request from non-target segment | Log to separate "non-core" backlog. |
| Bug with clear workaround | Score but label "with workaround" -- deprioritize. |
| Feedback contradicts product vision | Score anyway. If it scores high, revisit vision. |
| Obvious troll / bad faith | Discard. |
| "It should be free" complaint | Log to "pricing feedback" bucket -- not a product feature. |

## Iteration Cycle (2-Week Sprints)

### Sprint Structure

| Week | Day | Activity |
|------|-----|----------|
| Week 1 | Monday | Sprint planning (select top 5 feedback items) |
| Week 1 | Tuesday-Thursday | Build fixes / features |
| Week 1 | Friday | Internal demo + deploy to beta |
| Week 2 | Monday | Feedback on changes from users |
| Week 2 | Tuesday | Bug fixes from new features |
| Week 2 | Wednesday | Hardening, edge cases, tests |
| Week 2 | Thursday | Weekly synthesis (previous week's feedback now has data) |
| Week 2 | Friday | Retrospective + next sprint planning |

### Sprint Output

Each sprint produces:

1. **Deploy to beta** (new build or web deploy)
2. **Changelog post** in Discord #announcements:
   - What's new
   - What's fixed
   - Known issues
   - What we're working on next
3. **Feedback summary** for internal use:
   - Items completed this sprint
   - Items that didn't make it (and why)
   - Top feedback items entering next sprint

### Sprint Velocity Targets

| Phase | Points/Sprint | Items/Sprint | Notes |
|-------|---------------|--------------|-------|
| Private beta | 20-30 | 4-6 | Founders only, full focus |
| Public beta | 30-40 | 5-8 | First hire helps |
| Launch | 40-50 | 6-10 | Full team |

## Feedback-to-Feature Pipeline

### Pipeline Stages

```
Feedback Received
    |
    v
[1] COLLECT     -> Raw input lands in database / tool
    |
    v
[2] TRIAGE      -> Daily: label, categorize, flag P0/P1
    |
    v
[3] SYNTHESIZE  -> Weekly: score by RICE, group by theme
    |
    v
[4] PRIORITIZE  -> Weekly: select top 5 for next sprint
    |
    v
[5] DESIGN      -> If needed: spec, mockup, user flow
    |
    v
[6] BUILD       -> Sprint: implement, test, deploy
    |
    v
[7] SHIP        -> Deploy to beta + changelog
    |
    v
[8] VERIFY      -> Monitor: did this fix the reported issue?
    |              Measure: did metrics improve?
    |              Listen: any new feedback about this change?
    |
    v
[9] CLOSE or ITERATE
    +-- If verified fixed, close ticket
    +-- If partially fixed, re-enter at step [3]
    +-- If not fixed, re-enter at step [6] or [5]
```

### Stage Owners

| Stage | Owner | Time Commitment |
|-------|-------|-----------------|
| Collect | Automated + both founders | Passive |
| Triage | Technical founder | 15 min/day |
| Synthesize | Non-technical founder | 2 hours/week |
| Prioritize | Both founders | 1 hour/week |
| Design | Technical founder | 2-4 hours/item |
| Build | Technical founder | 4-20 hours/item |
| Ship | Technical founder | 1 hour/sprint |
| Verify | Non-technical founder | Ongoing |

### Feedback Loop Closure

Every piece of feedback gets a response (not necessarily action):

| Feedback Outcome | User Communication |
|-----------------|-------------------|
| Bug fixed | "You reported [X] -- fixed in v1.2.3. Thanks for flagging!" (Discord mention) |
| Feature shipped | "You asked for [Y] -- it's live! Check it out." (Discord mention) |
| Under consideration | "Heard. We're exploring [Y]. Can you tell me more?" (Discord reply) |
| Won't do (clear reason) | "We decided not to do [Y] because [Z]. Here's our reasoning..." (Discord reply) |
| Not right now | "Good idea. We've added it to our backlog for future consideration." (Auto-reply) |

**Target: Every piece of feedback acknowledged within 48 hours.**

## Theme Tracking

### Theme Categories

| Category | Examples | Typical RICE |
|----------|----------|--------------|
| **Onboarding friction** | "Sign-up took too long", "I didn't understand staking" | High (7-9) |
| **Proof complexity** | "Uploading proof is annoying", "What counts as proof?" | High (6-8) |
| **Audit speed** | "Fury took 3 days", "I want my money back faster" | High (6-8) |
| **Notification issues** | "I didn't know my contract was due", "Too many emails" | Medium (5-7) |
| **Feature requests** | "I want Apple Watch integration", "Can I do group contracts?" | Variable |
| **Price sensitivity** | "$9 fee is too much", "Why do I pay even if I succeed?" | Medium (4-6) |
| **Trust & safety** | "Is my data safe?", "Can I trust the auditors?" | Medium (5-7) |
| **UI/UX polish** | "The button is hard to find", "Dark mode please" | Low (3-5) |

### Theme Trend Tracking

Each theme is tracked over time:

```
Theme: "Fury audit takes too long"
Week 1: 3 mentions, avg RICE 5.2 (P2)
Week 2: 8 mentions, avg RICE 6.8 (P1)  -> MOVED TO SPRINT
Week 3: 2 mentions, avg RICE 7.1 (P1)  -> Fix deployed
Week 4: 0 mentions                        -> Closed
```

### Theme Saturation Point

When a theme reaches 0 mentions for 2 consecutive weeks after a fix, mark it resolved and archive. If it re-emerges after a fix, the fix was incomplete -- re-open.

## Tools & Stack

| Tool | Purpose | Cost |
|------|---------|------|
| Linear | Bug + feature tracking | Free (up to 10 users) |
| Notion | Product roadmap, feedback synthesis | Free |
| Typeform | Weekly surveys | Free (up to 10 responses/mo -- upgrade if needed) |
| PostHog | Product analytics, session replays | Free (up to 1M events/mo) |
| Sentry | Error + crash tracking | Free (up to 5K events/mo) |
| Discord | Community feedback collection | Free |
| Google Sheets | Raw feedback dump + RICE scoring | Free |
| Slack (internal) | Founders-only discussion | Free |

## Feedback Synthesis Template

### Weekly Synthesis Document (Notion)

```
# Feedback Synthesis - Week [N] ([Date] - [Date])

## Summary
- Total feedback items: [number]
- Bugs: [number]
- Feature requests: [number]
- General feedback: [number]
- Top themes this week: [theme 1], [theme 2], [theme 3]

## Top 5 Items (RICE Scores)
1. [Item] - RICE [score] - [priority]
2. ...
3. ...
4. ...
5. ...

## Items Selected for Next Sprint
1. [Item] - RICE [score]
2. [Item] - RICE [score]
3. [Item] - RICE [score]
4. [Item] - RICE [score]
5. [Item] - RICE [score]

## Trends this Week
- [Theme] mentions: [count], trend: [up/down/flat] vs last week
- [Theme] mentions: [count], trend: [up/down/flat] vs last week

## Notable User Quotes
- "[Quote 1]" - User A
- "[Quote 2]" - User B

## Segment Watch
- Recovery users: [sentiment, key complaints, key praises]
- ADHD users: [sentiment, key complaints, key praises]
- Fitness users: [sentiment, key complaints, key praises]

## NPS (from weekly survey)
- This week: [score]
- Last week: [score]
- Trend: [up/down/flat]

## Action Items
- [ ] Follow up with [User] on their bug report
- [ ] Investigate [theme] more deeply
- [ ] Update roadmap with [decision]
```

## Cycle Time Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bug report to fix (P0) | < 4 hours | Linear issue tracking |
| Bug report to fix (P1) | < 1 week | Linear issue tracking |
| Feature request to decision | < 1 week (accept/reject/backlog) | Linear issue tracking |
| Feature request to ship (if accepted) | 1-4 sprints (2-8 weeks) | Linear + deployment tracking |
| Feedback acknowledgment | < 48 hours | Manual audit |
| Weekly survey to published synthesis | < 72 hours | Notion publish date |
| Sprint length | 2 weeks | Calendar |
| Code deploy to beta | Same day (P0) or next sprint | CI/CD pipeline |
