---
generated: true
department: FIN
artifact_id: F3
governing_sop: "SOP--financial-planning.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Financial Projections — Styx

## Overview

Three scenarios projected over 24 months from launch. All assume the $39 contract / $9 platform fee consumer model and the Solo/Practice/Enterprise B2B tier structure. Revenue is Monthly Recurring Revenue (MRR) calculated from consumer contract volume and B2B subscriptions.

## Key Assumptions

| Assumption | Value | Source |
|-----------|-------|--------|
| Consumer platform fee | $9.00 per contract | Current pricing |
| Avg contracts/user/month | 0.5 | One contract every 2 months |
| Consumer monthly churn | 5% | Behavioral app benchmarks |
| B2B Solo price | $49/mo | Current pricing |
| B2B Practice price | $199/mo | Current pricing |
| B2B Enterprise price | $999/mo | Current pricing |
| B2B monthly churn | 2.5% | SaaS B2B benchmarks |
| Stripe fee (consumer) | $0.56/contract | 2.9% of $9 + $0.30 |
| Stripe fee (B2B avg) | ~$4.50/mo | Weighted average across tiers |
| B2B tier mix | 60% Solo / 30% Practice / 10% Enterprise | Early-stage skew toward Solo |
| Completion rate | 65% | Commitment device literature |
| Fury auditor cost | $0.35/contract | Protocol-funded from fee pool |

## Scenario 1: Conservative

Organic growth only, no paid acquisition, no press coverage. Word-of-mouth and content marketing.

### User Growth

| Month | Consumer Users | B2B Practitioners | New Consumers/Mo | New B2B/Mo |
|-------|---------------|-------------------|-----------------|-----------|
| M1 | 20 | 0 | 20 | 0 |
| M3 | 50 | 1 | 15 | 0.5 |
| M6 | 100 | 3 | 12 | 0.5 |
| M9 | 200 | 5 | 25 | 0.5 |
| M12 | 500 | 5 | 50 | 0.5 |
| M18 | 1,000 | 10 | 60 | 1 |
| M24 | 2,000 | 20 | 80 | 1.5 |

### Revenue Projections (Conservative)

| Month | Consumer MRR | B2B MRR | Total MRR | Total ARR |
|-------|-------------|---------|-----------|-----------|
| M1 | $90 | $0 | $90 | $1,080 |
| M3 | $225 | $49 | $274 | $3,288 |
| M6 | $450 | $213 | $663 | $7,956 |
| M9 | $900 | $355 | $1,255 | $15,060 |
| M12 | $2,250 | $355 | $2,605 | $31,260 |
| M18 | $4,500 | $770 | $5,270 | $63,240 |
| M24 | $9,000 | $1,730 | $10,730 | $128,760 |

*Consumer MRR = users x 0.5 contracts/mo x $9 net after Stripe*

### Cost Projections (Conservative)

| Month | Infrastructure | Stripe Fees | Support | Marketing | Total Costs | Net |
|-------|---------------|-------------|---------|-----------|-------------|-----|
| M1 | $75 | $10 | $0 | $50 | $135 | -$45 |
| M6 | $75 | $50 | $50 | $100 | $275 | +$388 |
| M12 | $150 | $200 | $100 | $200 | $650 | +$1,955 |
| M18 | $250 | $400 | $200 | $300 | $1,150 | +$4,120 |
| M24 | $400 | $800 | $400 | $500 | $2,100 | +$8,630 |

**Breakeven: Month 4** (at ~60 users, MRR exceeds fixed costs)

### Conservative 24-Month Summary

| Metric | Value |
|--------|-------|
| Total revenue (24 mo) | ~$120,000 |
| Total costs (24 mo) | ~$28,000 |
| Net profit (24 mo) | ~$92,000 |
| Peak MRR | $10,730 |
| Users at M24 | 2,000 consumer + 20 B2B |

## Scenario 2: Base

Moderate paid acquisition ($500-$2,000/mo), blog content, one media mention, early B2B partnerships with 2-3 therapy practices.

### User Growth

| Month | Consumer Users | B2B Practitioners | New Consumers/Mo | New B2B/Mo |
|-------|---------------|-------------------|-----------------|-----------|
| M1 | 50 | 1 | 50 | 1 |
| M3 | 200 | 5 | 60 | 1.5 |
| M6 | 500 | 10 | 70 | 2 |
| M9 | 1,000 | 15 | 100 | 2 |
| M12 | 2,000 | 20 | 150 | 2 |
| M18 | 5,000 | 50 | 250 | 5 |
| M24 | 10,000 | 100 | 400 | 8 |

### Revenue Projections (Base)

| Month | Consumer MRR | B2B MRR | Total MRR | Total ARR |
|-------|-------------|---------|-----------|-----------|
| M1 | $225 | $49 | $274 | $3,288 |
| M3 | $900 | $355 | $1,255 | $15,060 |
| M6 | $2,250 | $770 | $3,020 | $36,240 |
| M9 | $4,500 | $1,213 | $5,713 | $68,556 |
| M12 | $9,000 | $1,730 | $10,730 | $128,760 |
| M18 | $22,500 | $4,905 | $27,405 | $328,860 |
| M24 | $45,000 | $11,390 | $56,390 | $676,680 |

*B2B MRR assumes tier mix: 60% Solo ($49), 30% Practice ($199), 10% Enterprise ($999)*
*Weighted avg B2B MRR/practitioner: $49(0.6) + $199(0.3) + $999(0.1) = $29.40 + $59.70 + $99.90 = $189.00*

### Cost Projections (Base)

| Month | Infrastructure | Stripe Fees | Support | Marketing | Total Costs | Net |
|-------|---------------|-------------|---------|-----------|-------------|-----|
| M1 | $75 | $25 | $0 | $500 | $600 | -$326 |
| M6 | $150 | $250 | $200 | $1,000 | $1,600 | +$1,420 |
| M12 | $400 | $850 | $500 | $2,000 | $3,750 | +$6,980 |
| M18 | $800 | $2,200 | $1,000 | $3,000 | $7,000 | +$20,405 |
| M24 | $1,500 | $4,500 | $2,000 | $5,000 | $13,000 | +$43,390 |

**Breakeven: Month 3** (at ~150 users + 5 B2B, MRR exceeds fixed + variable costs)

### Base 24-Month Summary

| Metric | Value |
|--------|-------|
| Total revenue (24 mo) | ~$680,000 |
| Total costs (24 mo) | ~$140,000 |
| Net profit (24 mo) | ~$540,000 |
| Peak MRR | $56,390 |
| Users at M24 | 10,000 consumer + 100 B2B |

## Scenario 3: Optimistic

Paid acquisition ($2,000-$10,000/mo), major press coverage (TechCrunch, behavioral science publications), early enterprise deal with a rehab network, potential angel investment.

### User Growth

| Month | Consumer Users | B2B Practitioners | New Consumers/Mo | New B2B/Mo |
|-------|---------------|-------------------|-----------------|-----------|
| M1 | 200 | 3 | 200 | 3 |
| M3 | 800 | 10 | 250 | 4 |
| M6 | 2,000 | 25 | 300 | 5 |
| M9 | 5,000 | 40 | 500 | 5 |
| M12 | 10,000 | 50 | 800 | 8 |
| M18 | 25,000 | 200 | 1,500 | 25 |
| M24 | 50,000 | 500 | 2,000 | 40 |

### Revenue Projections (Optimistic)

| Month | Consumer MRR | B2B MRR | Total MRR | Total ARR |
|-------|-------------|---------|-----------|-----------|
| M1 | $900 | $567 | $1,467 | $17,604 |
| M3 | $3,600 | $1,890 | $5,490 | $65,880 |
| M6 | $9,000 | $4,725 | $13,725 | $164,700 |
| M9 | $22,500 | $7,560 | $30,060 | $360,720 |
| M12 | $45,000 | $9,450 | $54,450 | $653,400 |
| M18 | $112,500 | $37,800 | $150,300 | $1,803,600 |
| M24 | $225,000 | $94,500 | $319,500 | $3,834,000 |

### Cost Projections (Optimistic)

| Month | Infrastructure | Stripe Fees | Support | Marketing | Headcount | Total Costs | Net |
|-------|---------------|-------------|---------|-----------|-----------|-------------|-----|
| M1 | $100 | $100 | $0 | $2,000 | $0 | $2,200 | -$733 |
| M6 | $500 | $1,100 | $500 | $5,000 | $0 | $7,100 | +$6,625 |
| M12 | $2,000 | $4,500 | $2,000 | $10,000 | $5,000 | $23,500 | +$30,950 |
| M18 | $5,000 | $12,000 | $5,000 | $15,000 | $15,000 | $52,000 | +$98,300 |
| M24 | $10,000 | $25,000 | $10,000 | $20,000 | $30,000 | $95,000 | +$224,500 |

*Headcount: first hire at M10 (support), second at M14 (engineering), third at M18 (growth)*

**Breakeven: Month 2** (high initial traction covers early costs)

### Optimistic 24-Month Summary

| Metric | Value |
|--------|-------|
| Total revenue (24 mo) | ~$3,800,000 |
| Total costs (24 mo) | ~$750,000 |
| Net profit (24 mo) | ~$3,050,000 |
| Peak MRR | $319,500 |
| Users at M24 | 50,000 consumer + 500 B2B |

## Infrastructure Scaling Triggers

Infrastructure cost steps are not linear. Key triggers:

| Trigger | Current Cost | New Cost | User Threshold |
|---------|-------------|----------|---------------|
| Render Starter → Standard (API) | $7/mo | $25/mo | ~500 concurrent users |
| Render Starter → Standard (Web) | $7/mo | $25/mo | ~1,000 page views/day |
| PostgreSQL Starter → Standard | $7/mo | $50/mo | ~100K rows or 50 connections |
| PostgreSQL Standard → Pro | $50/mo | $200/mo | ~1M rows or 200 connections |
| Redis Starter → Standard | $0/mo | $30/mo | ~1,000 BullMQ jobs/day |
| Add second API instance | $0 | $25/mo | ~2,000 concurrent users |
| CDN (Cloudflare Pro) | $0 | $20/mo | Global user base |

## Breakeven Summary

| Scenario | Breakeven Month | Users at Breakeven | MRR at Breakeven |
|----------|----------------|-------------------|-----------------|
| Conservative | M4 | ~60 consumer | ~$300 |
| Base | M3 | ~150 consumer + 5 B2B | ~$1,200 |
| Optimistic | M2 | ~300 consumer + 5 B2B | ~$2,500 |

The low breakeven point reflects the extremely low fixed cost base (~$75-$100/mo pre-launch). Styx reaches profitability very early because infrastructure costs are minimal until significant scale.

## Sensitivity Analysis

### Revenue Sensitivity to Key Variables

| Variable | -20% | Base | +20% | Impact on M12 MRR |
|----------|------|------|------|-------------------|
| Contract volume/user | 0.4/mo | 0.5/mo | 0.6/mo | -$1,800 / base / +$1,800 |
| Platform fee | $7.20 | $9.00 | $10.80 | -$1,800 / base / +$1,800 |
| Consumer churn | 6%/mo | 5%/mo | 4%/mo | -$2,100 / base / +$2,500 |
| B2B count | 16 | 20 | 24 | -$756 / base / +$756 |

Consumer churn is the most impactful variable. A 1% monthly churn improvement (5% → 4%) adds ~$2,500/mo to M12 MRR in the base case. This underscores the importance of the completion rate — users who succeed at their contracts are far less likely to churn.

### Cost Sensitivity

| Variable | -20% | Base | +20% | Impact on M12 Net |
|----------|------|------|------|-------------------|
| Infrastructure cost | -$80 | $400 | +$80 | +$80 / base / -$80 |
| Marketing spend | -$400 | $2,000 | +$400 | +$400 / base / -$400 |
| Stripe fee rate | 2.3% | 2.9% | 3.5% | +$170 / base / -$170 |

Cost sensitivity is low because variable costs are dominated by Stripe's percentage fee, which scales linearly with revenue. Marketing spend is the primary discretionary lever.

## Milestones

| Milestone | Conservative | Base | Optimistic |
|-----------|-------------|------|-----------|
| First $1K MRR | M9 | M3 | M1 |
| First $10K MRR | M24 | M12 | M6 |
| First $50K MRR | Beyond M24 | M22 | M12 |
| First $100K MRR | Beyond M24 | Beyond M24 | M16 |
| 1,000 consumers | M18 | M9 | M4 |
| 10,000 consumers | Beyond M24 | M24 | M12 |
| 50 B2B practitioners | Beyond M24 | M18 | M9 |
