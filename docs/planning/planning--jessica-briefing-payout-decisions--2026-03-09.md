# Jessica Briefing: Payout Decisions

> **ANSWERED 2026-03-10. Closed.**
>
> All five items were decided the day after this brief went out. The answers, with Jessica's rationale and the conditions for revisiting each one, are recorded as DR-002 through DR-006 in [`planning--founder-decisions-of-record.md`](./planning--founder-decisions-of-record.md). **That file is authoritative; this one is the historical request.**
>
> The answers are reproduced below so this document is not misread as still pending — which is exactly what happened for four and a half months, because the reply lived only in comments on the shared copy of this brief and nothing carried it back into the repository.

This is the shortest business brief for locking payout economics without dragging you into code or planning noise.

## Answers (Jessica, 2026-03-10)

1. **Failed contract, capture-allowed jurisdiction:** `100% platform / 0% Fury pool / 0% reserve / 0% user refund`
2. **Refund-only or unknown jurisdiction:** full refund — and restrict Phase 1 to the U.S.
3. **Appeal fee:** remove for beta — no fee
4. **Onboarding bonus:** remove for beta
5. **Beta user-facing payout language:** keep generic only

## What This Is

- Phase 1 beta is still `test-money only`
- this is not a request to finalize the entire launch economy
- this is a request to choose the business rules engineering must stop guessing about

## What Engineering Needs From You

Please answer these five items.

### 1. Failed contract payout in capture-allowed jurisdictions

There is a conflict in the repo today. Two different formulas exist.

- model A: `80% platform / 20% Fury pool`
- model B: `15% platform / 85% Fury pool`

Answer (DR-002):

- platform: `100 %`
- Fury pool: `0 %`
- reserve / insurance pool: `0 %`
- user refund: `0 %`

Rule:

- total must equal `100%`

> Keep payout as simple as possible so we can isolate the behavioral hypothesis: money at risk + pod visibility + reputation. Removing the Fury pool and reserve pool in Phase 1 avoids unnecessary complexity in the initial build and eliminates ambiguity around betting/prizes. Revisit only once completion rates and pod engagement are validated.

### 2. Failed contract payout in refund-only or unknown jurisdictions

Recommended default:

- `100% refund to user`

Answer (DR-003):

- `100% refund to user`, and Phase 1 is **restricted to the U.S.**
- terms and agreements must cover the commitment deposit and forfeiture conditions

> Restricting to the US will limit any issues, but some states may still raise disputes.

### 3. Appeal fee

Current amount:

- `$5.00`

Answer (DR-004):

- keep `$5.00`: **no**
- new amount: `$0` — appeals are submitted at no cost
- status: `beta-only`

> Cohort size is small enough to be reviewed without creating an operational burden. If we see a high volume of frivolous appeals as the product scales, we can introduce a small $5 appeal fee to discourage abuse.

### 4. Onboarding bonus

Current amount:

- `$5.00`

Answer (DR-005):

- keep `$5.00`: **no**
- new amount: `$0`
- status: `beta-only`

> For the beta cohort. We can consider adding credits or bonuses later if we want to improve conversion or test additional engagement mechanics.

### 5. What should beta users see?

Recommended default:

- `generic test-money language only`

Answer (DR-006):

- `generic test-money language only`

## What Does Not Need Your Decision Today

Engineering can treat these as settled for Phase 1 unless you want to override them.

- completed contract: `100% returned to user`
- failed contract in refund-only or unknown jurisdictions: recommend `100% refunded to user`
- no real-money settlement in Phase 1 beta

## Why Your Input Matters

Without your answer, engineering is forced to choose between conflicting payout formulas that already exist in the repo. That is a business policy decision and should come from you, not from code drift.

## Reply Format

Reply with five short lines:

1. failed capture-allowed split: `__ / __ / __ / __`
2. refund-only or unknown jurisdiction: `full refund` or `other`
3. appeal fee: `keep $5` or `change to $X`
4. onboarding bonus: `keep $5` or `change to $X`
5. beta user-facing payout language: `generic only` or `show percentages`

