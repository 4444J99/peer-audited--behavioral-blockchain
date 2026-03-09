---
generated: true
department: FIN
artifact_id: F1
governing_sop: "SOP--business-organism-design.md"
phase: genesis
product: styx
date: "2026-03-08"
---

# Unit Economics — Styx

## Overview

Styx operates a dual-revenue model: consumer behavioral contracts (B2C) and practitioner subscriptions (B2B). This document breaks down the per-unit economics of each revenue stream, Fury auditor incentives, and blended margin scenarios.

## Consumer Unit Economics

### Per-Contract Revenue Breakdown

| Line Item | Amount | Notes |
|-----------|--------|-------|
| Contract stake | $39.00 | Held in Stripe FBO escrow |
| Platform fee | $9.00 | Non-refundable, collected at contract creation |
| Stripe processing (fee) | -$0.56 | 2.9% of $9.00 + $0.30 |
| Stripe processing (stake capture) | -$1.43 | 2.9% of $39.00 + $0.30 (on forfeiture) |
| **Net platform revenue (contract completed)** | **$8.44** | Stake returned to user; only fee processed |
| **Net platform revenue (contract forfeited)** | **$7.01** | Both fee and stake processed through Stripe |

### Per-Contract Cost Breakdown

| Cost Category | Estimated Cost | Basis |
|---------------|---------------|-------|
| Compute (Fury routing) | $0.02 | BullMQ job processing, ~50ms average |
| R2 storage (proof media) | $0.005 | ~2MB average proof, $0.015/GB/mo, 30-day retention |
| PostgreSQL (ledger writes) | $0.001 | Double-entry: 4-6 rows per contract lifecycle |
| Redis (queue + cache) | $0.001 | Fury job metadata, session cache |
| Support allocation | $0.10 | Estimated 2% of contracts need support, $5/ticket |
| **Total variable cost** | **~$0.13** | |

### Per-Contract Contribution Margin

| Scenario | Revenue | Variable Cost | Contribution | Margin |
|----------|---------|---------------|-------------|--------|
| Contract completed (stake returned) | $8.44 | $0.13 | $8.31 | 98.5% |
| Contract forfeited (stake captured) | $7.01 | $0.13 | $6.88 | 98.1% |
| Blended (est. 65% completion rate) | $7.94 | $0.13 | $7.81 | 98.4% |

The high contribution margin reflects the asset-light nature of the platform — Stripe handles escrow custody, Render handles compute, and peer auditors (Furies) are incentivized through the protocol itself rather than payroll.

## B2B Practitioner Unit Economics

### Per-Tier Revenue Breakdown

| Tier | Monthly Price | Stripe Fee (2.9% + $0.30) | Net Revenue | Client Limit |
|------|--------------|---------------------------|-------------|-------------|
| Solo | $49.00 | $1.72 | $47.28 | 10 clients |
| Practice | $199.00 | $6.07 | $192.93 | 50 clients |
| Enterprise | $999.00 | $29.27 | $969.73 | Unlimited |

### Per-Tier Cost Breakdown

| Cost Category | Solo | Practice | Enterprise |
|---------------|------|----------|-----------|
| Infrastructure (proportional) | $2.00 | $8.00 | $25.00 |
| Dashboard compute | $0.50 | $2.00 | $10.00 |
| Analytics pipeline | $0.25 | $1.50 | $8.00 |
| Data lake storage | — | — | $5.00 |
| SSO/IdP integration | — | — | $3.00 |
| Support allocation | $1.00 | $4.00 | $15.00 |
| **Total variable cost** | **$3.75** | **$15.50** | **$66.00** |

### Per-Tier Contribution Margin

| Tier | Net Revenue | Variable Cost | Contribution | Margin |
|------|-------------|---------------|-------------|--------|
| Solo | $47.28 | $3.75 | $43.53 | 92.1% |
| Practice | $192.93 | $15.50 | $177.43 | 92.0% |
| Enterprise | $969.73 | $66.00 | $903.73 | 93.2% |

### Revenue Per Client Served

| Tier | Monthly Net | Client Limit | Revenue/Client | At 50% Utilization |
|------|-------------|-------------|----------------|-------------------|
| Solo | $47.28 | 10 | $4.73 | $9.46 |
| Practice | $192.93 | 50 | $3.86 | $7.72 |
| Enterprise | $969.73 | Unlimited | Diminishes with scale | — |

Practice tier offers the best per-client economics for Styx when practitioners fill their roster. Enterprise value comes from SSO, data lake access, and webhook integrations rather than per-client pricing.

## CAC vs LTV Analysis

### Consumer

| Metric | Estimate | Basis |
|--------|----------|-------|
| CAC (organic) | $5.00 | Content marketing, SEO, word-of-mouth |
| CAC (paid) | $15.00 | Social ads targeting self-improvement audiences |
| Avg contracts/user/year | 6 | One contract every 2 months |
| Annual revenue/user | $50.64 | 6 contracts x $8.44 net |
| Churn rate (annual) | 60% | Behavioral apps have high natural churn |
| LTV | $84.40 | $50.64 / 0.60 |
| LTV:CAC (organic) | 16.9x | Healthy |
| LTV:CAC (paid) | 5.6x | Acceptable for paid acquisition |

### B2B Practitioner

| Metric | Solo | Practice | Enterprise |
|--------|------|----------|-----------|
| CAC | $200 | $500 | $2,000 |
| Monthly contribution | $43.53 | $177.43 | $903.73 |
| Annual contribution | $522.36 | $2,129.16 | $10,844.76 |
| Churn rate (annual) | 30% | 20% | 10% |
| LTV | $1,741.20 | $10,645.80 | $108,447.60 |
| LTV:CAC | 8.7x | 21.3x | 54.2x |

## Fury Auditor Economics

The Fury network operates on a stake-and-bounty model. Auditors are not employees — they are protocol participants incentivized by the contract terms.

| Parameter | Value | Notes |
|-----------|-------|-------|
| Auditor stake per audit | $2.00 | Locked during audit period |
| Bounty (correct audit, forfeiture) | $1.50 | Paid from forfeited stake pool |
| Bounty (correct audit, completion) | $0.50 | Paid from platform fee pool |
| False accusation penalty | 3x stake ($6.00) | Deducted from auditor's deposited balance |
| Accuracy threshold | 85% | Below this, auditor is suspended from Fury queue |

### Auditor P&L Per Audit

| Outcome | Revenue | Cost (stake) | Net | Probability (est.) |
|---------|---------|-------------|-----|-------------------|
| Correct audit — forfeiture | $1.50 | $2.00 (returned) | +$1.50 | 30% |
| Correct audit — completion | $0.50 | $2.00 (returned) | +$0.50 | 60% |
| False accusation | -$6.00 | $2.00 (forfeited) | -$8.00 | 5% |
| Inconclusive / no action | $0.00 | $2.00 (returned) | $0.00 | 5% |

**Expected value per audit:** (0.30 x $1.50) + (0.60 x $0.50) + (0.05 x -$8.00) + (0.05 x $0.00) = $0.45 + $0.30 - $0.40 = **$0.35**

The 3x penalty for false accusations is calibrated to make honest auditing strictly dominant. An auditor with >85% accuracy earns a positive expected return; below 85%, expected value turns negative and the protocol suspends them.

## Blended Margin Analysis

### Scenario A: Consumer-Heavy (90/10 Revenue Split)

| Source | Revenue Share | Contribution Margin | Weighted Margin |
|--------|-------------|--------------------|-----------------|
| Consumer | 90% | 98.4% | 88.6% |
| B2B | 10% | 92.0% | 9.2% |
| **Blended** | | | **97.8%** |

### Scenario B: Balanced (60/40 Revenue Split)

| Source | Revenue Share | Contribution Margin | Weighted Margin |
|--------|-------------|--------------------|-----------------|
| Consumer | 60% | 98.4% | 59.0% |
| B2B | 40% | 92.5% | 37.0% |
| **Blended** | | | **96.0%** |

### Scenario C: B2B-Heavy (30/70 Revenue Split)

| Source | Revenue Share | Contribution Margin | Weighted Margin |
|--------|-------------|--------------------|-----------------|
| Consumer | 30% | 98.4% | 29.5% |
| B2B | 70% | 92.5% | 64.8% |
| **Blended** | | | **94.3%** |

All scenarios maintain margins above 90%. The B2B-heavy scenario is preferable despite slightly lower blended margin because B2B revenue is more predictable (subscriptions vs per-contract) and carries lower churn.

## Key Assumptions

1. Stripe FBO escrow does not charge holding fees (confirmed for standard Stripe Connect)
2. Completion rate of 65% is based on behavioral economics literature for commitment devices with financial stakes
3. R2 storage costs assume proof media cleanup after 90-day contract expiry
4. Support cost assumes automated resolution for 80%+ of issues via in-app flows
5. Loss aversion multiplier (λ=1.955) means users perceive the $39 stake as ~$76 in potential loss, making the $9 fee feel proportionally small

## Revision Triggers

- Recalculate when: Stripe fee structure changes, Render pricing changes, contract size becomes variable, Fury bounty rates are adjusted
- Review quarterly against actual contract volume and completion rates
