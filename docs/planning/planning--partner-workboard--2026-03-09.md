# Partner Workboard — Business-Side Operating View (2026-03-09)

This document translates the repo's roadmap and blocked issues into a plain-language board for the business-side partner. It is a coordination layer, not a replacement for the source planning docs.

## What This Board Is For

- Show which issues actually require business, legal, finance, growth, or founder action.
- Separate partner-owned work from engineering-owned work.
- Make the Beta gate explicit: what must be done by **April 30, 2026** versus what can wait until Gamma or later.

## How To Read Owner Codes

| Code | Meaning | What it means in practice |
|---|---|---|
| `H:LC` | Legal / Compliance | outside counsel, policy sign-off, regulatory review, terms/privacy, risk approvals |
| `H:BD` | Business Development | vendor selection, merchant account applications, partnerships, procurement |
| `H:RO` | Release Ops | Apple/App Store accounts, TestFlight provisioning, deployment credentials |
| `H:FO` | Founders | budget approvals, hiring, go/no-go decisions, account ownership |
| `AI` | Engineering / AI implementation | code, tests, schemas, endpoints, UI, internal docs |
| `H:MN` | Mobile Native | Swift/Kotlin native implementation; monitor, but not partner-owned |

## Source Of Truth

| Document | Why it matters |
|---|---|
| [planning--timeline-with-owners--2026-03-06.md](planning--timeline-with-owners--2026-03-06.md) | master roadmap with owners, tickets, and target months |
| [planning--blocked-handoff-index--latest.md](planning--blocked-handoff-index--latest.md) | canonical list of human-blocked GitHub issues |
| [planning--monthly-calendar--2026-03-08.md](planning--monthly-calendar--2026-03-08.md) | month-by-month operating sequence |
| [planning--research-ticket-pack--2026-03-04.md](planning--research-ticket-pack--2026-03-04.md) | ticket-level acceptance criteria and rationale |
| [../departments/README.md](../departments/README.md) | map of department artifacts |
| [../departments/leg/REGE.md](../departments/leg/REGE.md) | legal operating scope and checkpoints |
| [../departments/fin/REGE.md](../departments/fin/REGE.md) | finance operating scope and approvals |
| [../departments/gro/REGE.md](../departments/gro/REGE.md) | growth operating scope |
| [../departments/b2b/REGE.md](../departments/b2b/REGE.md) | practitioner / partnership sales scope |

## Partner Lane Vs Engineering Lane

### Partner lane

- Retain and manage outside counsel.
- Select and negotiate external vendors.
- Open or upgrade required business accounts.
- Produce policy packages, legal review packages, and merchant account materials.
- Drive fundraising, pricing sign-off, GTM, and partnerships.

### Engineering lane

- Build and test APIs, schema changes, admin tooling, mobile/web UI, and compliance enforcement logic.
- Support partner work with technical answers, implementation evidence, and readiness status.

## Immediate Critical Path: Beta Gate (Due April 30, 2026)

These are the business-side items that can block Beta even if engineering keeps shipping.

| Priority | Issue / Ticket | Owner | What the partner needs to drive | Deliverable | Due |
|---|---|---|---|---|---|
| `P0` | [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) + `TKT-P0-003` | `H:LC` + `H:BD` | choose KYC vendor, negotiate DPA, confirm retention and jurisdiction handling | signed vendor path for identity verification | 2026-04-30 |
| `P0` | [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) + `TKT-P0-001` | `H:LC` + `H:BD` | complete merchant account / processor path for production settlement; resolve skill-contest positioning with processor | approved payment processor path and acceptable terms | 2026-04-30 |
| `P0` | [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | `H:LC` | turn existing research into a formal skill-based contest memo and get counsel sign-off | whitepaper / legal memo approved for launch use | 2026-04-30 |
| `P0` | [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) | `H:LC` + `H:RO` | assemble App Store UGC moderation policy and submission package | complete moderation policy + submission packet | 2026-04-30 |
| `P0` | custody model review under `TKT-P0-001` | `H:LC` | confirm the escrow/custody structure is acceptable | signed custody model review | 2026-04-30 |
| `P0` | state matrix sign-off under `TKT-P0-004` | `H:LC` | validate which states are allowed, restricted, or excluded | approved state jurisdiction matrix | 2026-04-30 |
| `P0` | processor terms review under `TKT-P0-001` | `H:LC` + `H:BD` | confirm processor language does not force gambling classification | processor review memo | 2026-04-30 |
| `P0` | Apple / TestFlight operational setup [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | `H:RO` + `H:FO` | open, verify, and control the Apple-side accounts needed for Beta distribution | App Store Connect + TestFlight ready | 2026-04-30 |

## What She Should Do First

### This week

| Order | Action | Why it cannot wait |
|---|---|---|
| 1 | Retain outside counsel on a defined scope: custody, state matrix, whitepaper, App Store policy | one legal retainer unlocks multiple Beta blockers at once |
| 2 | Build a 3-vendor KYC shortlist: Stripe Identity, Persona, Jumio | vendor diligence and DPAs take time |
| 3 | Start the merchant account / processor application process | underwriting and category review can take weeks |
| 4 | Confirm who owns the Apple Developer and App Store accounts | distribution is blocked without clean account ownership |
| 5 | Lock a weekly founder/business review cadence | Beta blockers span legal, BD, ops, and finance |
| 6 | Review and sign off the current unit economics model | pricing, processor terms, and fundraising all depend on it |

### This month

| Action | Primary docs |
|---|---|
| finalize unit economics and runway assumptions | [../departments/fin/artifacts/unit-economics.md](../departments/fin/artifacts/unit-economics.md), [../departments/fin/artifacts/runway-tracker.md](../departments/fin/artifacts/runway-tracker.md), [../departments/fin/artifacts/financial-projections.md](../departments/fin/artifacts/financial-projections.md) |
| prepare funding / grant language and data room inputs | [../departments/fin/artifacts/funding-application.md](../departments/fin/artifacts/funding-application.md) |
| review legal baseline documents | [../departments/leg/artifacts/terms-of-service.md](../departments/leg/artifacts/terms-of-service.md), [../departments/leg/artifacts/privacy-policy.md](../departments/leg/artifacts/privacy-policy.md), [../departments/leg/artifacts/regulatory-risk-register.md](../departments/leg/artifacts/regulatory-risk-register.md) |
| frame the first practitioner outreach motion | [../departments/b2b/artifacts/icp.md](../departments/b2b/artifacts/icp.md), [../departments/b2b/artifacts/outreach-sequences.md](../departments/b2b/artifacts/outreach-sequences.md), [../departments/b2b/artifacts/security-questionnaire.md](../departments/b2b/artifacts/security-questionnaire.md) |
| prepare the early GTM lane | [../departments/gro/artifacts/gtm-strategy.md](../departments/gro/artifacts/gtm-strategy.md), [../departments/gro/artifacts/content-calendar.md](../departments/gro/artifacts/content-calendar.md), [../departments/gro/artifacts/seo-strategy.md](../departments/gro/artifacts/seo-strategy.md) |

## Next Wave: Gamma Gate (Due June 30, 2026)

These are not April blockers, but they should be queued now so they do not surprise the team in May.

| Priority | Issue | Owner | What the partner needs to drive | Due |
|---|---|---|---|---|
| `P1` | [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126) | `H:BD` | secure Fitbit / WHOOP access or partnership path | 2026-06-30 |
| `P1` | [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148) | `H:LC` | legal review of the cross-jurisdictional consent matrix | 2026-06-30 |
| `P1` | TestFlight external beta launch prep | `H:FO` + `H:RO` | recruit and manage the first external cohort, support channel, feedback loop | 2026-05 to 2026-06 |
| `P1` | practitioner/user recruitment motion | `H:FO` + `H:BD` + `GRO` | launch the first therapist/coach outreach and user recruitment plan | 2026-05 to 2026-06 |

## Later Business Pipeline (Track, But Do Not Let It Distract Beta)

| Phase | Issue | Owner | Meaning |
|---|---|---|---|
| Omega / Phase 2 | [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129) | `H:BD` | Plaid relationship for bank-linked flows |
| Omega / Phase 2 | [#137](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/137) | `H:LC` | prize indemnity insurance |
| Omega / Phase 2 | [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139) | `H:BD` | hardware partnership program |
| Omega / Phase 2 | [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140) | `H:BD` | insurance distribution partnership |
| Omega / Phase 2 | [#147](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/147) | `H:LC` + `H:BD` | stablecoin regulatory and banking path |

## Weekly Operating Cadence For The Partner

| Day | Focus | Output |
|---|---|---|
| Monday | blocker review | update this board: what is blocked, who owns next move, what slipped |
| Tuesday | legal / vendor follow-ups | counsel emails, DPA review, merchant/KYC calls |
| Wednesday | finance / fundraising | runway update, unit economics review, funding materials |
| Thursday | B2B / growth | outreach review, partner pipeline, GTM updates |
| Friday | founder sync | go/no-go calls, budget approvals, issue escalation |

## Founder Decisions That Must Not Drift

| Decision | Why it matters |
|---|---|
| outside counsel retained | required for multiple Beta sign-offs |
| KYC vendor chosen | unblocks `TKT-P0-003` and issue `#132` |
| merchant / processor path approved | unblocks `TKT-P0-001` and issue `#133` |
| Apple account ownership settled | unblocks `#141` |
| Stripe production setup approved | required before real-money Beta |
| unit economics signed off | necessary for pricing, fundraising, and processor conversations |
| Beta go / no-go declared by April 30 | formal phase gate |

## Status Notes

- The repo still lists the major Beta tickets as `Not Started` in the planning docs, and all human-blocked issues should be treated as open until the external action is complete.
- Engineering can reduce risk before those approvals land, but engineering work does not close legal, vendor, or account blockers by itself.
- For the business-side partner, the most leveraged move is not "do more tasks" but "clear the small number of blockers that unlock many tickets."

## Recommended Working Rule

Use this board as the partner's weekly operating sheet, and use the timeline / blocked-handoff docs as the evidence layer underneath it. If a task does not have a named owner, a next action, and a due date, it is not ready to be managed.
