---
generated: true
department: FIN
artifact_id: F5
governing_sop: "SOP--financial-planning.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Runway Tracker — Styx

## Overview

Styx is pre-launch with zero revenue. This document tracks monthly burn rate, categorizes costs, projects runway under various funding scenarios, and identifies scaling cost triggers that will change the burn profile.

## Current Monthly Burn Rate

### Fixed Costs (Pre-Launch)

| Category | Service | Monthly Cost | Annual Cost | Notes |
|----------|---------|-------------|-------------|-------|
| **Infrastructure** | | | | |
| | Render — API (Starter) | $7.00 | $84.00 | styx-api, Oregon region |
| | Render — Web (Starter) | $7.00 | $84.00 | styx-web, Oregon region |
| | Render — PostgreSQL (Starter) | $7.00 | $84.00 | styx-postgres, 1GB storage |
| | Render — Redis (Free) | $0.00 | $0.00 | styx-redis, 25MB |
| | Cloudflare R2 (Free tier) | $0.00 | $0.00 | 10GB storage, 1M Class B ops |
| | Domain (styx.app or similar) | $3.00 | $36.00 | Estimated, varies by registrar |
| **Services** | | | | |
| | Stripe (no monthly fee) | $0.00 | $0.00 | Transaction fees only |
| | Sentry (Developer, free) | $0.00 | $0.00 | 5K events/mo |
| | GitHub (Free) | $0.00 | $0.00 | Public repos, Actions minutes |
| | GitHub Actions (overage est.) | $5.00 | $60.00 | 7 workflows, may exceed free tier |
| **Development** | | | | |
| | Claude Code (Pro) | $20.00 | $240.00 | Primary development tool |
| | Cursor / IDE | $0.00 | $0.00 | Free tier or included |
| **Legal** | | | | |
| | LLC maintenance | $0.00 | $100.00 | Annual filing fee, amortized |
| | | | | |
| **TOTAL** | | **$49.00** | **$688.00** | |

### Variable Costs (Pre-Launch)

All zero until launch. Variable costs are transaction-linked:
- Stripe processing: $0 (no transactions)
- R2 overage: $0 (no proof uploads)
- Support: $0 (no users)

### Current Burn Rate

| Metric | Value |
|--------|-------|
| Monthly burn (fixed) | ~$49 |
| Monthly burn (variable) | $0 |
| **Total monthly burn** | **~$49** |

## Revenue

| Month | Consumer MRR | B2B MRR | Total MRR |
|-------|-------------|---------|-----------|
| Current (pre-launch) | $0 | $0 | $0 |

## Runway Calculation

### Formula

```
Runway (months) = Available Cash / (Monthly Burn - Monthly Revenue)
```

### Scenarios

| Available Cash | Monthly Burn | Monthly Revenue | Net Burn | Runway |
|---------------|-------------|----------------|----------|--------|
| $500 | $49 | $0 | $49 | 10.2 months |
| $1,000 | $49 | $0 | $49 | 20.4 months |
| $2,500 | $49 | $0 | $49 | 51 months |
| $5,000 | $75 | $0 | $75 | 66 months |
| $5,000 | $75 | $500 | -$425 | Infinite (profitable) |

At current burn rate, even $500 in reserve provides 10+ months of runway. The infrastructure-light approach (Render starter plans, free tiers) keeps pre-launch costs near $50/mo.

## Cost Category Breakdown

### Infrastructure (~70% of pre-launch burn)

| Service | Monthly | % of Burn | Scaling Trigger |
|---------|---------|-----------|----------------|
| Render API | $7 | 14% | >500 concurrent connections |
| Render Web | $7 | 14% | >1,000 daily page views |
| Render PostgreSQL | $7 | 14% | >1GB storage or 50 connections |
| Render Redis | $0 | 0% | >25MB memory |
| Cloudflare R2 | $0 | 0% | >10GB storage |
| Domain | $3 | 6% | Fixed |
| **Subtotal** | **$24** | **49%** | |

### Services (~10% of pre-launch burn)

| Service | Monthly | % of Burn | Scaling Trigger |
|---------|---------|-----------|----------------|
| GitHub Actions | $5 | 10% | >2,000 CI minutes/mo |
| Stripe | $0 | 0% | Transaction volume |
| Sentry | $0 | 0% | >5K events/mo |
| **Subtotal** | **$5** | **10%** | |

### Development (~41% of pre-launch burn)

| Tool | Monthly | % of Burn | Notes |
|------|---------|-----------|-------|
| Claude Code Pro | $20 | 41% | Core development tool |
| **Subtotal** | **$20** | **41%** | |

## Scaling Cost Triggers

These are the cost step-functions that will change the burn rate as Styx grows:

### Tier 1: Early Launch (0-500 users)

No changes needed. Free/Starter tiers handle this load.

| Change | Trigger | New Monthly Cost | Delta |
|--------|---------|-----------------|-------|
| None | — | $49 | $0 |

### Tier 2: Traction (500-2,000 users)

| Change | Trigger | New Monthly Cost | Delta |
|--------|---------|-----------------|-------|
| Render API → Standard | 500 concurrent | $25 | +$18 |
| Render Web → Standard | 1K daily PV | $25 | +$18 |
| Render PostgreSQL → Standard | 1GB / 50 conn | $50 | +$43 |
| Sentry → Team | 5K events/mo | $26 | +$26 |
| **New total** | | **$154** | **+$105** |

### Tier 3: Growth (2,000-10,000 users)

| Change | Trigger | New Monthly Cost | Delta |
|--------|---------|-----------------|-------|
| Render Redis → Standard | 25MB memory | $30 | +$30 |
| Render PostgreSQL → Pro | 1M rows / 200 conn | $200 | +$150 |
| Add 2nd API instance | 2K concurrent | $25 | +$25 |
| Cloudflare R2 (paid) | 10GB storage | $15 | +$15 |
| UptimeRobot Pro | Monitoring | $7 | +$7 |
| **New total** | | **$381** | **+$227** |

### Tier 4: Scale (10,000+ users)

| Change | Trigger | New Monthly Cost | Delta |
|--------|---------|-----------------|-------|
| Render API → Pro | Autoscaling | $85 | +$60 |
| Render Web → Pro | CDN + edge | $85 | +$60 |
| PostgreSQL → dedicated | 10M rows | $500 | +$300 |
| Redis → Pro | Queue depth | $100 | +$70 |
| First hire (support) | Ticket volume | $3,000-$5,000 | +$3,000+ |
| **New total** | | **$4,000+** | **+$3,500+** |

## Monthly Tracking Template

Copy and fill this table each month:

| Month | Infrastructure | Services | Development | Marketing | Support | Headcount | Total Burn | Revenue | Net Burn | Cash Balance | Runway (mo) |
|-------|---------------|----------|-------------|-----------|---------|-----------|------------|---------|----------|-------------|-------------|
| 2026-03 | $24 | $5 | $20 | $0 | $0 | $0 | $49 | $0 | $49 | — | — |
| 2026-04 | | | | | | | | | | | |
| 2026-05 | | | | | | | | | | | |
| 2026-06 | | | | | | | | | | | |
| 2026-07 | | | | | | | | | | | |
| 2026-08 | | | | | | | | | | | |
| 2026-09 | | | | | | | | | | | |
| 2026-10 | | | | | | | | | | | |
| 2026-11 | | | | | | | | | | | |
| 2026-12 | | | | | | | | | | | |
| 2027-01 | | | | | | | | | | | |
| 2027-02 | | | | | | | | | | | |

## Cost Optimization Levers

If runway becomes constrained:

| Action | Monthly Savings | Impact |
|--------|----------------|--------|
| Downgrade Render API to free (if <100 req/day) | $7 | Slower cold starts |
| Downgrade Render Web to static hosting | $7 | No SSR |
| Use Supabase free tier instead of Render PG | $7 | 500MB limit, different API |
| Self-host Redis on API instance | $0-$30 | Complexity, no managed failover |
| Move to Fly.io (free tier) | $14-$21 | Migration effort, different deploy model |
| Pause CI to manual-only | $5 | Slower feedback loop |
| **Maximum pre-launch savings** | **~$35** | Burn drops to ~$14/mo |

## Key Dates

| Date | Event | Cost Impact |
|------|-------|-------------|
| TBD | Beta launch | Variable costs begin (Stripe, R2) |
| TBD | Public launch | Marketing spend begins |
| TBD | First B2B customer | Revenue begins |
| TBD | 500 user milestone | Infrastructure Tier 2 upgrade |
| TBD | First hire | +$3,000-$5,000/mo |

## Notes

- All costs in USD
- Stripe has no monthly fee; costs are purely transactional (2.9% + $0.30)
- Render starter plan includes auto-sleep after 15 minutes of inactivity — acceptable for pre-launch, not for production
- R2 free tier (10GB, 1M Class B ops/mo) is generous; unlikely to exceed pre-launch
- Claude Code Pro subscription is classified as development, not infrastructure — it is the primary code generation tool for the solo founder
