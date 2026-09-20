# Social Operating System Architecture

**Issue:** #343 | **Lane:** `lane/expand-product`  
**Updated:** 2026-09-17

---

## Concept: The Dual-Brand Architecture

Styx requires two distinct social presences that never collapse into each other:

| Brand | Name | Persona | Content |
|---|---|---|---|
| **Product Brand** | Styx | The commitment mechanism | Product updates, behavioral science, user stories |
| **Founder Brand** | [Founder Name] | The builder/researcher | Behind-the-scenes, theory, build-in-public, failure |

The product brand earns trust through **results and rigor**. The founder brand earns trust through **vulnerability and authenticity**. They reinforce each other without being identical.

---

## Platform Allocation

### Platform 1: Twitter/X — Founder Brand (Primary)

**Role:** Real-time distribution, founder narrative, academic signal  
**Voice:** Intellectual, direct, willing to be wrong in public  
**Content types:**
- Thread: 30-day commitment experiment (personal dogfood, public stakes)
- Thread: Behavioral economics explained for normies
- Single: "Day N of building a behavioral market" snapshots
- Reply: Engage behavioral psychology researchers and writers

**Cadence:** 3–5 posts/day, 1 long thread/week

**POSSE hook:** All Twitter content originates here, syndicates downstream

---

### Platform 2: TikTok — Product Brand (Distribution Engine)

**Role:** Top-of-funnel reach into breakup recovery + accountability audiences  
**Voice:** Relatable, slightly dark humor, honest about failure  
**Content types:**
- "Can you go 30 days without texting your ex?" hook videos
- Behavioral economics explainers (loss aversion, prospect theory visualized)
- "I staked $200 and here's what happened" narrative arcs
- Creator collabs (see [Audience Map](./audience-map.md))

**Cadence:** 3–5 videos/week during beta; 1/day at launch

---

### Platform 3: Reddit — Community Engagement (Trust Layer)

**Role:** Deep trust-building in highly relevant communities  
**Voice:** Genuine, vulnerable, non-promotional  
**Content types:**
- Founder story posts in r/ExNoContact, r/NoFap
- AMA-style Q&A after getting 10 real users
- Response engagement (not cold sales)

**Cadence:** 2–3 posts/week across communities during beta

---

### Platform 4: Substack — Authority Layer (Logos Integration)

**Role:** Long-form narrative, academic credibility, SEO surface  
**Voice:** Researcher-practitioner hybrid  
**Content types:**
- Essay: "Why financial stakes work when willpower doesn't" (links to `organvm-v-logos/essay-pipeline`)
- Essay: "The Fury Network — designing peer accountability at scale"
- Essay: "Behavioral physics: why λ=1.955 matters for your goals"

**Cadence:** 1 essay/2 weeks minimum

**ORGAN-III integration:** This channel feeds `essay_material` to `organvm-v-logos/essay-pipeline` per the AGENTS.md production graph.

---

## POSSE Pipeline Integration

Styx distributes through the `organvm-vii-kerygma/kerygma-pipeline` (POSSE = Publish on Own Site, Syndicate Everywhere).

```
[Original Content Created]
         │
         ▼
   [Styx Blog / Substack]  ← canonical source
         │
    ┌────┴──────────────┬────────────────┐
    ▼                   ▼                ▼
[Twitter/X]         [Reddit]         [TikTok caption]
```

All distribution events produce a `distribution_signal` → `organvm-vii-kerygma/kerygma-pipeline` per the production graph in AGENTS.md.

---

## 30-Day Content Calendar Framework

The `packages/audience-engine` can generate a personalized 30-day plan. Reference template: `packages/audience-engine/templates/styx-instance.yaml`.

**Week 1 — Foundation:** Founder story + problem framing  
**Week 2 — Evidence:** Behavioral economics theory + dogfood results  
**Week 3 — Social Proof:** First user stories (with permission) + practitioner signal  
**Week 4 — Invitation:** Beta signup CTA + waitlist conversion

---

## Community Signal Protocol

Any significant community milestone (first user completes 30-day contract, first practitioner signs on, first media mention) generates a `community_signal` → `organvm-vi-koinonia/community-hub`.

Milestone log: `docs/growth/community-milestones.md` (create when first milestone occurs)

---

## Metrics Framework

| Channel | Primary metric | Secondary metric | Review cadence |
|---|---|---|---|
| Twitter/X | Impressions/thread | Profile follows | Weekly |
| TikTok | Views/video | Profile follows | Weekly |
| Reddit | Post upvotes | DMs / beta signups | Per post |
| Substack | Opens | Paid conversions | Monthly |

**North star:** Beta waitlist signups per week (target: 50/week by Week 4)

---

## Brand Voice Guard Rails

> [!IMPORTANT]
> Never use the words `bet`, `gamble`, `wager`, or `stake` in the gambling sense in any public content. Gate 04 enforces this in code; the social OS must enforce it in copy. Use: `commitment`, `vault`, `behavioral contract`, `stake`.

**Never say:** "Win money by staying sober"  
**Say instead:** "Recover your stake by keeping your commitment"

---

*Evidence for triage: `docs/growth/social-os-architecture.md:1`*
