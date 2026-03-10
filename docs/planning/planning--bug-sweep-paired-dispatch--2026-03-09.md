# Bug Sweep Paired Dispatch (2026-03-09)

This is the reduced dispatch model for the bug sweep.

The safest way to compress the seven lanes is:

- form two pairs where the work is naturally coupled
- leave the remaining lanes as singles because they do not pair cleanly without scope bleed

## Recommended Pairs

### Pair 1 — Runtime Truth

Includes:

- `B1` Mobile journey sweep
- `B2` API contract sweep

Why these belong together:

- the main beta defects here are shape-of-data defects
- mobile is the consumer
- API is the source of truth
- fixing one side without the other creates churn

Mission:

- make the beta path coherent from backend contract to mobile behavior

Primary boundaries:

- `src/mobile/screens/**`
- `src/mobile/services/ApiClient.ts`
- `src/api/src/modules/beta/**`
- `src/api/src/modules/contracts/**`
- `src/api/src/modules/auth/**`

Done when:

- the mobile core path and the API contract agree
- targeted mobile and API verification both pass

### Pair 2 — Surface Truth

Includes:

- `B3` Web surface sweep
- `B6` UX copy / claim-drift sweep

Why these belong together:

- both lanes are about what testers and reviewers see
- web/public copy and claim drift should be corrected in one pass
- this avoids fixing routes in one lane and leaving misleading language in another

Mission:

- make the tester-facing and reviewer-facing surfaces honest, narrow, and beta-safe

Primary boundaries:

- `src/web/app/**`
- legal/support route entry points
- `scripts/validation/07-claim-drift-check.js`
- beta-facing labels and public copy

Done when:

- public/tester-facing surfaces match the Phase 1 beta definition
- claim drift is reduced or explicitly documented

## Singles That Should Stay Separate

### Single 1 — `B4` Financial Invariant Sweep

Keep separate because:

- it has the highest risk if rushed
- it touches settlement, ledger, and arithmetic logic
- it should not be mixed with surface or UX work

### Single 2 — `B5` Release Readiness Sweep

Keep separate because:

- it is a release-evidence and environment-validation lane
- it depends on deployed targets and configured secrets
- it should stay owned by platform / release ops

### Single 3 — `B7` Manual Exploratory Sweep

Keep separate because:

- it is validation, not implementation
- it should observe the product after the code lanes settle
- it is where new defects get logged, not where they get silently fixed

## If You Only Want Four Active Owners

Run:

1. `Pair 1 — Runtime Truth`
2. `Pair 2 — Surface Truth`
3. `B4` Financial Invariant Sweep
4. `B5` Release Readiness Sweep

Then run `B7` immediately after those stabilize.

## If You Want The Absolute Minimum Start Set

Run only:

1. `Pair 1 — Runtime Truth`
2. `Pair 2 — Surface Truth`

That gives you the highest-yield first pass without mixing in finance or release-ops dependencies.
