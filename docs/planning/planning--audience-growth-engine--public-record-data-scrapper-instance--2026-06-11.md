# Audience Growth Engine — Public Record Data Scrapper Instance

This is the worked instantiation of `docs/playbooks/playbook--audience-growth-engine.md` for
`organvm-iii-ergon/public-record-data-scrapper`, the system's B2B data platform that turns
50-state public-record scraping into prioritized MCA-industry leads.

It is the **portability proof** for a non-Styx system: where Styx is consumer luxury with a
personal creator (Jessica) as Host, public-record-data-scrapper is B2B SaaS with no consumer
audience, no lifestyle brand, and no Jessica figure. The engine's _shape_ is the same;
every _parameter_ is different. This instance shows that the engine is genuinely
parameterized, not a one-off.

## Why this instance exists

The Styx/Jessica live instance proves the engine _runs_ for a personal-creator luxury
system. The public-record-data-scrapper instance proves the engine is _portable_ — that a
B2B data tool with no public social presence can run the same five-parameter architecture
without distorting it.

The honest friction surfaced by this instantiation: **public-record-data-scrapper has no
public social channel today.** It has a product (a React dashboard), a CLI, a GitHub
repo, and a deployed Vercel site. It does not have an audience. That is the gap the engine
exists to close. Section H (Guardrails) and §D's L1-L5 levels reveal _what's missing_, not
just _what's planned_.

## Goal hierarchy

1. **Build a "research desk" public presence** — a recognizable branded account that MCA
   practitioners (brokers, ISO agents, capital providers) attribute the tool to, the way
   a Bloomberg terminal is attributable to Bloomberg.
2. **Convert that presence into a self-serve funnel** — GitHub stars → `npm install` →
   dashboard trial → paid API tier.
3. **Build a repeatable system** — the L1-L5 attack is reusable for any future B2B data
   venture in the same organ (ORGAN-III Commerce).

---

## A. The Five Parameters (Playbook §1)

- **P1 Host:** **Branded expert account** archetype. The persona is a "public records
  research desk" — anonymous in identity, authoritative in voice. _No named person._ This
  is a deliberate contrast to Styx's Jessica figure. Where Styx sells _intimacy and
  parasocial trust_, public-record-data-scrapper sells _competence and provenance_.
  Name candidate: "The UCC Desk" or "Filings Wire" (treat as placeholder, not commit).
- **P2 Wedge:** **UCC-1 filing monitoring for active financing signals.** The narrowest,
  highest-intent entry: a UCC-1 just got filed → the debtor is raising capital → reach
  out within 14 days. This is the live moment an MCA broker acts on. (Wider wedges —
  "all public records" or "all 50 states" — are too broad; the engine refuses to run on
  a wedge that cannot be stated in one sentence.)
- **P3 Product:** The public-record-data-scrapper dashboard + CLI + REST API. Conversion
  target: from "I read this analysis" to "I installed the CLI / opened a dashboard
  account" within 7 days.
- **P4 Owned Asset:** The **GitHub star list** (organvm-iii-ergon/public-record-data-scrapper)
  - the **email list of broker trial users** + the **package download telemetry** (npm
    `npm install public-record-data-scrapper` events). The GitHub star list is the B2B
    analog of the consumer email list — it is the asset that survives a platform ban.
- **P5 Proof Loop:** **A weekly "Filings of the Week" digest** — 5-10 high-priority UCC-1
  filings pulled from the live data, scored and graded, published as a public artifact
  with provenance. Each digest is a shareable proof moment: a broker can repost the
  digest, which attributes the tool, which pulls the next broker in. This is the
  B2B analog of Styx's no-contact milestone cards.

## B. The Ladder (Playbook §2)

- **Admission rule:** GitHub star · email opt-in via the digest · first successful
  CLI/dashboard run. The "cohort" here is a _user cohort_, not a _community cohort_ —
  B2B audiences do not need a ritual room, they need a working tool and a reason to
  come back. The admission rule is therefore tighter than Styx's: we measure _active
  use_, not _community membership_.
- **First cohort size:** 30 (number is the same as Styx by design; the size of a
  workable test, not a target).
- **Weekly ritual:** The Friday "Filings of the Week" digest. Single recurring
  reason to show up. Distributed via RSS, Substack, and a GitHub `releases/` tag.
- **Source mix:** GitHub organic (SEO from issue + blog content) · partner referrals
  (other ORGAN-III repos, MCA-adjacent tools) · intermediary referrals (capital
  provider partners, MCA trade publications).

## C. Dual-Channel Setup (Playbook §3)

- **"Filings Wire" (Host) channel:** the _data authority voice_. Speaks in filings,
  grades, jurisdictions, signal patterns. Does not sell. Does not produce marketing
  copy. Does not use emoji or first-person. Reads like a wire service.
- **Product channel (dashboard + CLI):** _receipts, scope, and trust_ — what the
  product is, what it is not, who it is for, who it is not for, with screen captures
  and scored output examples. Does not try to be the intimate wire voice.
- **Ratios (tuned defaults):** Filings Wire 70% raw data / 20% analysis / 10% conversion
  · Product 40% scope clarity / 30% trust / 20% proof / 10% conversion. The Host
  ratio skews _more_ data than Styx's Host because the niche rewards authority, not
  intimacy.
- **Fixed CTA set:**
  - Filings Wire: `Star the repo` · `Subscribe to the Friday digest` · `Try the
CLI: npm i -g public-record-data-scrapper`
  - Product: `See example output` · `Read the API docs` · `Open a dashboard
account`

## D. Five-Level Attack (Playbook §4)

- **L1 Demand Capture — 10 high-intent phrases:** "new ucc filing in [state]",
  "ucc-3 termination meaning", "how to read a ucc-1", "ucc search by debtor name",
  "is this company actively financing", "ucc priority rules", "what is a
  blanket lien", "ucc lapse date", "ucc collateral description", "ucc search api".
  Capture page: a single-page `/try-the-cli` route that runs the CLI in-browser
  via WebAssembly, no signup, with a deferred email capture at the end of the
  output.
- **L2 Borrowed Audience:** MCA trade publications (deBanked, Merchant Cash
  and Capital, ISO and Agent), MCA podcasts (the Broker Bulletin, the MCA
  Roundtable), MCA-adjacent creators on LinkedIn and Substack. 20 named
  targets, outreach via `template--creator-outreach.md` adapted to trade
  press, not consumer creators.
- **L3 Intermediary Distribution:** MCA brokers with 100+ active deals as
  _accountability infrastructure_ for their analyst teams (the B2B
  parallel of Styx's therapist-as-intermediary). One-pager hook: "Pull
  50-state UCCs in 30 seconds, score them, route to your CRM."
- **L4 Community Loop:** The Friday digest as the share-card moment.
  Referral mechanic: a digest subscriber who refers 3 brokers gets a
  permanent "Wire Contributor" credit on future digests.
- **L5 Authority Layer:** Three cornerstone essays, technical and
  unsentimental:
  1. **"What a UCC-1 Actually Means"** — a 5,000-word deconstruction of
     UCC-1 priority rules with worked examples from the live data.
  2. **"The 14-Day Window: Why UCC Filing Date Matters"** — a
     quantitative analysis of how filing-date-to-outreach lag
     correlates with close rate, drawn from the live data.
  3. **"How 50 State Portals Differ — and Why That Matters for Your
     Funnel"** — a side-by-side of the 50 state scraping agents'
     behaviors, failure modes, and the data-quality story.
- **Do-not-say-yet list (niche-specific):** no "AI-powered" hype, no
  "all 50 states" without a failure-mode caveat, no scraping claims
  that overpromise (some states legitimately rate-limit), no
  guarantees about _whether a deal will close_ (the tool surfaces
  filings, it does not produce funding), no shaming of brokers
  for not being technical (the CLI is optional).

## E. Audience-as-Product (Playbook §5)

- **Rungs on/off and order:** GitHub star (free) → email subscriber (Friday
  digest) → CLI/dashboard trial (self-serve) → paid API tier (high-volume
  brokers) → co-marketing partnership (capital providers, MCA-vertical SaaS).
  No sponsorship rung; B2B audience is not a sponsorship surface.
- **Where the Product sits relative to the rungs:** Product _is_ the
  third rung. The Friday digest is the funnel into the dashboard; the
  dashboard is the asset. This is the inverse of Styx, where the
  audience _is_ the asset and the product (Styx beta) is a downstream
  CTA.
- **Coexistence rule check:** The Friday digest does not pitch the
  paid API. The paid API does not pitch the digest. Each rung is
  honest about its own value. (This is the B2B analog of Styx's rule
  that the audience doesn't become a product brochure.)

## F. Engagement Economics (Playbook §6)

- **Rate / weekly hours:** 6 hours/week, internal cost only (no
  $100/hr external partner — this is not a co-founder build, it is
  a solo repo operator).
- **In-scope deliverables:** Friday digest · 2 cornerstone essays per
  quarter · weekly L2 outreach (5 targets) · GitHub release notes
  per shipped feature. **Out of scope:** paid acquisition, conference
  booths, broker relationship management beyond referrals.
- **ROI statement for payer (here: the system itself):** Asset
  growth = GitHub stars + email subscribers + weekly digest opens.
  Product pipeline = CLI installs + dashboard trials → paid tier.
  Reusable system = the L1-L5 attack and the 3 cornerstone essays
  are reusable for any ORGAN-III B2B data venture.
- **Paid-build vs equity boundary:** Not applicable; no co-founder
  here. (Styx has a 50/50 co-founder split that the engine has to
  navigate; this instance has a solo operator.)

## G. Metrics (Playbook §7)

- **6–10 KPIs + weekly targets** (use `template--metrics-tracker.md`):
  1. GitHub stars (target: +50/week, from ~baseline)
  2. Friday digest subscribers (target: +20/week)
  3. CLI installs per week (npm telemetry, target: +30/week)
  4. Dashboard trial signups (target: +5/week)
  5. Paid tier conversion (target: 1/week, long-cycle)
  6. Digest open rate (target: >40%)
  7. L1 capture page → email conversion (target: >8%)
  8. Cornerstone essay 30-day reads (target: >2,000 unique)
  9. L2 outreach → reply rate (target: >15%)
  10. Repo citation rate (target: ≥3 external citations/month — the
      B2B "social proof" metric)
- **Health bands source:** ORGAN-III Commerce REGE (if it exists) or
  the cross-organ GRO REGE at `docs/departments/gro/REGE.md` §9.
  Direct cross-organ borrow is appropriate here; the engine is
  organ-agnostic.

## H. Guardrails (Playbook §9)

- **Inherited from:** ORGAN-III Commerce growth organism, where it
  exists. Falls back to cross-organ GRO REGE.
- **Niche sensitivity rule:** **The MCA industry is regulator-scrutinized.**
  No scraping claims that overreach what the public portals actually
  allow. No "flood broker inboxes" growth tactics. No undisclosed
  paid promotion. Cite the originating state portal in every
  filing-cited artifact. The data is public; the _ethics_ of how it
  is used are not.
- **Honest disclosure:** This system is a CANDIDATE in promotion
  state (per `seed.yaml`). The Host channel cannot be launched
  before the system itself is promotion-ready. The L1-L5 attack
  above is **planning**; section "30/60/90" below sequences the
  actual launch.

---

## 30 / 60 / 90 Roadmap

- **Days 0–30 — Foundations:** Audit current state. Stand up the
  Friday digest (RSS + Substack, weekly cadence, 5 filings per issue,
  scored). Write the L1 capture page (`/try-the-cli` WASM route).
  Identify the 20 L2 outreach targets. _Do not_ launch the Host
  channel publicly until the system is PRODUCTION-tier and the
  legal-disclosure language is reviewed.
- **Days 31–60 — First 30 users:** Admit the first 30 CLI users.
  Ship the first 2 cornerstone essays. Open the GitHub Discussions
  tab. Start L2 outreach (5/week). Target: 50+ digest subscribers,
  200+ GitHub stars.
- **Days 61–90 — Compounding:** L3 intermediary outreach to broker
  partnerships. First paid-tier conversion test. Refine digest
  based on open-rate data. Target: 5 paid-tier users, 1 cornerstone
  essay with >2,000 reads, 1 partner referral leading to a 5-broker
  team install.

## Engine-portability verdict

Comparing back to the Styx/Jessica live instance:

| Dimension                      | Styx                                 | public-record-data-scrapper         | Same?                                             |
| ------------------------------ | ------------------------------------ | ----------------------------------- | ------------------------------------------------- |
| Host archetype                 | personal creator                     | branded expert account              | No (different archetype, same engine)             |
| Wedge                          | emotional/consumer (no-contact)      | professional/B2B (UCC-1 monitoring) | No (different content, same shape)                |
| Product                        | mobile app                           | CLI + dashboard                     | No (different artifact, same funnel role)         |
| Owned asset                    | email list                           | GitHub stars + email                | Partial (email is shared, GitHub is the new rung) |
| Proof loop                     | shareable milestone cards            | weekly data digest                  | No (different medium, same proof function)        |
| Five levels (L1-L5)            | all five used                        | all five used                       | **Yes**                                           |
| Dual channel                   | yes                                  | yes                                 | **Yes**                                           |
| Ladder (borrowed → cohort)     | yes                                  | yes (test cohort, not community)    | Partial                                           |
| Audience-as-product            | yes (audience IS asset)              | inverted (product IS asset)         | No — _honest inversion_                           |
| Engagement economics           | co-founder, $100/hr, equity boundary | solo operator, no co-founder        | No                                                |
| Guardrails (niche sensitivity) | emotional vulnerability              | regulator scrutiny                  | Different rules, same need                        |

**Verdict:** The engine is portable. Five of ten dimensions (Five Levels, Dual Channel,
Ladder, guardrails, content mix) are mechanically identical. The other five change
_type_ but not _function_. The Audience-as-Product section reveals the one honest
_inversion_ — for a B2B data tool, the product is the asset, not the audience. This
is a _different rung order_, not a _missing rung_. The engine's parameterized claim
holds.

**Changes required to the playbook:** None. The Instance reveals no required change
to `playbook--audience-growth-engine.md` — every section ran as-is with different
parameters. The one "inversion" in §E (Audience-as-Product) is documented as a
parameter choice, not a new pattern.

## Derived assets (this instance's outputs)

| Asset                         | File                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------ |
| 30-day content calendar       | `planning--public-record-data-scrapper-30-day-content-calendar--2026-06-11.md` |
| Content asset pack            | `planning--public-record-data-scrapper-content-asset-pack--2026-06-11.md`      |
| Metrics tracker               | `planning--public-record-data-scrapper-metrics-tracker--2026-06-11.md`         |
| Creator/intermediary outreach | `planning--public-record-data-scrapper-creator-outreach--2026-06-11.md`        |

## Linked

- Engine: `docs/playbooks/playbook--audience-growth-engine.md` §0
- Sibling instance: `docs/planning/planning--audience-growth-engine--styx-instance--2026-06-01.md`
- Sibling issue: #679 (this instance)
- Engine merged in: PR #668
