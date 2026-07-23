# Financial Reconciliation — Stripe vs Internal Records
> Issue: #350
> Phase: Production (Live Money)

## Overview

Styx runs a double-entry ledger where every financial transaction is a balanced debit/credit pair. The internal ledger must reconcile perfectly with Stripe's records at all times — any discrepancy means phantom money, lost funds, or accounting errors. This doc defines the daily reconciliation process, dispute handling, settlement matching, reporting cadence, and audit trail requirements.

## Reconciliation Architecture

```
Stripe Dashboard
    │
    ├── Balance transactions stream ──┐
    ├── Payout records                 │
    ├── Dispute records                │
    └── Charge records                 │
                                       ▼
                            Reconciliation Script
                            ┌─────────────────┐
                            │ Compare:         │
                            │ Internal ledger  │
                            │ ↔ Stripe records │
                            │ → Report diffs   │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              Match Found      Mismatch           Orphan Record
              ✓ OK             → Investigate      → Create entry
                                 → Fix within 24h   or flag
```

## Daily Reconciliation Script

### Schedule

| Environment | Frequency | Time | Trigger |
|-------------|-----------|------|---------|
| Production | Daily | 03:00 UTC | Cron job (Render cron) |
| Staging | Daily | 04:00 UTC | Cron job |
| Test mode | On-demand | — | Manual trigger via CLI |

### Script Location

`scripts/validation/01-phantom-money-check.ts` (existing) extended with full reconciliation logic.

### What It Checks

**1. Stripe Balance vs. Internal Ledger Balance**

```
Stripe available balance    =  sum(unsettled credits) - sum(unsettled debits)
Internal ledger balance     =  sum(all open debit entries) - sum(all open credit entries)
Diff                        =  Stripe balance - Ledger balance
Threshold                   =  $0.01 (any cent-level diff triggers alert)
```

**2. Transaction-Level Matching**

For each Stripe balance transaction, find corresponding internal ledger entry(ies):

| Stripe Transaction | Internal Ledger Entry | Match Key |
|--------------------|-----------------------|-----------|
| `charge` | `contract_stake_debit` | Stripe charge ID |
| `refund` | `contract_refund_credit` | Stripe refund ID |
| `payout` | `fbo_payout_debit` | Stripe payout ID |
| `adjustment` | `stripe_adjustment` | Stripe adjustment ID |
| `application_fee` | `platform_fee_credit` | Stripe fee ID |
| `transfer` | `connected_account_transfer` | Stripe transfer ID |

**3. In-Flight Contract Reconciliation**

For each contract in `pending` or `in_progress` status:

```
Expected escrow hold  =  contract stake amount
Stripe escrow record  =  payment_intent.amount_capturable
Match                 =  expected == actual
```

**4. Payout Reconciliation**

For each Stripe payout:

```
Stripe payout amount              =  sum(transactions in payout)
Internal payout record            =  sum(transactions grouped by payout batch)
Expected FBO balance after payout =  previous balance - payout amount
FBO bank account balance          =  (queried via bank API or manual)
Match                             =  all three match
```

### Script Output

```json
{
  "run_id": "recon-2026-07-21-0300",
  "timestamp": "2026-07-21T03:00:00Z",
  "summary": {
    "total_checks": 7,
    "passed": 6,
    "failed": 1,
    "critical_failures": 0
  },
  "checks": [
    {
      "check": "stripe_vs_ledger_balance",
      "status": "passed",
      "details": {
        "stripe_balance": 12453.67,
        "ledger_balance": 12453.67,
        "diff": 0.00
      }
    },
    {
      "check": "transaction_matching",
      "status": "failed",
      "details": {
        "stripe_transactions": 142,
        "matched": 141,
        "unmatched_stripe_ids": ["txn_abc123"],
        "orphan_ledger_entries": []
      }
    }
  ],
  "alerts": [
    {
      "severity": "warning",
      "message": "Unmatched Stripe transaction txn_abc123 — not found in internal ledger",
      "action": "Investigate within 24 hours"
    }
  ]
}
```

### Alert Levels

| Level | Condition | Action | Response Time |
|-------|-----------|--------|---------------|
| **Critical** | Balance mismatch > $1.00 | Ping #finance-alerts, page both founders | < 1 hour |
| **Warning** | Balance mismatch $0.01-$1.00, unmatched transaction | Create ticket, investigate | < 24 hours |
| **Info** | Orphan ledger entry (no Stripe match) | Review, create corrective entry | < 72 hours |
| **Success** | All checks pass | Log result, no action needed | — |

## Dispute Handling

### Dispute Flow

```
Stripe dispute.created webhook
    │
    ├── Freeze associated contract (no payout, no refund)
    ├── Create dispute record in internal ledger
    ├── Notify admin (email + Slack)
    │
    ├── [24h] Gather evidence:
    │   ├── Proof submission (from R2 storage)
    │   ├── Audit trail (Fury verdicts)
    │   ├── Contract terms
    │   ├── Communication record
    │   └── Previous completion history
    │
    ├── [48h] Submit evidence to Stripe via API
    │
    ├── [Open] Monitor dispute status
    │
    └── Resolution:
        ├── Won → Release frozen funds → Update ledger
        └── Lost → Write off → Update ledger → Review for pattern
```

### Dispute Categories

| Dispute Reason | Likelihood | Defense Strategy | Win Rate (est.) |
|---------------|------------|-----------------|-----------------|
| "Product not received" | Medium | Proof of service (audit verdict, timestamped proof) | 90% |
| "Not as described" | Low | Contract terms + audit trail | 85% |
| "Fraudulent" | Low | KYC records, IP logs, device fingerprinting | 70% |
| "Canceled subscription" | Low | Cancellation policy acknowledgment | 95% |
| "Credit not processed" | Low | Refund records, payout receipts | 95% |

### Dispute Response Checklist

- [ ] Contract frozen (no further action possible)
- [ ] Ledger entry created with `status: disputed`
- [ ] Evidence package assembled:
  - [ ] User proof submission (original file + timestamp)
  - [ ] Fury audit verdict (consensus result + individual auditor votes)
  - [ ] Contract creation timestamp + terms
  - [ ] User IP address + device fingerprint (fraud cases)
  - [ ] KYC verification record (if applicable)
  - [ ] Previous contract completion history
- [ ] Evidence submitted via Stripe API within 48 hours
- [ ] Internal ledger updated with dispute result
- [ ] Pattern analysis: is this user, practitioner, or contract type causing disputes?

## Settlement Matching

### Stripe Payout Cycle

| Frequency | Timing | Description |
|-----------|--------|-------------|
| Daily (automatic) | Next business day | Standard payout of available balance |
| Manual (if configured) | — | On-demand payout trigger via API |

### Settlement Reconciliation

For each payout batch received in the FBO bank account:

```
1. Strip payout ID → Internal payout record
2. Payout amount = sum of matched transactions
3. Payout date = expected settlement date
4. Bank statement row = payout amount + payout ID reference
5. Internal ledger balance = bank balance
```

### Batch Settlement Tracking

| Field | Source | Check |
|-------|--------|-------|
| Payout ID | Stripe API | Unique, sequential |
| Amount | Stripe balance transaction | Matches internal payout batch sum |
| Fees (Stripe processing) | Stripe balance transaction | Matches internal fee category |
| Net amount | Stripe balance transaction | Amount - fees = deposited amount |
| Bank statement entry | Bank portal | Same amount, same date |
| Internal ledger | Styx database | All transactions in batch recorded |

## Reporting Cadence

### Daily (Automated)

| Report | Run Time | Recipients | Format |
|--------|----------|------------|--------|
| Reconciliation summary | 03:00 UTC | #finance-alerts Slack | JSON + summary card |
| Balance snapshot | 03:00 UTC | Audit log | Stored in R2 (immutable) |
| Unmatched transactions | 03:00 UTC | Technical co-founder | Slack DM if > 0 |
| Failed webhook retries | Continuous | #alerts Slack | Per-event notification |

### Weekly

| Report | Day | Recipients | Format |
|--------|-----|------------|--------|
| Ledger integrity audit | Monday | Both founders | PDF via email |
| Dispute summary | Monday | Both founders | Table + trend |
| Stripe fee analysis | Monday | Finance | Spreadsheet |
| Payout reconciliation | Monday | Finance | Matched vs. expected |
| FBO balance verification | Monday | Compliance | Signed statement |

### Monthly

| Report | Day | Recipients | Format |
|--------|-----|------------|--------|
| Full reconciliation sign-off | Close | Compliance + accounting | Signed PDF |
| Chargeback ratio report | Close | Stripe (if required) | Stripe dashboard |
| Financial statement inputs | Close | Accountant | Exported ledger |
| FBO escrow statement | Close | Bank | Bank statement |
| GAAP/IFRS reconciliation | Close | Auditor | Working papers |

### Quarterly

| Report | Recipients | Purpose |
|--------|------------|---------|
| Audit trail review | Auditor | Verify internal controls |
| Reconciliation effectiveness | Founders | Process improvement |
| Dispute pattern analysis | Product | System improvements |
| FBO compliance review | Legal | Regulatory compliance |

## Audit Trail Requirements

### What Must Be Recorded

For every financial event:

| Field | Required | Example |
|-------|----------|---------|
| Event ID | Yes | `evt_abc123` (Stripe) or `evt_int_456` (internal) |
| Timestamp | Yes (UTC) | `2026-07-21T03:00:00Z` |
| Event type | Yes | `contract.created`, `payment.succeeded`, `payout.paid` |
| User ID | Yes | `usr_abc123` |
| Contract ID | If applicable | `ctr_def456` |
| Amount (cents) | Yes | `3900` |
| Currency | Yes | `usd` |
| Stripe ID | Yes (if Stripe event) | `pi_abc123`, `txn_def456` |
| Internal ledger entry IDs | Yes | `ledger_ghi789`, `ledger_jkl012` |
| Previous event hash | Yes (hash chain) | `sha256:abc...` |
| Current event hash | Yes | `sha256:def...` |
| Idempotency key | Yes | `idem_abc123` |
| Actor (who triggered) | Yes | `system`, `user:abc`, `admin:xyz` |
| IP address | If user-triggered | `203.0.113.0` |
| User agent | If API-triggered | `Styx-iOS/1.0` |

### Storage Requirements

| Data | Storage Location | Retention | Format |
|------|-----------------|-----------|--------|
| Ledger entries | PostgreSQL (ledger schema) | Permanent (never deleted) | Structured rows |
| Event log | PostgreSQL + R2 archive | 7 years | Structured + JSON |
| Hash chain | PostgreSQL | Permanent | SHA-256 linked list |
| Daily reconciliation reports | R2 | 7 years | JSON (immutable) |
| Monthly reconciliation PDFs | R2 + bank portal | 7 years | PDF |
| Dispute evidence packages | R2 (encrypted) | 5 years | ZIP |
| Stripe API responses | PostgreSQL (webhook log) | 2 years | JSON |
| Payout records | PostgreSQL + bank portal | 7 years | Structured |

### Immutable Ledger Properties

1. **Append-only:** No UPDATE or DELETE on ledger entries — only INSERT
2. **Hash-chained:** Each entry contains hash of previous entry
3. **Cross-referenced:** Every Stripe event maps to ≥2 ledger entries (debit + credit)
4. **Timestamped:** All entries in UTC with nanosecond precision
5. **Signed:** Internal signature on each batch (future: hash-chain published periodically)

### Verification Gate (01 - Phantom Money Check)

The existing validation gate `scripts/validation/01-phantom-money-check.ts` must pass every reconciliation:

```bash
npx tsx scripts/validation/01-phantom-money-check.ts
# Output: "Ledger balanced: true" or "Ledger unbalanced! Diff: $X.XX"
```

This gate is part of the 8-gate validation suite and runs on every deploy, as well as every daily reconciliation.

## Error Handling Procedures

| Scenario | Detection | Immediate Action | Long-Term Fix |
|----------|-----------|-----------------|---------------|
| Ledger out of balance | Daily reconciliation fails | Freeze new contract creation, investigate | Manual corrective entry + root cause analysis |
| Stripe API unresponsive | Reconciliation script fails to query | Retry in 15 min, 3 attempts | Alert if all 3 fail; manual balance check |
| Orphan Stripe charge (no ledger entry) | Unmatched transaction | Create manual ledger entry for the charge | Audit why webhook was missed; improve idempotency |
| Payout mismatch | Payout reconciliation fails | Do not release payout; hold for investigation | Corrective batch entry; inform bank if needed |
| Webhook event missed | Ledger records don't match Stripe history | Manually replay events via Stripe API | Improve webhook reliability (retries, monitoring) |

## Tools & Automation

| Tool | Purpose | Frequency |
|------|---------|-----------|
| `01-phantom-money-check.ts` | Balance reconciliation | Daily + per deploy |
| Stripe API (Balance transactions) | Transaction-level matching | Daily |
| Cron job (Render) | Schedule reconciliation | Daily at 03:00 UTC |
| Slack webhook | Alert on mismatches | Event-driven |
| R2 storage | Archive reconciliation reports | Daily |
| Sentry | Error tracking for reconciliation script | Real-time |
| Pino (structured logging) | Audit trail for reconciliation events | Per-run |

## Key Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Balance discrepancy | $0.00 (any diff triggers alert) | Daily reconciliation |
| Unmatched transactions | < 0.1% of total | Transaction matching ratio |
| Dispute response time | < 24 hours (target: 12 hours) | Webhook → evidence submission |
| Dispute win rate | > 85% | Evidence quality review |
| Payout accuracy | 100% | Bank statement vs. internal record |
| Reconciliation pass rate | > 99% | Historical passes / total runs |
| Audit trail completeness | 100% of financial events recorded | Event log vs. Stripe history |
