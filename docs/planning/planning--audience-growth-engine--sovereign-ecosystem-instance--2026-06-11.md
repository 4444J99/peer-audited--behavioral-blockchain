# Audience Growth Engine — Sovereign Ecosystem / Real Estate Luxury Instance

This is the worked instantiation of `docs/playbooks/playbook--audience-growth-engine.md`
for `organvm-iii-ergon/sovereign-ecosystem--real-estate-luxury`, the HNW real estate
marketplace with blockchain-verified provenance and AR visualization.

It is the **second portability proof** for the engine. Where Styx is consumer luxury
with a personal creator Host, and public-record-data-scrapper is B2B SaaS with a
branded expert Host, sovereign-ecosystem is **founder-operator / B2B-luxury** with a
_credibility-through-access_ Host voice.

The engine's three instantiations (Styx, public-record-data-scrapper, sovereign-ecosystem)
together exercise three of the three Host archetypes the playbook names in §1:
_personal creator_, _branded expert account_, and _founder-operator_. The instance
proves the engine is **type-covering**, not just shape-covering.

## Why this instance exists

The Styx instance proves the engine for personal-creator luxury. The
public-record-data-scrapper instance proves the engine for B2B data. This instance
proves the engine for the _third_ archetype the playbook names — the founder-operator
who sells **access, taste, and competence** rather than **intimacy (Jessica)** or
**authority (Filings Wire)**.

The honest friction surfaced: **sovereign-ecosystem is in the design phase.** It has a
React 19 + Vite + shadcn/ui codebase (per `application-pipeline/blocks/projects/sovereign-ecosystem-real-estate.md`),
141 files, ~38,000 LOC, but is not in production. The Host channel cannot be launched
before the system itself is promotion-ready. The L1-L5 attack is **planning**, and
Section H (Guardrails) and §D (Five-Level Attack) explicitly stage the _what's missing_
honestly.

## Goal hierarchy

1. **Build a "Sovereign Voice" public presence** — a founder-operator account that
   HNW agents, brokers, and buyers attribute the platform to. The voice is
   _credibility through access and taste_, not lifestyle bait.
2. **Convert that presence into a curated list of agents, brokers, and HNW buyers**
   — the _small_ high-value list is the asset (P4), not a mass audience.
3. **Open the founder-operator channel as the public face of a CANDIDATE-tier
   system** — meaning the channel launches _with_ the system's promotion
   (not before it), avoiding the trap of marketing a system that doesn't
   exist yet.

---

## A. The Five Parameters (Playbook §1)

- **P1 Host:** **Founder-operator** archetype. The persona is a _Sovereign Voice_ —
  the person building the platform, demonstrating taste, access, and competence
  in luxury real estate. Not anonymous (Filings Wire) and not a personal-creator
  lifestyle brand (Jessica). The Host has a name and a face, but the channel's
  content is _insider POV_, not personal narrative. This is the _founder-as-curator_
  model: the host demonstrates access by what they show, not by who they are.
- **P2 Wedge:** **Off-market luxury inventory in one segment + one geography** —
  the narrowest, highest-intent entry. Default segment: oceanfront/coastal
  luxury ($5M-$50M, US coastal). Default geography: California + Hamptons +
  Miami. A wider wedge (all luxury, all geographies) would dilute the access
  signal.
- **P3 Product:** The sovereign-ecosystem platform itself — agent dashboard,
  client feed, private vault. The CTA target: from "I read this analysis" to
  "I requested a private demo" within 30 days.
- **P4 Owned Asset:** A **curated list of agents, brokers, and HNW buyers**
  (the _small_ high-value list). The size is intentionally _small_ (50-200
  named individuals, not 50,000 followers). The asset is _who_ is on the
  list, not _how many_. This is the inverse of Styx's audience model: the
  asset is the _list_, not the _followers_.
- **P5 Proof Loop:** **A monthly "Sovereign Reveal" — a public listing or
  market analysis that the platform _would_ handle better** (deals, listings,
  comparables, AR visualizations). Each reveal is a _credibility artifact_:
  a luxury agent can repost the reveal, which attributes the platform, which
  pulls the next agent in. This is the founder-operator analog of the
  personal-creator milestone card and the B2B filings digest.

## B. The Ladder (Playbook §2)

- **Admission rule:** Requested introduction · verified HNW-agent or
  broker role · willingness to test the platform when it reaches BETA
  tier. The "cohort" is a _test cohort_ (15-30 agents), not a community.
  Same first-cohort size as Styx (15-30) and public-record-data-scrapper
  (30) by deliberate engine-shape consistency.
- **First cohort size:** 15-30 agents.
- **Weekly ritual:** A single weekly "Sovereign Brief" — a 3-5 minute
  audio + 1-page PDF on one off-market listing, one comparables analysis,
  or one AR visualization case study. Distributed via private Substack
  - agent-only RSS. This is the _single recurring reason to show up_.
- **Source mix:** Host's existing network (the founder's pre-platform
  relationships) · partner referrals (HNW-adjacent wealth managers,
  family offices) · L2 borrowed audience (luxury real estate creators,
  architecture/design publications).

## C. Dual-Channel Setup (Playbook §3)

- **"Sovereign Voice" (Host) channel:** _taste, access, and analysis_.
  Demonstrates the platform's POV without pitching the platform. Reads
  like an insider's note — a private banker or a top-tier agent
  speaking to peers. Does not become a listing aggregator. Does not
  lead with "blockchain" or "AI" jargon.
- **Product channel (dashboard + private vault):** _receipts, scope, and
  trust_ — what the platform is, what it is not, who it is for, with
  private-AR-visualization screen captures and proof-of-concept
  listings. Does not try to be the insider voice.
- **Ratios (tuned defaults):** Sovereign Voice 60% analysis / 30%
  access (off-market reveals, comp analyses) / 10% conversion · Product
  40% scope clarity / 30% trust/provenance / 20% proof / 10% conversion.
  The Host ratio skews _more analysis_ than Styx because the niche
  rewards _insight_, not _intimacy_.
- **Fixed CTA set (3 max — smaller than Styx's):**
  - Sovereign Voice: `Request a private demo` · `Subscribe to the Sovereign Brief` · `Apply to the test cohort`
  - Product: `See example visualization` · `Read the platform scope` · `Apply to the test cohort`

## D. Five-Level Attack (Playbook §4)

- **L1 Demand Capture — 10 high-intent phrases:** "off-market luxury
  listing", "private vault for deeds", "AR property measurement",
  "comparables analysis for $10M home", "luxury real estate
  blockchain", "HNW property due diligence", "sovereign wealth
  real estate", "luxury AR visualization", "real estate provenance
  verification", "off-market Hamptons listings". Capture page: a
  single-page `/sovereign-brief` route with the latest Sovereign
  Brief, an email capture, and a deferred "request a private
  demo" CTA.
- **L2 Borrowed Audience:** Luxury real estate creators
  (Compass, Sotheby's, Christie's agent-creators on Instagram
  and LinkedIn), architecture/design publications (Architectural
  Digest, Dwell, Wallpaper\*), wealth-management Substack
  creators. 20 named targets, outreach via
  `template--creator-outreach.md` adapted to luxury-professional
  voice (not consumer-creator voice).
- **L3 Intermediary Distribution:** Wealth managers, family offices,
  and private bankers as _referral infrastructure_ for their HNW
  clients (the luxury parallel of Styx's therapist-as-intermediary
  and public-record-data-scrapper's broker-as-channel). One-pager
  hook: "A private vault for HNW property holdings with
  AR-measured provenance. Demo by request."
- **L4 Community Loop:** The monthly "Sovereign Reveal" as the
  share-card moment. Referral mechanic: an agent who refers 3
  peers to the platform gets a permanent "Sovereign Contributor"
  credit on future reveals.
- **L5 Authority Layer:** Three cornerstone essays, _insider_ and
  _tactful_:
  1. **"What 'Off-Market' Actually Means in Luxury"** — a
     5,000-word analysis of the off-market luxury listing
     ecosystem, with worked examples from the platform's
     data (when it reaches BETA tier).
  2. **"The AR Visualization Tipping Point"** — a piece on
     how AR-measured room templates change the buyer decision
     for $5M+ properties, drawn from the platform's BETA
     data.
  3. **"Provenance as a Luxury Feature"** — a piece on
     blockchain-verified property provenance and the HNW
     buyer's due-diligence stack.
- **Do-not-say-yet list (niche-specific):** no "blockchain" or
  "Web3" lead (lead with the HNW benefit, not the tech), no
  "AI-powered" hype, no "all luxury geographies" (start narrow
  — coastal US), no mass-market language ("buyers", "sellers"
  — say "agents" and "principals"), no "as seen on TV"
  before any press. Lead with taste; lead with access.

## E. Audience-as-Product (Playbook §5)

- **Rungs on/off and order:** Free follow (Sovereign Brief
  reader) → email subscriber (Sovereign Brief full access) →
  test-cohort application (15-30 agents) → private demo
  request → paid enterprise tier (multi-agent brokerage
  licenses). No sponsorship rung; the audience is too
  high-value for sponsorship reads.
- **Where the Product sits relative to the rungs:** Product
  _is_ the third rung. The Sovereign Brief is the funnel
  into the test cohort; the test cohort is the funnel into
  paid enterprise. This is the founder-operator analog of
  public-record-data-scrapper's product-is-asset inversion
  (the platform is the asset, not the audience).
- **Coexistence rule check:** The Sovereign Brief does not
  pitch the platform's paid tier. The paid tier's marketing
  does not pitch the Sovereign Brief. Each rung is honest
  about its own value. (This is the parallel of Styx's
  rule that the audience doesn't become a product brochure.)

## F. Engagement Economics (Playbook §6)

- **Rate / weekly hours:** 4 hours/week, founder's time
  only (this is a founder-build, not a co-founder build —
  the engine accommodates both).
- **In-scope deliverables:** Weekly Sovereign Brief · 1
  cornerstone essay per quarter · monthly Sovereign Reveal
  · 5 L2 outreach touches per week. **Out of scope:**
  paid acquisition, conference booths, broker-relationship
  management beyond referrals.
- **ROI statement for payer (here: the system itself):**
  Asset growth = list size + Sovereign Brief subscribers
  - monthly reveal reads. Product pipeline = test-cohort
    applications → private demo requests → paid enterprise
    tier. Reusable system = the L1-L5 attack and the 3
    cornerstone essays are reusable for any ORGAN-III
    luxury venture (real estate, hospitality, art market).
- **Paid-build vs equity boundary:** Not applicable in
  the co-founder sense. (The founder is also the operator
  here, so the engagement-economics section is a
  _founder-time_ statement, not a _co-founder-split_
  statement.)

## G. Metrics (Playbook §7)

- **6-10 KPIs + weekly targets:**
  1. Curated list size (target: +5/week, target ~200)
  2. Sovereign Brief subscribers (target: +10/week)
  3. Sovereign Brief open rate (target: >60% — HNW
     audiences open at higher rates than consumer lists)
  4. Test-cohort applications (target: +2/week)
  5. Private demo requests (target: +1/week, long-cycle)
  6. Paid enterprise tier conversions (target: 1/quarter,
     very long-cycle)
  7. L1 capture-page → email conversion (target: >15%
     — HNW audience converts higher on taste-led CTAs)
  8. L2 outreach → reply rate (target: >20% — luxury
     creators reply less but at higher quality)
  9. Cornerstone essay 30-day reads (target: >5,000
     unique — HNW audience has lower volume but higher
     quality)
  10. Monthly Sovereign Reveal citations (target:
      ≥ 5/month — the B2B-luxury "social proof" metric)
- **Health bands source:** ORGAN-III Commerce REGE (when
  it exists) or the cross-organ GRO REGE at
  `docs/departments/gro/REGE.md` §9.

## H. Guardrails (Playbook §9)

- **Inherited from:** ORGAN-III Commerce growth organism.
  Falls back to cross-organ GRO REGE.
- **Niche sensitivity rule:** **HNW privacy is the
  non-negotiable.** No public-facing reveal of a specific
  property without owner consent. No public-facing
  visualization of a specific property without
  brokerage consent. No "look at this $40M listing"
  without proof of consent. Provenance-first, taste-led,
  privacy-respecting. The off-market inventory that is
  the wedge _depends_ on this rule.
- **Honest disclosure:** This system is CANDIDATE-tier in
  promotion state (per `application-pipeline/blocks/projects/sovereign-ecosystem-real-estate.md`).
  The Host channel cannot be launched before the system
  reaches PRODUCTION. The L1-L5 attack above is
  **planning**; section "30/60/90" below sequences the
  actual launch _with_ the system's promotion.

---

## 30 / 60 / 90 Roadmap

- **Days 0–30 — Foundations (pre-launch):** System
  promotion to PRODUCTION tier. Stand up the Sovereign
  Brief (private Substack, 3-5 min audio + 1-page PDF,
  weekly cadence, gated). Build the L1 capture page.
  Identify the 20 L2 outreach targets (luxury creators,
  architecture press, wealth managers). Build the curated
  list (50 named agents/brokers from the founder's
  pre-existing network). _Do not_ launch the Sovereign
  Voice channel publicly until the platform reaches BETA
  tier.
- **Days 31–60 — First 15 test-cohort applications:**
  Open the test-cohort application. Begin L2 outreach
  (5/week). Begin L3 intermediary outreach to wealth
  managers. Ship the first 2 cornerstone essays. Target:
  15+ test-cohort applications, 5 private demo requests,
  100+ Sovereign Brief subscribers.
- **Days 61–90 — Compounding:** First Sovereign Reveal
  (with explicit owner/brokerage consent). First paid
  enterprise tier inquiry. Refine the Sovereign Brief
  based on open-rate data. Target: 1 paid enterprise
  tier conversion, 1 Sovereign Reveal with 5+ citations,
  1 cornerstone essay with >5,000 reads.

## Engine-portability verdict

Comparing all three live instances:

| Dimension                  | Styx                                 | public-record-data-scrapper | sovereign-ecosystem              | Same engine?                                             |
| -------------------------- | ------------------------------------ | --------------------------- | -------------------------------- | -------------------------------------------------------- |
| Host archetype             | personal creator                     | branded expert              | founder-operator                 | No (3 different archetypes, same engine)                 |
| Wedge                      | emotional/consumer (no-contact)      | professional/B2B (UCC-1)    | professional/luxury (off-market) | No (3 different wedges, same shape)                      |
| Product                    | mobile app                           | CLI + dashboard             | platform (3-pane SPA)            | No (3 different products, same funnel role)              |
| Owned asset                | email list (mass)                    | GitHub stars + email (B2B)  | curated list (small, high-value) | No — _3 different asset models_                          |
| Proof loop                 | shareable milestone cards            | weekly data digest          | monthly reveal                   | No — _3 different proofs_                                |
| Five levels (L1-L5)        | all five used                        | all five used               | all five used                    | **Yes**                                                  |
| Dual channel               | yes                                  | yes                         | yes                              | **Yes**                                                  |
| Ladder (borrowed → cohort) | yes (community cohort)               | yes (user cohort)           | yes (test cohort)                | **Yes** — _cohort is a parameter, not a fixed community_ |
| Audience-as-product        | audience IS asset                    | product IS asset            | product IS asset                 | No — _two inversions_                                    |
| Engagement economics       | co-founder, $100/hr, equity boundary | solo, no co-founder         | founder-operator, 4h/week        | No — _3 different models_                                |
| Niche sensitivity          | emotional vulnerability              | regulator scrutiny          | HNW privacy                      | Different rules, same need                               |

**Verdict:** The engine is type-covering. All three Host archetypes from Playbook §1
(personal creator, branded expert account, founder-operator) have been exercised in
real instantiations. Five dimensions (Five Levels, Dual Channel, Ladder, guardrails,
content-mix ratios) are mechanically identical. The other five change _type_ with
every instantiation but preserve _function_. The Audience-as-Product section shows
two honest _inversions_ (public-record-data-scrapper and sovereign-ecosystem both
treat the product as the asset), confirming the audience-as-product model is a
_rung-order_ parameter, not a fixed pattern.

**Changes required to the playbook:** None. The three instantiations together
reveal no required change to `playbook--audience-growth-engine.md` — every section
ran as-is across all three with different parameters. The cross-instance
comparison table above is a _useful artifact_ that may be worth adding to the
playbook as a §10 or appendix, but it is not a _required change_.

## Derived assets (this instance's outputs)

| Asset                         | File                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| 30-day content calendar       | `planning--sovereign-ecosystem-30-day-content-calendar--2026-06-11.md` |
| Content asset pack            | `planning--sovereign-ecosystem-content-asset-pack--2026-06-11.md`      |
| Metrics tracker               | `planning--sovereign-ecosystem-metrics-tracker--2026-06-11.md`         |
| Creator/intermediary outreach | `planning--sovereign-ecosystem-creator-outreach--2026-06-11.md`        |

## Linked

- Engine: `docs/playbooks/playbook--audience-growth-engine.md` §0
- Sibling instance: `docs/planning/planning--audience-growth-engine--styx-instance--2026-06-01.md`
- Sibling instance: `docs/planning/planning--audience-growth-engine--public-record-data-scrapper-instance--2026-06-11.md`
- Sibling issue: #680 (this instance)
- Engine merged in: PR #668
