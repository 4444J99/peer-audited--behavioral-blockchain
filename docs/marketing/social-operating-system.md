# Social Operating System — Channel Architecture & 30-Day Cadence
> Issue: #343
> Phase: Pre-launch / Content Engine Setup

## Overview

Styx social presence operates as a behavior-change education engine, not a product billboard. Every post drives one of three outcomes: (1) social proof that stakes-based accountability works, (2) behavioral science education that positions Styx as the authority, (3) community building that fills the beta waitlist. This doc defines the channel architecture, 30-day content cadence, and platform-specific playbooks.

## Channel Architecture

### Primary Channels

| Channel | Role | Target Audience | Post Frequency | Primary Format |
|---------|------|-----------------|----------------|----------------|
| Twitter/X | Thought leadership, real-time engagement | Biohackers, indie hackers, B2B buyers | 3-5 posts/day | Threads, quotes, polls |
| Reddit | Community education, organic acquisition | Recovery, ADHD, productivity segments | 2-3 posts/week | Self-posts, comments |
| LinkedIn | B2B practitioner pipeline | Therapists, coaches, HR/wellness buyers | 1 post/day | Long-form articles, case studies |

### Secondary Channels (Phase 2)

| Channel | Role | Launch Trigger |
|---------|------|---------------|
| YouTube | Educational deep-dives, demos | After 5 published case studies |
| Discord | Community hub, beta feedback | Private beta start (see docs/operations/support-channel-setup.md) |
| TikTok/Reels | Demo loops, user stories | After app store launch (#378) |

### Channel Strategy

#### Twitter/X

| Post Type | Frequency | Content | Goal |
|-----------|-----------|---------|------|
| Pillar posts | 3/week | Behavioral science insight, Styx philosophy, market critique | Authority building, shareable |
| Educational threads | 2/week | Deep dives (loss aversion, peer audit, escrow mechanics) | Credibility, save-for-later |
| Community engagement | Daily | Replies to relevant threads, quote-posting | Network growth, relationship |
| User stories | 1/week | Beta testimonials (anonymized, with consent) | Social proof |
| Behind-the-scenes | 1/week | Build progress, team photos, design decisions | Transparency, trust |

**Posting schedule:**

| Time | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|------|-----|-----|-----|-----|-----|-----|-----|
| 7am EST | Pillar | Thread | Pillar | Thread | Pillar | BTS | User story |
| 12pm EST | Engagement | Engagement | Engagement | Engagement | Engagement | — | — |
| 5pm EST | Poll/question | Quote | Hot take | Case snippet | Weekend thread | — | — |

#### Reddit

| Subreddit | Post Type | Frequency | Notes |
|-----------|-----------|-----------|-------|
| r/ExNoContact, r/breakups | Educational — "why no-contact works with stakes" | 1/week | Never direct pitch; frame as resource |
| r/ADHD, r/productivity | Discussion — "what's your accountability stack" | 1/week | Engage in comments organically |
| r/getdisciplined, r/DecidingToBeBetter | AMA / "I built a tool around loss aversion" | 1/bi-weekly | After social proof exists |
| r/startups, r/SideProject | Build-in-public | 1/month | Tech audience; recruit Fury auditors |

**Reddit golden rules:**
- 90% value, 10% mention
- Never link directly in first post (wait for someone to ask)
- Respond to every comment within 2 hours
- Flag posts with [Mod Post] flair when relevant

#### LinkedIn

| Post Type | Frequency | Target Audience |
|-----------|-----------|-----------------|
| Behavioral science long-form | 1/week | Practitioner decision-makers |
| Practitioner case study | 1/bi-weekly | Therapy/coach community |
| Industry critique | 1/month | HR/wellness buyers |
| Personal founder story | 1/month | General network |

**LinkedIn strategy:** Repurpose top-performing Twitter threads as long-form articles. Tag practitioners who engage. Build a "behavioral accountability" keyword presence.

## 30-Day Content Calendar

### Week 1: Foundation — "The Why"

| Day | Twitter/X | Reddit | LinkedIn |
|-----|-----------|--------|----------|
| Mon | Pillar: "Why 92% of resolutions fail" | r/getdisciplined: post the stat | "The $600B self-improvement market has a leak" |
| Tue | Thread: "Loss aversion coefficient λ=1.955 explained" | — | — |
| Wed | Pillar: "Three types of accountability" | r/ADHD: "What's your accountability stack" | — |
| Thu | Thread: "Why self-reporting fails" | — | — |
| Fri | Pillar: "Financial stakes vs. gamification" | — | "Willpower is not a character flaw" |
| Sat | BTS: Screenshot of the Fury audit queue | — | — |
| Sun | User story: "I bet $39 on my sobriety" | r/ExNoContact: share resource | — |

### Week 2: Education — "The How"

| Day | Twitter/X | Reddit | LinkedIn |
|-----|-----------|--------|----------|
| Mon | Pillar: "How peer audit changes incentives" | — | "Why I built a peer-audit network" |
| Tue | Thread: "Double-entry ledger for behavior" | r/productivity: "The commitment device explained" | — |
| Wed | Pillar: "Stripe FBO escrow — what it means" | — | — |
| Thu | Thread: "The Aegis Protocol explained" | — | — |
| Fri | Pillar: "Privacy firewall for B2B" | — | "What practitioners need in an accountability tool" |
| Sat | BTS: User flow walkthrough (video) | — | — |
| Sun | User story: "37-day streak" | r/DecidingToBeBetter: AMA prep | — |

### Week 3: Social Proof — "The Results"

| Day | Twitter/X | Reddit | LinkedIn |
|-----|-----------|--------|----------|
| Mon | Pillar: "Beta completion rate vs. industry" | — | "Styx beta: X% completion rate — how?" |
| Tue | Thread: "What users actually bet on" | r/biohackers: "Accountability for protocols" | — |
| Wed | Pillar: "Provider perspective — a therapist on Styx" | — | — |
| Thu | Thread: "Cost comparison: therapy vs. Styx" | — | — |
| Fri | Pillar: "The most common objection (and why it's wrong)" | — | "Behavioral economics in clinical practice" |
| Sat | BTS: Team on a whiteboard | — | — |
| Sun | User story: "From couch to gym in 14 days" | r/Fitness: "What would you bet on your workout?" | — |

### Week 4: Acquisition — "The Ask"

| Day | Twitter/X | Reddit | LinkedIn |
|-----|-----------|--------|----------|
| Mon | Pillar: "Open beta is here" | — | "Open beta announcement" |
| Tue | Thread: "Everything you need to know before joining" | r/startups: "We're opening our beta" | — |
| Wed | Pillar: "What's next — roadmap" | — | — |
| Thu | Thread: "How Fury auditors earn" | — | — |
| Fri | Pillar: "The future of accountability" | — | "Join the waitlist" |
| Sat | BTS: Launch checklist | — | — |
| Sun | User story + CTA | r/productivity: "Free beta access" | — |

## Content Drafting Guidelines

### Voice & Tone

- **Authoritative but accessible:** Cite research without being academic
- **Direct:** "You will fail without stakes" not "One might consider..."
- **Transparent:** Open about the model (real money, escrow, audit)
- **No hype:** Let the data and stories speak

### Pillar Post Structure

```
1. Hook (2 sentences) — Pain point or surprising stat
2. Problem (3-4 sentences) — Why current approaches fail
3. Solution (3-4 sentences) — How Styx addresses the gap
4. Evidence (2-3 sentences) — Data, research, beta results
5. CTA (1 sentence) — What to do next (read, share, join)
```

### Educational Thread Structure

```
1/ [Hook] The most important concept in behavioral change...
2/ [Define] Loss aversion means...
3/ [Evidence] Kahneman & Tversky found...
4/ [Apply] At Styx, this translates to...
5/ [Implication] What this means for your goals...
6/ [CTA] Want to try it? Join the beta at...
```

## Tools & Stack

| Tool | Purpose | Cost |
|------|---------|------|
| Typefully | Twitter/X scheduling + threads | Free tier |
| Buffer | LinkedIn scheduling | Free tier |
| Canva | Visual assets, infographics | Free tier |
| Grammarly | Copy editing | Free tier |
| Notion | Content calendar management | Free tier |
| Later | Instagram/TikTok scheduling (Phase 2) | Free tier |

## Metrics & Targets

| Metric | Week 1 Target | Month 1 Target | Month 3 Target |
|--------|--------------|----------------|----------------|
| Twitter followers | 100 | 500 | 2,000 |
| Avg. impressions/post | 500 | 2,000 | 5,000 |
| Engagement rate | 2% | 3% | 5% |
| Reddit sign-ups attributed | 10 | 50 | 200 |
| LinkedIn followers | 50 | 200 | 500 |
| Waitlist adds (all channels) | 50 | 250 | 1,000 |
| Content pieces published | 21 | 90 | 270 |

## Escalation Path

| Issue | Action |
|-------|--------|
| Negative comment / criticism | Acknowledge, agree if valid, explain reasoning. Never delete. |
| Gambling accusation | Reference the distinction: skill-based, peer-audited, escrow returns on success. |
| Competitor comparison | Accept comparison politely. List differentiators once. Don't argue. |
| Support complaint in public | "DM us — we'll make it right." Move to private. |
| Spam / hate speech | Report and block. Don't engage. |
