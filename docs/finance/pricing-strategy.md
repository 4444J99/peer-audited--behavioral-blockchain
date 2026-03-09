---
generated: true
department: FIN
artifact_id: F2
governing_sop: "SOP--pricing-strategy.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Pricing Strategy — Styx

## Overview

Styx pricing is designed around a core behavioral economics insight: the fee must feel trivially small relative to the stake, so the user's attention stays focused on the commitment rather than the cost of the platform. Loss aversion (λ=1.955) means users psychologically weight the $39 stake as ~$76 of potential loss — the $9 fee is perceived as roughly 12% of the felt cost, well below the pain threshold.

## Consumer Pricing

### Current Model

| Component | Amount | Timing | Refundable |
|-----------|--------|--------|------------|
| Behavioral contract stake | $39.00 | At contract creation | Yes, on completion |
| Platform fee | $9.00 | At contract creation | No |

The $39/$9 price point was chosen through the following reasoning:

1. **Stake magnitude:** $39 is large enough to trigger loss aversion but small enough to not require serious financial deliberation. Research on commitment devices (Kahneman & Tversky, Gneezy & Rustichini) suggests stakes between $20-$50 hit the sweet spot for recurring behavioral contracts.
2. **Fee ratio:** 23% of stake ($9/$39). Users anchor on the stake, not the fee. Competitive commitment device apps charge 0-15% but offer no peer audit infrastructure.
3. **Round numbers avoided:** $39 and $9 use charm pricing. A $40/$10 pair would feel rounder and more "fee-like."

### Future Variable Contract Sizing

| Contract Tier | Stake Range | Platform Fee | Fee % |
|---------------|-------------|-------------|-------|
| Starter | $19-$39 | $5-$9 | 23-26% |
| Standard | $39-$99 | $9-$19 | 19-23% |
| High-Stakes | $99-$499 | $19-$49 | 10-19% |
| Premium | $499-$2,000 | $49-$99 | 5-10% |

Fee percentage decreases as stake increases — this is intentional. Higher-stake users have stronger loss aversion signals and require less platform-side incentive design. The lower fee percentage also reduces price sensitivity for users making serious commitments (addiction recovery, major life changes).

### Loss Aversion Psychology in Pricing

The λ=1.955 coefficient means:

- A $39 stake feels like losing ~$76
- A $9 fee feels like losing ~$18
- Total perceived cost to the user: ~$94 for a $48 actual outlay
- But the user frames it as "I get $39 back if I succeed" — so the perceived net cost is just the fee

This framing is critical. Styx marketing always emphasizes "you only lose money if you quit" — the fee fades into the background of the commitment narrative.

## B2B Practitioner Pricing

### Tier Structure

| Feature | Solo ($49/mo) | Practice ($199/mo) | Enterprise ($999+/mo) |
|---------|:---:|:---:|:---:|
| Client limit | 10 | 50 | Unlimited |
| Dashboard access | Basic | Full | Full + custom |
| Contract templates | 5 standard | 20 + custom | Unlimited custom |
| Analytics | Summary stats | Detailed trends | Data lake + exports |
| Compliance reporting | — | Standard | SOC 2, custom |
| SSO/SAML | — | — | Yes |
| Webhook integrations | — | 3 endpoints | Unlimited |
| API access | — | Read-only | Full CRUD |
| Dedicated support | Email (48h) | Email (24h) | Slack channel (4h) |
| White-label option | — | — | Add-on ($500/mo) |
| Client data export | CSV | CSV + JSON | CSV + JSON + Parquet |

### Tier Design Rationale

**Solo ($49/mo):** Entry point for individual therapists, coaches, and counselors exploring behavioral contracts as a clinical tool. The 10-client limit matches a typical caseload for someone adding Styx as a supplementary tool. Price point is below the "needs approval" threshold for most independent practitioners.

**Practice ($199/mo):** For established practices with multiple clinicians or a solo practitioner who has made behavioral contracts a core modality. The jump from $49 to $199 is steep intentionally — it filters for practitioners with genuine adoption, not tire-kickers. Custom contract templates unlock clinical-specific oath categories (substance recovery, eating disorders, physical rehabilitation).

**Enterprise ($999+/mo):** For organizations: rehab centers, corporate wellness programs, insurance-affiliated behavioral health providers. SSO and data lake access are table stakes for enterprise procurement. The "+" indicates negotiated pricing above $999 for large deployments.

### B2B Pricing Anchoring

The B2B price is anchored against the value delivered per client:

| Tier | Price | Client Limit | Price/Client/Mo | Value Created/Client/Mo |
|------|-------|-------------|-----------------|------------------------|
| Solo | $49 | 10 | $4.90 | ~$50 (improved outcomes, reduced no-shows) |
| Practice | $199 | 50 | $3.98 | ~$50 |
| Enterprise | $999 | Unlimited (est. 200) | $5.00 | ~$50 |

At ~$5/client/month, the practitioner pays roughly 10% of the value Styx delivers through improved client follow-through. This 10:1 value ratio is well within enterprise SaaS norms.

## Competitive Analysis

### Direct Competitors (Commitment Devices)

| Platform | Model | Stake Range | Fee | Peer Audit | Blockchain |
|----------|-------|-------------|-----|:---:|:---:|
| **Styx** | Platform fee + stake | $19-$2,000 | $5-$99 | Yes (Fury) | Yes (double-entry) |
| Beeminder | Pledge escalation | $5-$2,430 | Free tier + pledges | No (self-report) | No |
| StickK | Referee + charity | $5-$5,000+ | Free (charity model) | Partial (referee) | No |
| Pact (defunct) | Peer wagering | $5-$50/wk | Revenue from failures | No | No |

### Key Differentiators

1. **Fury audit network:** Beeminder and StickK rely on self-reporting or a single referee. Styx routes audits through a decentralized pool with stake-and-bounty incentives, making cheating economically irrational.
2. **Double-entry ledger:** Every dollar movement is recorded as a debit-credit pair. No phantom money. Auditable to the cent.
3. **B2B channel:** Neither Beeminder nor StickK offers practitioner tooling. Styx is the only commitment device with a clinical/coaching integration layer.
4. **Hardware oracle pathway:** Future integration with wearables (Apple Health, Fitbit, Oura) as proof sources removes human audit for biometric-verifiable habits.

### Indirect Competitors (Habit Apps)

| App | Monthly Price | Mechanism | Completion Rate |
|-----|--------------|-----------|----------------|
| Habitica | Free / $4.99 | Gamification | ~30% |
| Streaks | $4.99 (one-time) | Streak tracking | ~25% |
| Coach.me | Free / $25/wk (coaching) | Social + coaching | ~40% |
| **Styx** | $9/contract | Financial loss aversion | ~65% (projected) |

Styx's projected 65% completion rate comes from commitment device literature showing 2-3x improvement over gamification-only approaches when real money is at stake.

## Price Sensitivity Analysis

### Consumer Price Sensitivity

The relationship between stake size and behavior follows a curve:

| Stake | Perceived Loss (λ=1.955) | Completion Rate (est.) | Barrier to Entry |
|-------|--------------------------|----------------------|-----------------|
| $10 | $19.55 | 45% | Very low |
| $25 | $48.88 | 55% | Low |
| $39 | $76.25 | 65% | Moderate |
| $75 | $146.63 | 75% | High |
| $150 | $293.25 | 82% | Very high |
| $500 | $977.50 | 90% | Extreme |

The sweet spot is $25-$75: high enough to trigger genuine loss aversion, low enough to not deter first-time users. The $39 default sits in the center of this range.

### Fee Elasticity

Consumer willingness to pay the platform fee decreases sharply above 25% of stake:

| Fee as % of Stake | Conversion Impact (est.) |
|-------------------|------------------------|
| 10% | Baseline |
| 15% | -5% conversion |
| 20% | -12% conversion |
| 23% (current) | -18% conversion |
| 30% | -35% conversion |
| 50% | -70% conversion |

At 23%, Styx is near the upper bound of acceptable fee ratio. As contract sizes scale up, the percentage must decrease (see variable contract sizing above).

## Future Pricing Levers

### Premium Oath Categories

Specialized contract types with enhanced verification:

| Category | Additional Fee | Features |
|----------|---------------|----------|
| Recovery Protocol | +$5 | Multi-phase contracts, sponsor integration, crisis routing |
| Fitness Verified | +$3 | Wearable oracle integration, biometric proof |
| Financial Discipline | +$3 | Bank API integration, spending verification |
| Creative Commitment | +$2 | Deliverable upload + peer review |

### Faster Fury Routing

| Speed Tier | Additional Fee | Audit SLA |
|-----------|---------------|-----------|
| Standard | Included | 24-48 hours |
| Priority | +$2 | 4-8 hours |
| Instant | +$5 | < 1 hour |

### Enhanced Analytics (Consumer)

| Feature | Price | Description |
|---------|-------|-------------|
| Streak analytics | Free | Basic completion history |
| Behavioral insights | $3/mo | Loss aversion profile, optimal stake recommendations |
| Progress reports | $5/mo | Exportable reports for therapists, coaches, or personal records |

### White-Label (Enterprise Add-On)

| Component | Monthly Add-On |
|-----------|---------------|
| Custom domain | +$200 |
| Branded UI | +$300 |
| Custom oath categories | +$200 |
| Full white-label | +$500 (bundle) |

## Pricing Governance

- All price changes require 30-day advance notice to existing users
- B2B contracts lock pricing for the contract term (annual = 12-month price lock)
- Fury bounty rates are protocol parameters, adjusted quarterly based on audit volume and accuracy metrics
- Platform fee and stake defaults are reviewed semi-annually against completion rate data and competitive landscape
