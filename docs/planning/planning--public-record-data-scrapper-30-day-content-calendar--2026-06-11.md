# Public Record Data Scrapper — 30-Day Content Calendar (UCC Wedge)

Instantiation of `docs/playbooks/templates/template--content-calendar.md` for the Filings
Wire Host channel + Product channel. Honors the ratios from
`planning--audience-growth-engine--public-record-data-scrapper-instance--2026-06-11.md` §C
(70/20/10 Host · 40/30/20/10 Product). Window: 2026-06-15 → 2026-07-12.

`H` = Filings Wire channel · `P` = Product channel · `O` = owned (GitHub releases + email
digest). All copy must pass `docs/departments/gro/REGE.md` CRIT:content-quality and is
provenance-first (cite state portal in every filing-cited artifact). Week-1 full drafts
live in `planning--public-record-data-scrapper-content-asset-pack--2026-06-11.md`.

## Pillars

| #   | Pillar                                           | Channel | Ratio | Goal                |
| --- | ------------------------------------------------ | ------- | ----- | ------------------- |
| 1   | Raw data (this week's filings, scored)           | H       | 70%   | authority + capture |
| 2   | Analysis (what the filings mean)                 | H       | 20%   | depth, shareability |
| 3   | Selective conversion (CLI / dashboard)           | H       | 10%   | funnel              |
| 4   | Product clarity (what the tool is / is not)      | P       | 40%   | destination         |
| 5   | Trust / scope / provenance                       | P       | 30%   | de-risk             |
| 6   | Proof (output examples, GitHub stars, citations) | P       | 20%   | social proof        |
| 7   | Conversion (CLI install, dashboard trial)        | P       | 10%   | activation          |

## Weekly cadence target

- **Filings Wire (H):** 4-5 short data posts · 1 weekly digest (Friday) · 1 conversion
  touch (CLI/dashboard)
- **Product (P):** 1 scope/trust post · 1 proof post · 1 release-notes roundup · 1
  conversion CTA
- **Owned (O):** 1 Friday digest (RSS + email) · 1 GitHub release tag per shipped
  feature

---

## Week 1 — "Launch the Wire" (week of 2026-06-15)

| Day | Ch  | Format        | Content / hook                                                                                                              | Pillar | CTA                     |
| --- | --- | ------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------- |
| Mon | H   | short data    | "This week's 5 highest-priority UCC-1s in CA: filing dates 2026-06-08 → 2026-06-12, all B+ or better."                      | 1      | —                       |
| Mon | O   | release       | v0.4.2 release notes — 3 new state agents (HI, ME, VT)                                                                      | —      | Star the repo           |
| Tue | H   | short data    | "NV UCC-1 spike: 47 filings on 2026-06-10 vs 31 last month. Possible seasonal pattern."                                     | 1      | —                       |
| Tue | P   | scope         | "What the tool is, what it isn't" — 60-sec scope explainer                                                                  | 4      | See example output      |
| Wed | H   | analysis      | "What 'blanket lien' actually means in a UCC-1 collateral description"                                                      | 2      | —                       |
| Thu | H   | short data    | "TX: 3 high-priority filings, all in distribution, all filed within 72 hours"                                               | 1      | —                       |
| Thu | P   | trust         | Provenance — how we cite state portals and what we redact                                                                   | 5      | Read the API docs       |
| Fri | H   | weekly digest | Friday "Filings of the Week" digest #001 (5 filings, scored, cited)                                                         | 1, 2   | Subscribe to the digest |
| Fri | O   | email         | First digest to email list                                                                                                  | —      | Subscribe               |
| Sat | H   | conversion    | "Try the CLI in 30 seconds: `npm i -g public-record-data-scrapper && pds scrape-ucc -c 'Pacific Coast Distributors' -s CA`" | 3      | Try the CLI             |

## Week 2 — "The 14-day window" (week of 2026-06-22)

| Day | Ch  | Format        | Content / hook                                                                | Pillar | CTA                |
| --- | --- | ------------- | ----------------------------------------------------------------------------- | ------ | ------------------ |
| Mon | H   | short data    | "12-day-old filing in FL. Health grade A. Why we're flagging it."             | 1      | —                  |
| Tue | H   | analysis      | "The 14-day window: why UCC filing date matters" (L5 essay teaser)            | 2      | —                  |
| Tue | P   | proof         | Screen walkthrough: scoring a filing 0–100                                    | 6      | See example output |
| Wed | H   | short data    | "IL: 8 filings in a single debtor's name within 30 days. Red flag or rollup?" | 1      | —                  |
| Thu | H   | analysis      | "How to read a UCC-3 termination"                                             | 2      | —                  |
| Thu | P   | trust         | "What we do NOT scrape (some state rate limits are real)"                     | 5      | Read the API docs  |
| Fri | H   | weekly digest | Filings of the Week #002                                                      | 1, 2   | Subscribe          |
| Sat | H   | conversion    | "If you've ever pulled a UCC-1 by hand, see what 30 seconds looks like"       | 3      | Try the CLI        |

## Week 3 — "First 30 CLI users" (week of 2026-06-29)

| Day | Ch  | Format        | Content / hook                                                         | Pillar | CTA                      |
| --- | --- | ------------- | ---------------------------------------------------------------------- | ------ | ------------------------ |
| Mon | H   | short data    | "CA: 5 filings, all B+ or better, all in the same NAICS sector"        | 1      | —                        |
| Tue | H   | analysis      | "Lapse dates: what they tell you about borrower intent"                | 2      | —                        |
| Tue | P   | proof         | "First 30 CLI users — what they're using it for" (consented quotes)    | 6      | See example output       |
| Wed | H   | short data    | "NY: 3 cross-state filings on the same debtor. What's happening here." | 1      | —                        |
| Thu | H   | analysis      | "UCC priority rules: who gets paid first when the debtor doesn't"      | 2      | —                        |
| Thu | P   | scope         | "Who the tool is for (brokers, ISO agents, capital providers)"         | 4      | Open a dashboard account |
| Fri | H   | weekly digest | Filings of the Week #003                                               | 1, 2   | Subscribe                |
| Sat | H   | conversion    | "If you have 100+ active deals, this is built for you" (L3 hook)       | 3      | Try the CLI              |

## Week 4 — "Compounding authority" (week of 2026-07-06)

| Day | Ch  | Format                  | Content / hook                                                       | Pillar | CTA                |
| --- | --- | ----------------------- | -------------------------------------------------------------------- | ------ | ------------------ |
| Mon | H   | short data              | "FL: 4 filings, all A-grade, all in retail. Pattern or coincidence?" | 1      | —                  |
| Tue | H   | analysis (essay teaser) | "What a UCC-1 actually means" (L5 cornerstone)                       | 2      | —                  |
| Tue | P   | release                 | v0.5.0 release — 5 new state agents + scoring v2                     | 4      | See example output |
| Wed | H   | short data              | "WA: 6 filings, mix of A and B grades, mostly equipment collateral"  | 1      | —                  |
| Thu | H   | analysis                | "Why your funnel should care about UCC-3 continuations"              | 2      | —                  |
| Thu | P   | proof                   | "3 external citations this month" (the B2B social proof)             | 6      | Star the repo      |
| Fri | H   | weekly digest           | Filings of the Week #004                                             | 1, 2   | Subscribe          |
| Sat | H   | conversion              | "If you've cited the tool, the Wire Contributor credit is yours"     | 3      | Star the repo      |

---

## Production notes

- **Pre-launch requirement:** All Week 1 content is staged but unpublished. The Filings
  Wire channel does not go public until the system reaches PRODUCTION tier in
  `seed.yaml` and the legal-disclosure language is reviewed. (See instance doc §H.)
- **Day-of cadence:** A single author (or automation) produces the daily short data
  posts. The Friday digest is the only post that requires a writer's voice; the rest
  can be templated. This is the B2B analog of Styx's "Jessica writes, the calendar
  ships" model — for public-record-data-scrapper, the _scraper writes, the human
  curates_.
- **CTA rotation rule:** Each week's Saturday conversion post uses a _different_ CTA
  verb (Try → Install → Open → See). This is the inverse of the Styx CTA discipline
  (which repeats a fixed set); for B2B, the audience is less parasocial and more
  scanning, so a wider CTA set reads as honest, not scattered.
- **Provenance rule:** Every filing-cited post names the state portal and the filing
  number. No exceptions. (Niche sensitivity rule from instance doc §H.)

## Linked

- Engine instantiation: `planning--audience-growth-engine--public-record-data-scrapper-instance--2026-06-11.md`
- Templates used: `docs/playbooks/templates/template--content-calendar.md`
- Sibling calendar: `planning--jessica-30-day-content-calendar--2026-06-01.md`
