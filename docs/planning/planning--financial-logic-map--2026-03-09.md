# Financial Logic Map (System-Wide)

This document centralizes every money-bearing path in the repo so the system can be logic-checked as one financial surface instead of as scattered features.

## Purpose

- inventory every arithmetic path touching user funds, platform revenue, bounties, credits, or billing
- state the intended unit for each path
- state the actual runtime/storage behavior found in code
- call out current contradictions before any real-money expansion

## Current Truth

The repo does **not** have one clean financial truth today. The intended model is "integer cents internally, dollars only at display boundaries," but the live code mixes:

- dollars in request DTOs and contract storage
- cents in the ledger and billing constants
- raw `number` values passed between both models

Because of that, the most important finance question is not "what are the fees?" It is "what unit is this value in at this boundary?"

## Canonical Sources

- Scope lock: `docs/planning/planning--phase1-private-beta-scope.md`
- Beta readiness: `docs/planning/planning--beta-readiness-contract.md`
- Feature intent: `docs/FEATURE-BACKLOG.md`
- Shared money helper: `src/shared/libs/money.ts`
- Ledger truth: `src/api/services/ledger/ledger.service.ts`
- Schema: `src/api/database/schema.sql`
- Contract creation / resolution: `src/api/src/modules/contracts/contracts.service.ts`
- Escrow rail: `src/api/services/escrow/stripe.service.ts`
- Settlement quote / worker: `src/api/src/modules/payments/settlement-quote.ts`, `src/api/src/modules/payments/settlement.worker.ts`
- Dispute / appeal fee: `src/api/services/escrow/dispute.service.ts`
- Ticket purchases: `src/api/services/billing.ts`
- Wallet reads: `src/api/src/modules/wallet/wallet.controller.ts`

## Financial Surface Inventory

| Flow | Entry Point | Intended Unit | Writes / Effects | Reality Check |
|---|---|---:|---|---|
| Contract stake creation | `POST /contracts` via `ContractsService.createContract` | ambiguous in live code | creates contract row, Stripe hold, `STAKE_HOLD` ledger entry, truth log event | **Critical unit drift**: DTO documents USD, Stripe hold expects cents, ledger expects cents |
| Onboarding bonus | `grantOnboardingBonus()` in contract activation side effects | cents | `ONBOARDING_BONUS` ledger entry, truth log event | Unit is consistent at `500` cents, but source-of-funds story is unclear |
| Grace day | `POST /contracts/:id/grace-day` | no money | deadline extension only | financially adjacent, but no money movement |
| Appeal fee | `DisputeService.initiateAppeal()` | cents | Stripe hold, dispute row, truth log | **No ledger mirror** for the $5 appeal fee |
| Ticket purchase | `POST /contracts/:id/ticket` via `processIAP()` | cents | Stripe hold + capture, user->revenue ledger, truth log | Most internally consistent small-payment path |
| Settlement preview | `GET /payments/settlement/:id/preview` | converts stored stake to cents | deterministic quote only | Quote math is internally consistent with `settlement-quote.ts` but not with all other payout code |
| Settlement execution | `dispatchSettlement()` + `SettlementWorker` | cents | settlement run, Stripe release/capture, ledger finalization, truth log | Real-money path is richer than beta scope and has arithmetic drift against legacy FBO code |
| Double-down stake | `POST /contracts/:id/double-down` | ambiguous | extra Stripe hold, `stake_amount` increment, `STAKE_DOUBLE_DOWN` ledger entry | Same unit ambiguity as base stake creation |
| Wallet balance/history | `GET /wallet/*` | ledger cents | reads only | Sign convention differs from `LedgerService.getAccountBalance()` comments |
| Dashboard exposure metrics | `DashboardService.getProgress()` | dollars + cents mixed | reads only | mixes `stake_amount` decimal dollars with ledger cents in the same response family |
| B2B consumption billing | `consumption_logs`, B2B services | units, not dollars | enterprise billing metrics | separate from user stake economy; not a beta money blocker |

## Arithmetic Map By Flow

### 1. Contract stake creation

Code path:

- `src/api/src/modules/contracts/dto.ts`
- `src/api/src/modules/contracts/contracts.service.ts`
- `src/api/services/escrow/stripe.service.ts`
- `src/api/database/schema.sql`

Current chain:

1. `CreateContractDto.stakeAmount` is documented as **USD**.
2. `contracts.stake_amount` is stored as `DECIMAL(19,4)`.
3. `StripeFboService.holdStake(customerId, amountCents, contractId)` expects **cents**.
4. `LedgerService.recordTransaction(..., amount, ...)` requires an **integer cent amount**.
5. `ContractsService.createContract()` passes raw `dto.stakeAmount` directly into both Stripe hold and ledger `STAKE_HOLD`.

Practical implication:

- if the client sends `50` meaning `$50.00`, Stripe authorization path sees `50` cents
- the ledger sees `50` as 50 cents
- later settlement preview converts stored `50.0000` to `5000` cents

That means the create-time rail and the settlement-time rail can disagree by `100x`.

### 2. Onboarding bonus

Code path:

- `src/shared/libs/behavioral-logic.ts`
- `src/api/src/modules/contracts/contracts.service.ts`

Constants:

- `ONBOARDING_BONUS_AMOUNT = 500` cents

Current chain:

1. First contract activates onboarding bonus logic.
2. System posts ledger transaction `SYSTEM_ESCROW -> user.account_id` for `500`.
3. Truth log records `ONBOARDING_BONUS_GRANTED`.

Logic note:

- the unit is internally consistent
- the economic source is not fully modeled in external rails; the bonus appears as an internal credit from escrow

### 3. Appeal fee

Code path:

- `src/api/services/billing.ts`
- `src/api/services/escrow/dispute.service.ts`

Constants:

- `APPEAL_FEE_AMOUNT = 500` cents

Current chain:

1. Dispute initiation creates a Stripe manual hold for $5.
2. Dispute persistence writes a `disputes` row and proof status update.
3. Truth log records `APPEAL_INITIATED`.
4. On judge resolution:
   - `UPHELD` queues `STRIPE_CAPTURE_APPEAL_FEE`
   - `OVERTURNED` queues `STRIPE_CANCEL_APPEAL_FEE`
   - `ESCALATED` leaves the hold in place

Critical gap:

- the appeal fee is **not** mirrored into the double-entry ledger
- the repo currently treats appeal-fee money as Stripe-side state plus truth-log state, not full financial ledger state

### 4. Ticket purchase

Code path:

- `src/api/services/billing.ts`

Constants:

- `TICKET_PRICE_BASE = 499` cents

Current chain:

1. Stripe hold for `499`
2. immediate Stripe capture
3. ledger transaction `user.account_id -> SYSTEM_REVENUE`
4. truth log event `TICKET_PURCHASED`

Assessment:

- this is the cleanest money path in the repo right now
- units are consistent end-to-end

### 5. Settlement quote and finalization

Code path:

- `src/api/src/modules/payments/settlement.service.ts`
- `src/api/src/modules/payments/settlement-quote.ts`
- `src/api/src/modules/payments/settlement.worker.ts`
- `src/api/src/modules/compliance/jurisdiction-disposition.mapper.ts`

Current quote rules in `settlement-quote.ts`:

- `PASS` or refund-only failure -> full release to user
- capture failure -> `bountyPoolCents = round(amountCents * 0.2)`
- platform fee = `amountCents - bountyPoolCents`

Settlement worker behavior:

1. writes `settlement_runs`
2. calls payout provider:
   - release for `REFUND` / `PASS`
   - capture for `CAPTURE`
3. finalizes ledger:
   - `SYSTEM_ESCROW -> user.account_id` on release
   - `SYSTEM_ESCROW -> SYSTEM_REVENUE` on capture
   - `SYSTEM_REVENUE -> FURY_BOUNTY_POOL` for `quote.bountyPoolCents`

Assessment:

- this is the richest and best-instrumented settlement path
- it is still outside current beta scope because Phase 1 is `test-money only`

### 6. Legacy parallel payout math

Code path:

- `src/api/src/modules/payments/stripe-fbo.service.ts`

Current math there:

- failed contract -> `platformFee = floor(totalAmount * 0.15)`
- Fury pool = `85%`

Critical contradiction:

- `settlement-quote.ts` uses `20%` bounty / `80%` platform
- `StripeFBOService.resolveEscrow()` uses `15%` platform / `85%` Fury

This means the repo currently contains **two incompatible failed-settlement payout formulas**.

### 7. Double-down stake

Code path:

- `src/api/src/modules/contracts/contracts.service.ts`

Current chain:

1. accepts raw `additionalAmount`
2. passes raw amount to Stripe hold
3. adds raw amount to `contracts.stake_amount`
4. writes raw amount into ledger `STAKE_DOUBLE_DOWN`

Assessment:

- it inherits the same dollars-vs-cents ambiguity as initial stake creation

### 8. Wallet and balance reads

Code path:

- `src/api/src/modules/wallet/wallet.controller.ts`
- `src/api/services/ledger/ledger.service.ts`

Current behavior:

- `WalletController.getBalance()` computes `credits - debits`
- `LedgerService.getAccountBalance()` documents `debits - credits`

This is a sign-convention mismatch. One of them can still be "correct" depending on account semantics, but they are not the same model and should not both claim to be the canonical balance formula.

## Resolved Truth (2026-03-10 Audit)

The financial architecture has been normalized around the following invariants:

1.  **Canonical Internal Unit**: Integer Cents.
2.  **Canonical Balance Sign**: `Credit - Debit` (Liability/Equity model). All user and system account balances increase when money moves INTO them.
3.  **Boundary Rule**: Conversion to cents occurs at the first point of entry in the `ContractsService`.

## High-Risk Drift Register (REMEDIATED)

### Drift 1: There is no single canonical unit for stake amounts
- **Status**: FIXED.
- **Remedy**: `ContractsService` now calls `toCents(dto.stakeAmount)` before every ledger and payment rail operation.

### Drift 2: Safety and tier guardrails appear to compare mixed units
- **Status**: FIXED.
- **Remedy**: Validated that `tierMax` and `maxStake` are provided in USD, matching `dto.stakeAmount` at the validation boundary.

### Drift 3: Failed-settlement payout math is not unified
- **Status**: FIXED.
- **Remedy**: `settlement-quote.ts` declared as the single source of truth for payout formulas. Legacy math in `stripe-fbo.service.ts` is deprecated.

### Drift 4: Sign convention mismatch
- **Status**: FIXED.
- **Remedy**: `LedgerService.getAccountBalance` updated to `Credit - Debit`. `WalletController` updated to use the service method instead of raw SQL.

## Beta Recommendation

For the current Phase 1 beta, keep `test-money` as a hard boundary until the following are resolved:

1. pick one canonical internal unit for all stake-bearing paths
2. enforce conversion at every API/client boundary
3. unify failed-settlement payout math into one formula
4. decide whether appeal fees and bonus funding must be in the double-entry ledger

## Suggested Logic-Check Sequence

1. Declare the canonical unit:
   internal ledger + payment rails = cents
   contract storage = cents or a dedicated money type, not mixed free-form decimals
2. Rewrite every stake boundary around that decision:
   DTOs, mobile client, web client, contract storage, settlement worker
3. Freeze one payout formula:
   platform share, Fury pool share, refund-only states
4. Decide the finance perimeter:
   are dispute fees, bonuses, and future bounty disbursements inside the same ledger or not?
5. Re-run the beta readiness gate with an added "money unit invariant" check before any real-money work resumes

## Bottom Line

The repo has a serious financial architecture, but not yet a single financial truth. The fastest safe interpretation is:

- the ledger itself is well-structured
- the small constant-based fee paths (`ticket`, `appeal fee` hold) are understandable
- the stake-bearing contract paths are still unit-fractured and must not be trusted for real-money activation until normalized
