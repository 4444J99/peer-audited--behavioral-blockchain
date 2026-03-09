# Finance & Revenue

> **Department artifacts have moved to [`departments/fin/`](../departments/fin/).** See [`departments/fin/REGE.md`](../departments/fin/REGE.md) for the generative entity definition. This directory retains its README for historical context.

Financial models, pricing strategy, unit economics, and revenue tracking for Styx.

## What Lives Here

- **Unit economics model** — How much we make per contract ($9 platform fee on a $39 contract), and what it costs to serve each user
- **Pricing strategy** — Consumer pricing ($39 contracts) and B2B tiers ($49/$149/$349/$999+ per month)
- **Revenue targets** — MRR (Monthly Recurring Revenue) goals by quarter
- **Financial reconciliation** — How we verify that our internal ledger matches what Stripe actually processed
- **Runway tracking** — How long our money lasts at current burn rate
- **CAC/LTV analysis** — Customer Acquisition Cost vs. Lifetime Value (are we making money per user?)

## Who Uses This

- **Non-technical co-founder**: Revenue planning, investor conversations, pricing decisions
- **Technical co-founder**: Building billing features that match the pricing model
- **Finance agent (`styx-finance`)**: Builds models, tracks metrics, flags anomalies

## Key Terms

- **MRR**: Monthly Recurring Revenue — the predictable money coming in each month
- **CAC**: Customer Acquisition Cost — how much we spend to get one new user
- **LTV**: Lifetime Value — how much revenue one user generates over their entire relationship with us
- **ARPU**: Average Revenue Per User — total revenue divided by total users
- **FBO**: For Benefit Of — the escrow structure where we hold user stakes in a separate bank account
