# Reading Notes: Category 5 — Platform Economics & Two-Sided Markets

> **Dissertation sections:** §2.7, §5.2, §5.3
> **Research questions:** RQ2 (audit network design), RQ3 (HVCS framework)
> **Sources:** 7 entries (syllabus Cat. 5)
> **Date:** 2026-03-04

---

## Two-Sided Market Theory

### Rochet & Tirole (2003) — Platform Competition in Two-Sided Markets

**Key findings:**
- Two-sided platforms must solve the "chicken-and-egg" problem: both sides need each other
- Price structure (how fees are allocated between sides) matters more than price level
- Subsidize the more price-sensitive side; monetize the side with higher willingness-to-pay
- Network effects can be same-side (more users → more value to users) or cross-side (more sellers → more value to buyers)

**Styx application:**
- Two sides: oath-takers (demand) and Fury auditors (supply)
- Oath-takers pay stakes (their core commitment) — they are the monetized side
- Fury auditors earn bounties ($2.00/audit) — they are the subsidized side
- Cross-side network effects: more oath-takers → more audit work → more Fury income → more Furies join → better verification → more oath-takers trust the system
- Price structure: platform takes margin on failed stakes + audit fees from oath-taker side

**Dissertation use:**
- §2.7 framework for analyzing Styx as a two-sided market
- §5.3 comparison with other two-sided behavioral platforms (Beeminder uses one-sided model)

### Armstrong (2006) — Competition in Two-Sided Markets

**Key findings:**
- Three models: monopoly, competitive bottlenecks, two-sided singlehoming
- Competitive bottleneck: one side multi-homes, the other single-homes → platform has monopoly over single-homers
- "Divide and conquer": below-cost pricing to one side, recoup from the other

**Styx application:**
- Oath-takers are likely single-homing (committed to ONE platform's ecosystem for their behavioral contracts)
- Fury auditors could potentially multi-home (audit on multiple platforms)
- This makes Styx a natural competitive bottleneck with strong defensibility on the oath-taker side
- Implication: invest heavily in oath-taker experience; Fury supply follows demand

### Parker, Van Alstyne & Choudary (2016) — Platform Revolution

**Key findings:**
- "Interaction" as the fundamental unit of exchange on platforms
- Core interaction: the single most important exchange the platform enables
- Curation: platforms must manage interaction quality to prevent market failure
- Governance evolves: early centralized → later decentralized as trust accumulates

**Styx application:**
- Core interaction: oath-taker submits proof → Fury auditor evaluates → verdict rendered
- Curation: integrity score system + honeypot testing = quality management
- Governance trajectory: currently centralized (The Judge resolves disputes) → future decentralized (community governance)

---

## Commons & Governance

### Ostrom (1990) — Governing the Commons

**Key findings:**
- Eight design principles for enduring commons institutions:
  1. Clearly defined boundaries
  2. Proportional equivalence between benefits and costs
  3. Collective-choice arrangements
  4. Monitoring
  5. Graduated sanctions
  6. Conflict resolution mechanisms
  7. Minimal recognition of rights to organize
  8. Nested enterprises (for larger systems)

**Styx mapping:**

| Ostrom Principle | Styx Implementation |
|-----------------|-------------------|
| 1. Clear boundaries | Integrity tiers define participation rights |
| 2. Proportional costs/benefits | Higher stakes = higher potential returns; Fury bounty proportional to effort |
| 3. Collective choice | Currently centralized; future QV governance (§5.7) |
| 4. Monitoring | Fury network IS the monitoring system; honeypots verify monitors |
| 5. Graduated sanctions | Integrity score: minor infractions → score reduction; major fraud → RESTRICTED_MODE |
| 6. Conflict resolution | Dispute system: appeal → Judge review → UPHELD/OVERTURNED/ESCALATED |
| 7. Rights to organize | Fury can self-organize audit strategies (within rules) |
| 8. Nested enterprises | B2B HR tier nests within the main platform |

**Dissertation use:**
- §2.7 theoretical lens for analyzing Styx's governance design
- §5.3 evaluate Styx against Ostrom's 8 principles (currently satisfies ~6/8)
- Missing: collective choice (#3) and nested enterprises (#8) are future work

### Sundararajan (2016) — The Sharing Economy

**Key findings:**
- Crowd-based capitalism: distributed resource allocation via platforms
- Trust through reputation: star ratings, reviews, identity verification
- Regulatory challenges: existing frameworks don't fit new models
- Labor dynamics: gig workers face precarity, variable income, classification issues

**Styx application:**
- Fury auditors are gig workers in a behavioral verification marketplace
- Trust through reputation: integrity score + fury accuracy rating
- Regulatory challenge: Styx straddles gambling, fintech, health, and platform categories
- Labor concern: Fury $2.00/audit bounty must be sufficient to attract quality auditors

---

## Platform Governance & Content Moderation

### Gorwa (2019) — Platform Governance Triangle

**Key findings:**
- Three governance forces: state regulation, platform self-regulation, civil society pressure
- Platforms navigate between these forces dynamically
- "Governance gap": spaces where none of the three forces effectively regulate

**Styx application:**
- State: gambling law, fintech regulation, health data privacy
- Platform: Aegis protocol, integrity scoring, linguistic cloaking (self-regulation)
- Civil society: Fury community norms, Tavern social pressure, accountability partners
- Governance gap: the novel territory of "financially-staked behavioral contracts" is under-regulated

### Gorwa, Binns & Katzenbach (2020) — Algorithmic Content Moderation

**Key findings:**
- Automation challenges: context sensitivity, cultural variation, adversarial manipulation
- Human-in-the-loop: best results combine algorithmic screening with human review
- Transparency tension: transparent rules enable gaming; opaque rules reduce trust
- Scale problem: human review doesn't scale; algorithmic review misses nuance

**Styx application:**
- Fury network IS human-in-the-loop moderation (humans evaluate behavioral proof)
- Anomaly detection (pHash, EXIF) provides algorithmic pre-screening
- Honeypot system addresses adversarial manipulation of human reviewers
- Scale challenge: as oath volume grows, Fury supply must scale proportionally

---

## Synthesis for Dissertation

### Two-sided market model (§2.7):
- Styx is a two-sided platform connecting oath-takers (demand) and Fury auditors (supply)
- Competitive bottleneck structure: single-homing oath-takers, potentially multi-homing Furies
- Price structure: oath-takers pay stakes; Furies earn bounties; platform extracts margin from forfeited stakes

### Commons governance evaluation (§5.3):
- Styx satisfies 6 of 8 Ostrom principles in its current design
- Missing: collective choice (centralized governance) and nested enterprises (single-tier)
- Future work should address these gaps via community governance mechanisms

### HVCS connection:
- The HVCS model (from behavioral-physics-manifesto) maps institutional feedback failure → platform design
- Ostrom's commons framework provides the governance theory
- Two-sided market theory provides the economic model
- Together they explain HOW the HVCS cybernetic loops are implemented in a platform architecture
