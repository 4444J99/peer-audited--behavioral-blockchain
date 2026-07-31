# Founder Decisions of Record

**Status:** living ledger — append, do not rewrite history
**Last reconciled:** 2026-07-31

Business policy on this project is decided by Jessica Tenenbaum (business
leadership) and product/technical policy by Anthony Padavano, per the founder
agreement draft. Those decisions have been made in Google Docs, comment threads,
and working sessions — surfaces the repository cannot see.

This file is the repository's copy. **A decision is not in force until it is
written here.** If code or a plan disagrees with an entry below, the entry wins
and the divergence is a bug.

> **Why this file exists.** On 2026-03-09 engineering shipped a payout briefing
> asking for five business answers, because `settlement-quote.ts` carried two
> conflicting formulas and the worksheet explicitly forbade engineering from
> picking one. Jessica answered all five on 2026-03-10, in comments on the
> briefing doc. Nothing carried the answers back. For **four and a half months**
> the worksheet in this repo showed blank lines, the code kept a constant
> labelled `PROVISIONAL_FAILED_CAPTURE_BOUNTY_POOL_RATE` "pending Jessica
> decision", and both looked like they were waiting on her. They were not. She
> had already decided.

---

## DR-001 — Go-to-market phase sequence

**Decided:** 2026-02-24 · **Source:** founder thread · **By:** joint

Phase 1 is the **no-contact / breakup-recovery** niche, not fitness. The wedge is
Jessica's existing audience in the relationship space (~18k at the time of the
decision, ~20k by 2026-06 — see `planning--jessica-metrics-tracker--2026-06-01.md`),
used as the initial test pool.

Sequence: **no-contact → health/fitness → B2B corporate wellness.**

Two constraints attached to this decision:

1. **Narrow deliberately.** Features not serving the no-contact journey are cut
   or hidden from the Phase 1 surface — modular release, one solid lane, not
   several half-built ones.
2. **B2B positioning is load-bearing even in Phase 1.** Corporate wellness is the
   terminal market ("departments compete internally"), so Phase 1 must not make
   choices that foreclose it.

**In force.** `planning--phase1-private-beta-scope.md` and
`planning--alpha-omega-completion-matrix.md` implement this correctly.
See [Known divergences](#known-divergences) for the pitch deck, which does not.

---

## DR-002 — Failed-contract payout, capture-allowed jurisdictions

**Decided:** 2026-03-10 · **Source:** Jessica briefing on payout decisions, reply block + comment · **By:** Jessica

| Recipient              | Share |
| ---------------------- | ----- |
| Platform               | 100%  |
| Fury pool              | 0%    |
| Reserve/insurance pool | 0%    |
| User refund            | 0%    |

This supersedes **both** formulas that had been in the repo — model A
(80% platform / 20% Fury pool) and model B (15% / 85%).

Her rationale, recorded because it defines the conditions for revisiting:

> For Phase 1, keep payout as simple as possible so we can isolate the
> behavioral hypothesis: money at risk + pod visibility + reputation.
> Forfeited deposits go entirely to the platform: not redistributed to the other
> users or pool. Removing the fury pool and reserve pool in Phase 1 avoids
> unnecessary complexity in the initial build and eliminates ambiguity around
> betting/prizes. [...] Goal: test behavior change, prove retention and
> engagement, not finalize long term pay structure.

Community pools and reserve mechanisms may be revisited **after** completion
rates and pod engagement are validated. The same call was recorded independently
in the 2026-03-09 working-session notes: _"cohort 1, individual OR pod based does
not distribute funds from losing participants."_

**In force.** `src/api/src/modules/payments/settlement-quote.ts` — the failed-capture
bounty-pool rate is `0`.

---

## DR-003 — Failed-contract payout, refund-only or unknown jurisdictions

**Decided:** 2026-03-10 · **Source:** as DR-002 · **By:** Jessica

100% refund to the user, and **Phase 1 is restricted to the United States**.
Terms of service must cover the commitment deposit and the forfeiture conditions.

Her caveat, which is why the state matrix still needs counsel:

> if restricted to US will limit any issues, but some states may still raise
> disputes.

**In force.** US-only is already the Phase 1 boundary in
`planning--phase1-private-beta-scope.md`; full refund is the `REFUND` disposition
in `settlement-quote.ts`. The per-state divergence is tracked in
`docs/legal/state-jurisdiction-matrix-DRAFT.md`.

---

## DR-004 — Appeal fee removed for beta

**Decided:** 2026-03-10 · **Source:** as DR-002 · **By:** Jessica

The $5.00 appeal friction fee is **removed for the beta cohort**. Appeals are
submitted at no cost.

> Cohort size is small enough to be reviewed without creating an operational
> burden. if we see high volume of frivolous appeals as product scales, we can
> introduce a small $5 appeal fee to discourage abuse.

The fee is therefore **deferred, not deleted** — the mechanism stays, the price
goes to zero for beta.

**In force since 2026-07-31.** `isAppealFeeEnabled()` in `src/api/services/billing.ts`
gates the hold; it defaults off and `STYX_APPEAL_FEE_ENABLED=true` reinstates the
$5 fee if frivolous volume appears, exactly as the rationale anticipates. Free
appeals carry the `PENDING_REVIEW` status and a null `payment_intent_id`; the
Judge queue accepts both statuses.

One thing the earlier scoping note got wrong, recorded because it changed the
work: `disputes.payment_intent_id` was **already nullable**
(`004_disputes.sql:8`) and resolution **already branched** on
`if (payment_intent_id && contract_id)`, so no migration was needed. The real
blocker was `contracts.service.ts`, which rejected any appeal from a user with no
saved card — that would have closed the appeal path to precisely the beta users
free appeals were meant to serve.

---

## DR-005 — Onboarding bonus removed for beta

**Decided:** 2026-03-10 · **Source:** as DR-002 · **By:** Jessica

The $5.00 endowed-progress onboarding bonus is **removed for the beta cohort**.

> We can consider adding credits or bonuses later if we want to improve
> conversion or test additional engagement mechanics.

Same shape as DR-004: deferred, not deleted.

**Not yet implemented.** See [Open implementation](#open-implementation-of-decided-policy).

---

## DR-006 — Beta payout language stays generic

**Decided:** 2026-03-10 · **Source:** as DR-002 · **By:** Jessica

Beta users see **generic test-money language only**. No provisional payout
percentages, no exact future economics on any tester-facing surface.

**In force**, and it is the reason DR-002 does not require user-facing copy
changes: no surface quotes the split.

---

## DR-007 — Founder agreement terms (MVP phase)

**Drafted:** 2026-03-05 · **Source:** founder agreement draft · **Status:** UNSIGNED

Terms as drafted, pending DocuSign execution:

- **Equity:** 50% Jessica Tenenbaum / 50% Anthony Padavano, joint IP ownership.
- **Vesting:** four years, one-year cliff. No vesting if a founder leaves inside
  year one.
- **Operating structure:** the Project runs temporarily under a Host LLC acting
  purely as administrative vehicle — collecting payments, processing expenses,
  running cohorts. The Host LLC owns **no** IP and holds only a temporary
  operating licence.
- **Proof of Concept** is reached on **any one** of: $25,000 cumulative revenue ·
  three completed paid cohorts with continued demand · a corporate partner
  expressing pilot/licensing interest · 200 paying participants completing the
  program. Reaching POC triggers formation of NewCo, to which all IP transfers.
- **Roles:** Jessica is primary decision-maker for **business operations and
  commercial strategy** (strategy, business model and pricing, financial
  oversight, operational planning, partnerships and B2B). Anthony is primary
  decision-maker for **technical development and product implementation** — and
  the draft also assigns him **marketing strategy, audience development, and
  community engagement**.
- **Joint decisions** requiring both founders: pricing model changes, equity
  structure, entity formation, sale or licensing, significant financial
  commitments, major changes to the product model.

**Not in force — unsigned.** `docs/legal/legal--founder-agreement-draft.md` is the
repo's copy.

---

## DR-008 — Open action items from the 2026-03-09 working session

**Source:** shared working-session notes, 2026-03-09

| Owner   | Item                                                             | Status                       |
| ------- | ---------------------------------------------------------------- | ---------------------------- |
| Jessica | Select a high-risk merchant account via Stripe                   | Open                         |
| Jessica | Draft user terms and agreement                                   | Open                         |
| Anthony | Automatic in-app calculation of fund collection and distribution | Done — `settlement-quote.ts` |
| Anthony | Obtain a lawyer referral                                         | Open                         |
| Joint   | Review product names                                             | Open                         |

The two Jessica items are the same external dependencies Circle 2 lists as open
(`Stripe Connect FBO production account`, and the terms that DR-003 requires).

---

## DR-009 — Demo commitment

**Committed:** 2026-07-28 · **By:** Anthony, at Jessica's request ("we need a demo")

A walkthrough demo by end of week 2026-07-31 / 2026-08-01, ahead of a business-strategy
session she asked to run.

**Deliverable exists:** `/circles` is the public index across Alpha→Omega and
`scripts/demo/README.md` is the operator's guide, including the twelve demo
logins. Not yet walked through with her.

---

## Known divergences

Places where shipped artifacts contradict a decision above. Each is a defect
against the record, not an open question.

| #   | Divergence                                                                                                                                                                                                                                                   | Location                                                                                 | Against |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------- |
| 1   | Go-to-market is described as "Phase 1 targets the highly motivated, high-LTV 'biohacker' and hardcore fitness communities", with enterprise as Phase 2 — a two-phase fitness-first sequence that predates and contradicts the no-contact wedge               | `src/web/components/PitchDeck/data/slidesData.ts:33`, `src/pitch/src/data/slides.ts:295` | DR-001  |
| 2   | The onboarding bonus is presented as a core acquisition mechanic ("$5 onboarding bonus means trying Styx is literally free", "CAC approaches zero")                                                                                                          | `src/pitch/src/data/slides.ts:130,138,146,397,447`                                       | DR-005  |
| ~~3~~ | ~~`docs/MANIFEST.md` described the founder agreement as a split between "Jessica (Marketing) and Partner (Technical)". The draft assigns marketing strategy, audience development, and community engagement to Anthony; Jessica's remit is business leadership.~~ **Corrected 2026-07-31.** | `docs/MANIFEST.md` `DOC-LEG-05` | DR-007 |

Divergences 1 and 2 are in **pitch/investor material**, which is deliberately not
the same document as the product roadmap — a deck may lead with the larger market
story. They are listed because the deck is the artifact most likely to be shown
to an outside party, so a contradiction with the operating plan is expensive
there, not cheap. Resolving them is a joint call under DR-007 ("major changes to
the product model" / commercial strategy), not a unilateral edit — which is why
they are recorded rather than fixed, while divergence 3 (a factual error in an
index entry, no strategy attached) was simply corrected.

---

## Open implementation of decided policy

DR-005 is decided but not built. It is not a one-line change, which is why it is
named here rather than quietly deferred.

### ~~DR-004 — free appeals~~ — **built 2026-07-31**

Kept for the record because the scoping was partly wrong and the correction is
worth more than the estimate. What actually shipped is under DR-004 above.

The unchanged part: setting `APPEAL_FEE_AMOUNT` to 0 would not work, because a
zero-amount authorization is invalid at Stripe — `initiateAppeal` would fail
closed and nobody could appeal. "Free" had to mean skipping the hold.

Two of the four predicted work items did not exist. `disputes.payment_intent_id`
was already nullable and resolution already branched on the null. The item that
was missed entirely — and was the actual blocker — was the precondition in
`contracts.service.ts` that threw `BadRequestException` for any user without a
saved Stripe customer, which would have denied free appeals to exactly the people
they were for. Estimating from the service that charges the fee missed the caller
that gates it.

### DR-005 — no onboarding bonus

`grantOnboardingBonus` (`src/shared/libs/behavioral-logic.ts:231`) is called from
two paths in `contracts.service.ts` (`:1045`, `:1675`), each posting a
`ONBOARDING_BONUS_AMOUNT` ledger credit. Suppressing the grant is contained, but
it interacts with divergence 2 above and with `endowed-progress.service.ts`, whose
whole premise is artificial initial advancement. Removing the money without
deciding what happens to the endowed-progress mechanic leaves a behavioral feature
half-wired — the failure mode Circle 5 already documented twice.

---

## Undecided — pricing has no entry here at all

Not a divergence from a decision. A **decision vacuum**: five monetization models
are live in shipped code and no `DR-NNN` covers any of them. Under DR-007 pricing
is both Jessica's remit (business model and pricing) and a **joint** decision
(pricing model changes), so engineering cannot pick one.

| Model | Where | Charged? |
| ----- | ----- | -------- |
| `MVP_39` — $39 total = $30 stake + $9 fee | `contracts.service.ts:110-112`, `dto.ts:147` | **Stake only.** The $9 is metadata; `normalizeContractPricing` overrides the stake to $30 and the sole charge is a $30 hold. |
| `EARLY_ACCESS_199` — $199 stake, $0 fee | `contracts.service.ts:113-115` | Stake only |
| Ticket $4.99 per contract, captured non-refundably | `billing.ts:7`, exposed on two duplicate routes | Yes, if called |
| Subscription $14.99/mo | `billing.ts:6` → `payments.controller.ts:195` | Yes, if called |
| Appeal $5.00 | `billing.ts` | No — disabled by DR-004 |

`docs/finance/pricing-strategy.md` exists but carries `generated: true`; it is an
artifact, not a founder sign-off.

**Fixed 2026-07-31 without deciding anything:** the UI rendered "Entry total $39"
and the terms of service asserted a **non-refundable $9.00 Platform Fee** — for a
charge that never occurs. Both now state what is actually charged. Removing a
false number from a contract users agree to is a defect fix; choosing the real
number is still the founders' call.

This is DR-002's failure mode at larger scale: DR-002 was two conflicting formulas
in one file with engineering forbidden to choose. This is five, across code and
the legal agreement, on the paths that move money.

---

## Awaiting confirmation

Proposals from Jessica that were framed as sketches rather than rulings, so they
are **not** decisions of record yet. Each is one reply away from becoming one.

### Self-reporting rules for the no-contact contract

From the DR-004 comment, prefixed _"Need clear rules for self reporting. Example:"_:

> participants must submit daily check in confirming they complied with contract
> terms. Failure to submit a check in by the deadline (time needs to be clear
> 11:59PM?) will receive one warning. This should be visible to pod members.
> Next miss is a forfeiture.

Against what is built (`src/api/src/modules/contracts/attestation.scheduler.ts`):

| Her sketch                           | Shipped                                                                 | Gap                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Daily check-in confirming compliance | Daily attestation rows created hourly for active `RECOVERY_*` contracts | none                                                                                                                  |
| Clear deadline, 11:59 PM?            | Midnight cron marks the prior day's `PENDING` rows `MISSED`             | Effectively end-of-day, but in **server** time, not the participant's. Needs deciding before a multi-timezone cohort. |
| One warning, **next** miss forfeits  | `NOCONTACT_MISS_STRIKE_THRESHOLD = 3` — forfeits on the **third** miss  | Her sketch is a threshold of **2**. One constant, `src/shared/libs/behavioral-logic.ts:133`.                          |
| Warning **visible to pod members**   | Warning is a private RAIN mindfulness notification to the user only     | Not built. Pod-visible miss state is a new surface.                                                                   |

The threshold is deliberately left at 3 pending her confirmation: tightening the
condition under which a participant forfeits their deposit is not a change to make
on the strength of an example.

---

## How to add an entry

1. Assign the next `DR-NNN`. Never renumber.
2. Record **decided date, source artifact, and who decided** — a decision without
   an owner is a suggestion.
3. Quote the rationale when it defines the conditions for revisiting the call.
   DR-002 is reversible only after completion rates are validated; that is worth
   more than the percentage.
4. State whether it is **in force**, and name the file that implements it.
5. If it contradicts something already shipped, add a row to
   [Known divergences](#known-divergences) rather than editing the old artifact silently.
