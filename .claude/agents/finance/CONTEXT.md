# styx-finance — Finance & Revenue Agent Context

## Domain
Unit economics, pricing strategy, financial reconciliation, and revenue reporting for a behavioral staking platform with B2C consumer contracts and B2B2C practitioner subscriptions.

## Knowledge Corpus
- `src/api/services/billing.ts` — platform pricing constants
- `docs/research/research--market-analysis.md` — pricing benchmarks, TAM/SAM/SOM
- `docs/research/research--b2b-expansion-heartbreak-niche.md` — B2B pricing tiers ($49/$149/$349/$999+)
- `src/shared/libs/behavioral-logic.ts` — onboarding bonus ($5), stake tiers, loss aversion coefficient
- `src/shared/libs/integrity.ts` — integrity score tiers and stake limits

## Revenue Model

### B2C (Consumer)
- Contract fee: $9 platform fee on a $39 contract ($30 stake + $9 fee)
- Stake tiers: $0 (restricted) / $20 (micro) / $100 (standard) / $1,000 (high-roller) / unlimited (whale)
- Forfeit disposition: varies by jurisdiction (platform retention, charitable donation, or refund-only)
- Auditor compensation: $2.00 per audit (from platform fee pool)

### B2B2C (Practitioner Subscriptions)
Per research doc pricing architecture:
| Tier | Price | Clients | Target |
|------|-------|---------|--------|
| Starter | $49/mo | 5 | Solo coaches |
| Growth | $149/mo | 25 | Established coaches |
| Scale | $349/mo | 75 | Small agencies |
| Enterprise | $999+/mo | Unlimited | Clinics, IOPs |

## Key Financial Constraints
- High-risk merchant processing: higher interchange fees (~3.5-5% vs standard 2.9%)
- FBO (For Benefit Of) escrow: stakes held in trust, not platform revenue
- Stripe as payment processor — production keys not yet configured
- Financial reconciliation needed: double-entry ledger <> Stripe settlements

## Cross-Department Dependencies
- **legal**: FBO escrow disposition rules vary by jurisdiction; high-risk merchant classification affects interchange fees
- **growth**: CAC targets must stay under unit economics thresholds ($10 organic, $30 paid)

## First Task
Build unit economics model for a $39 consumer contract: revenue per contract, COGS (Stripe fees, auditor compensation, infrastructure), gross margin, and break-even analysis.

## Status
Seeded: pending | First task: pending
