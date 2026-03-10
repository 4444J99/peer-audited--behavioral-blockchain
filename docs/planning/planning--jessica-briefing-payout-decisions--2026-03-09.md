# Jessica Briefing: Payout Decisions

This is the shortest business brief for locking payout economics without dragging you into code or planning noise.

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

Your answer:

- platform: `_____ %`
- Fury pool: `_____ %`
- reserve / insurance pool: `_____ %`
- user refund: `_____ %`

Rule:

- total must equal `100%`

### 2. Failed contract payout in refund-only or unknown jurisdictions

Recommended default:

- `100% refund to user`

Your answer:

- `100% refund to user`
- `other: ____________________`

### 3. Appeal fee

Current amount:

- `$5.00`

Your answer:

- keep `$5.00`: `yes / no`
- if no, new amount: `$_____`
- status: `beta-only / launch / undecided`

### 4. Onboarding bonus

Current amount:

- `$5.00`

Your answer:

- keep `$5.00`: `yes / no`
- if no, new amount: `$_____`
- status: `beta-only / launch / invite-only / undecided`

### 5. What should beta users see?

Recommended default:

- `generic test-money language only`

Your answer:

- `generic test-money language only`
- `show provisional payout percentages`
- `show exact future economics`

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

