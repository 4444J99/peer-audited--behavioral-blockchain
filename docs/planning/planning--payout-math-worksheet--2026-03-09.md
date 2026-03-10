# Payout Math Worksheet (Jessica Input)

This is the shortest possible worksheet for locking payout economics without dragging Jessica into code details.

## Use Of This Worksheet

- Phase 1 beta is still `test-money only`
- this worksheet is for setting the business truth that future real-money logic and legal copy must follow
- if a field is left blank, engineering should not invent the answer

## Current Beta Reality

- completed contract: current system intent is `100% returned to user`
- failed contract in refund-only or unknown jurisdiction: current system intent is `100% refunded to user`
- failed contract in capture-allowed jurisdiction: **repo conflict exists**
  - model A in current settlement quote code: `80% platform / 20% Fury pool`
  - model B in legacy FBO payout code: `15% platform / 85% Fury pool`
- appeal friction fee: `$5.00`
- onboarding bonus: `$5.00`
- ticket purchase: `$4.99`

## Decisions Jessica Must Make

### 1. Completed contract

- user receives: `_____ %`
- platform receives: `_____ %`
- Fury pool receives: `_____ %`

Recommended default:

- user `100%`
- platform `0%`
- Fury pool `0%`

### 2. Failed contract in capture-allowed jurisdiction

Choose one formula only.

- platform receives: `_____ %`
- Fury pool receives: `_____ %`
- reserve / insurance pool receives: `_____ %`
- user refund receives: `_____ %`

Rule:

- total must equal `100%`

Recommended business constraint:

- keep one simple fixed formula
- do not create special-case payout rules by contract type during beta hardening

### 3. Failed contract in refund-only or unknown jurisdiction

Choose one:

- `100% refund to user`
- `other: ____________________`

Recommended default:

- `100% refund to user`

### 4. Appeal fee

Current value:

- `$5.00`

Jessica input:

- keep at `$5.00`? `yes / no`
- if no, new amount: `$_____`
- should this exist in launch economics, or be beta-only? `launch / beta-only / undecided`

### 5. Onboarding bonus

Current value:

- `$5.00`

Jessica input:

- keep at `$5.00`? `yes / no`
- if no, new amount: `$_____`
- should this be `beta-only / launch / invite-only / undecided`

### 6. Ticket purchase

Current value:

- `$4.99`

Jessica input:

- keep at `$4.99`? `yes / no`
- if no, new amount: `$_____`
- purpose of ticket: `support / premium action / dispute-related / other`

### 7. What should users see in beta?

Choose one:

- `generic test-money language only`
- `show provisional payout percentages`
- `show exact future economics`

Recommended default:

- `generic test-money language only`

## Minimum Answers Needed Back

Jessica only needs to send back these five answers:

1. failed-contract split in capture-allowed jurisdictions
2. confirm refund-only / unknown jurisdictions are full refund
3. keep or change the `$5.00` appeal fee
4. keep or change the `$5.00` onboarding bonus
5. confirm beta UI should stay generic and not show future real-money percentages

## Why This Matters

Without this worksheet, engineering is forced to choose between conflicting payout formulas already present in the repo. That should be a business decision, not an implementation accident.

## Source Notes

Derived from:

- `docs/planning/planning--financial-logic-map--2026-03-09.md`
- `src/api/src/modules/payments/settlement-quote.ts`
- `src/api/src/modules/payments/stripe-fbo.service.ts`
- `src/api/services/billing.ts`
