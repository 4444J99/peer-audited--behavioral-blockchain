# Audience Map — Early User Channels

**Issue:** #341 | **Lane:** `lane/expand-product`  
**Updated:** 2026-09-17

---

## Overview

This document maps the earliest addressable audiences for Styx, focusing on channels where:
1. The behavioral problem (failing at a commitment) is already being openly discussed
2. Loss aversion + accountability framing resonates naturally
3. We can reach users authentically without paid acquisition

The initial product is locked to **No-Contact Breakup Recovery** — this shapes everything below.

---

## Primary Segments

### Segment 1: Breakup Recovery (Core Launch Segment)

**Behavioral problem:** Post-breakup contact-breaking failure. The decision to go no-contact is made repeatedly, broken repeatedly, and the user knows it's self-destructive.

**Why Styx works here:** Pure loss aversion activation. The stake makes breaking contact financially costly *in the moment of temptation* — the only moment that matters.

**Estimated segment size:** 50M+ US adults experience significant breakup-related behavioral dysregulation annually (per academic literature cited in `styx-behavioral-economics-theory`).

---

### Segment 2: Sobriety / Addiction Recovery

**Behavioral problem:** Day-count streaks break; verbal commitments to sponsors erode; no-contact with substances mirrors no-contact breakup dynamic.

**Why Styx extends here:** Same contract structure. Different oath type. Existing recovery community infrastructure (12-step, SMART Recovery) creates natural peer audit network analogues.

**Note:** Requires legal counsel sign-off (#315) on skill-contest framing before public marketing in this segment.

---

### Segment 3: Fitness Accountability

**Behavioral problem:** Gym commitments fail at 3-week mark (January → February pattern). Verbal commitments to workout partners dissolve.

**Why Styx extends here:** Natural video proof (form-check videos), clear daily attestation cadence, existing influencer ecosystem in fitness accountability content.

---

## Channel Analysis

### Channel A: Reddit — r/ExNoContact (Priority: P0)

| Metric | Value |
|---|---|
| Subscribers | ~240K |
| Daily active posts | 200–400 |
| Avg post sentiment | High distress + help-seeking |
| Styx fit | ⭐⭐⭐⭐⭐ |

**Strategy:**
- No cold advertising — pure value-first content
- Founder posts authentic story posts: "I built a financial commitment device to help with my own breakup — here's how it works"
- Engage on "I keep breaking NC" posts with genuine Styx framing (not sales)
- Recruit 5 dogfood users from willing community members who post about repeated NC failure

**Tone:** Vulnerable, empirical, not evangelical. Loss aversion framing only after trust is established.

---

### Channel B: Reddit — r/NoFap + r/pornfree (Priority: P1)

| Metric | Value |
|---|---|
| Subscribers | 1.1M + 160K |
| Behavioral pattern | Streak-based, daily accountability, counter culture |
| Styx fit | ⭐⭐⭐⭐ |

**Strategy:**
- NoFap community already has accountability partner culture — Styx formalizes and financializes it
- Content angle: "financial commitment device" not "app" — matches community ethos of hard-mode challenges
- Recruit from users who explicitly seek accountability partners in the subreddit

---

### Channel C: TikTok — Behavioral Psychology Creator Ecosystem (Priority: P1)

| Target creator types | Follower range | Content angle |
|---|---|---|
| Breakup recovery coaches | 50K–500K | "The psychology of why you can't stop texting your ex" |
| Behavioral economics educators | 100K–1M | Loss aversion / Kahneman explainers |
| Accountability challenge creators | 50K–300K | 30-day challenge format |

**Strategy:**
- Direct outreach to 10 creators in each category with a free beta account
- Creator-led authentic reviews outperform brand content 10:1 in this segment
- Hook: "I found an app that makes you put money on the line for your goals"
- Goal: 2–3 organic creator posts before any paid amplification

---

### Channel D: Twitter/X — Accountability Thread Community (Priority: P2)

**Pattern:** "Post every day or delete your account" threads, public commitment devices, build-in-public accountability.

**Strategy:**
- Founder posts public commitment experiment with Styx (eating own dog food, publicly)
- "I staked $200 on 30 days of no-contact. Here's day 1." thread format
- Weekly update threads — authentic, not polished

---

### Channel E: Substack — Behavior Change Writers (Priority: P2)

| Target writers | Subscriber range | Topics |
|---|---|---|
| James Clear-adjacent writers | 10K–500K | Habit formation, commitment devices |
| Psychology-of-relationships writers | 5K–100K | Attachment theory, no-contact science |
| Personal finance behavior writers | 10K–200K | Financial psychology, behavioral nudges |

**Strategy:**
- Long-form pitch emails with genuine product story
- Offer: free beta access + early data on behavioral outcomes for their readers
- Goal: 1 feature article before public launch

---

## CAC Proxy by Channel

*Estimates based on comparable behavioral accountability products and community size:*

| Channel | Est. CAC (beta) | Scale ceiling | Priority |
|---|---|---|---|
| r/ExNoContact organic | $0–$5 | ~500 users | P0 |
| r/NoFap organic | $0–$5 | ~500 users | P1 |
| TikTok creator collab | $10–$30 | ~5,000 users | P1 |
| Twitter/X founder thread | $0–$2 | ~200 users | P2 |
| Substack feature | $5–$15 | ~2,000 users | P2 |

---

## Messaging Hierarchy

1. **Hook:** "What if breaking your commitment cost you money — every time?"
2. **Frame:** "Loss aversion is 2x more powerful than the pleasure of gain. We built a tool that activates it."
3. **Proof:** "Cryptographic verification + anonymous peer audit — not just a promise jar."
4. **CTA:** "Join the beta. Stake $25. See if you hold."

---

## Next Actions

- [ ] Founder creates r/ExNoContact throwaway for initial story post
- [ ] Identify 3 TikTok creators for outreach (use `packages/audience-engine` to build content plan)
- [ ] Draft Twitter/X commitment thread (30-day experiment format)
- [ ] Waitlist page live at `/beta` route in web app

*Evidence for triage: `docs/growth/audience-map.md:1`*
