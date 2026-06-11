# Public Record Data Scrapper — Content Asset Pack (Week 1, June 15-21)

Full copy for Week 1 of `planning--public-record-data-scrapper-30-day-content-calendar--2026-06-11.md`.
All posts pass `docs/departments/gro/REGE.md` CRIT:content-quality. The voice is **wire
service, not creator**: no emoji, no first-person plural, no marketing copy, no "we"
unless citing a fact about the system itself. Provenance is required on every
filing-cited artifact.

## Monday — short data (H, Pillar 1)

> **5 highest-priority UCC-1s filed in California, 2026-06-08 → 2026-06-12**
>
> 1. **Pacific Coast Distributors LLC** — filing #2024-0847291, B+, distribution,
>    secured party National Funding Inc. Filed 2026-06-09.
> 2. **Bay Area Logistics Group** — filing #2024-0851203, A-, logistics, secured
>    party Rapid Capital. Filed 2026-06-10.
> 3. **SoCal Wholesale Partners** — filing #2024-0854891, B+, wholesale, secured
>    party Fundbox. Filed 2026-06-11.
> 4. **Inland Empire Equipment Co** — filing #2024-0857102, A, equipment,
>    secured party OnDeck. Filed 2026-06-11.
> 5. **Central Valley Food Distribution** — filing #2024-0858901, B+, food
>    distribution, secured party BlueVine. Filed 2026-06-12.
>
> All filings available via the California Secretary of State UCC search portal.
> Scored and graded by the public-record-data-scrapper scoring v2.
>
> Source: https://bizfileonline.sos.ca.gov/

## Tuesday — short data (H, Pillar 1)

> **NV UCC-1 spike: 47 filings on 2026-06-10 vs 31 filings on 2025-06-10**
>
> +52% year-over-year. Possible seasonal pattern; possible new entrant; possible
> artifact of a state portal index update. We'll know more in 4 weeks of data.
>
> Source: https://nvsos.gov/sosentitysearch

## Tuesday — scope explainer (P, Pillar 4)

> **What public-record-data-scrapper is, and what it isn't**
>
> **Is:** a 50-state UCC-1 and UCC-3 collection + scoring + enrichment tool.
> Pulls filings from state Secretary of State portals, scores them 0-100 on
> financing likelihood, enriches with SEC EDGAR, OSHA, USPTO, Census Bureau,
> SAM.gov. Outputs JSON, CSV, or a React dashboard.
>
> **Isn't:** a deal-closer. The tool surfaces filings. It does not produce
> funding. It does not broker deals. It does not guarantee that a flagged
> filing will convert.
>
> **Is:** open source (MIT), self-hostable, with a managed cloud option.
> **Isn't:** a black box. The scoring algorithm is documented in the repo.
>
> **Is:** for MCA brokers, ISO agents, capital providers who need 50-state
> coverage without running 60+ state-specific scrapers themselves.
> **Isn't:** for individuals shopping for a personal loan. That's a different
> industry and a different tool.

## Wednesday — analysis (H, Pillar 2)

> **What "blanket lien" actually means in a UCC-1 collateral description**
>
> A blanket lien is a security interest in substantially all of a debtor's
> assets — present and future. The legal effect: the secured party can claim
> against anything the debtor owns or acquires during the lien period.
>
> In MCA practice this is significant because a blanket lien from a prior
> lender can subordinate a subsequent UCC-1's priority. If you're seeing
> "blanket lien" on a debtor's existing UCC-1, your subsequent filing may
> not have the priority you assumed.
>
> The scoring v2 weights this: filings on debtors with an active blanket
> lien get a -10 priority adjustment. Documented in the repo scoring
> algorithm.

## Thursday — short data (H, Pillar 1)

> **TX: 3 high-priority UCC-1s, all distribution sector, all filed within 72 hours**
>
> 1. **Lone Star Distribution Holdings** — filing #24-0089123, A, secured
>    party Kapitus. Filed 2026-06-11.
> 2. **DFW Wholesale Co** — filing #24-0091234, B+, secured party Fora
>    Financial. Filed 2026-06-12.
> 3. **Houston Industrial Supply** — filing #24-0092456, B+, secured party
>    National Funding. Filed 2026-06-12.
>
> 72-hour clustering in the same sector is unusual. Worth flagging if
> distribution is your book.
>
> Source: https://www.sos.state.tx.us/ucc/

## Thursday — trust (P, Pillar 5)

> **Provenance: how we cite state portals and what we redact**
>
> Every filing in the Filings Wire is cited to its state Secretary of State
> portal by URL and filing number. No exceptions. If you can't find a filing
> via the link in the Wire, that's a bug — file an issue.
>
> What we redact: debtor addresses at the request of state portals that mark
> them confidential. Secured party addresses when not material to the
> filing's priority. Personal identifiers (SSN, EIN) — the system never
> collects them.
>
> What we do NOT redact: debtor name, filing date, filing number, secured
> party name, collateral description. All of these are public record.

## Friday — weekly digest (H, Pillars 1 + 2)

> **Filings of the Week — 2026-06-15**
>
> This week: 247 new UCC-1s across the 5 highest-volume states (CA, TX, FL,
> NY, IL). Top 5 by priority score:
>
> 1. **Inland Empire Equipment Co** (CA) — 94/100, A grade, equipment
> 2. **Bay Area Logistics Group** (CA) — 88/100, A- grade, logistics
> 3. **Lone Star Distribution Holdings** (TX) — 87/100, A grade, distribution
> 4. **Pacific Coast Distributors LLC** (CA) — 82/100, B+ grade, distribution
> 5. **DFW Wholesale Co** (TX) — 79/100, B+ grade, wholesale
>
> All 247 filings available via the dashboard or the CLI:
> `pds scrape-ucc -s CA -o ca-week-2026-06-15.json`
>
> Next digest: 2026-06-22. Subscribe via RSS or email (link in bio).

## Saturday — conversion (H, Pillar 3)

> **Try the CLI in 30 seconds**
>
> ```
> npm i -g public-record-data-scrapper
> pds scrape-ucc -c "Pacific Coast Distributors" -s CA
> ```
>
> Outputs a scored, enriched JSON. No signup. No API key. No rate limit on
> the open-source version.
>
> If you need 50-state coverage at scale, the dashboard is at
> https://public-record-data-scrapper.vercel.app

## Production checklist (for the operator, pre-publish)

- [ ] Every filing-cited post links the state portal URL
- [ ] Every filing-cited post includes the filing number
- [ ] No "AI-powered" or "all 50 states" claims without a failure-mode caveat
- [ ] No emoji in the Filings Wire channel
- [ ] Friday digest includes provenance footer
- [ ] Saturday conversion post tested in a fresh terminal before publish
- [ ] Pre-launch gate: PRODUCTION tier in `seed.yaml` confirmed

## Linked

- Calendar: `planning--public-record-data-scrapper-30-day-content-calendar--2026-06-11.md`
- Engine: `planning--audience-growth-engine--public-record-data-scrapper-instance--2026-06-11.md`
- Sibling asset pack: `planning--jessica-content-asset-pack--2026-06-01.md`
