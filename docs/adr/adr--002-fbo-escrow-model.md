# ADR-002: FBO Escrow Model (Stripe For Benefit Of)

## Status

Accepted

## Context

Styx requires users to stake real money on behavioral contracts. The platform must hold these funds during the contract period and release them based on audit outcomes. This creates a critical design question: how does Styx custody user funds without becoming a money transmitter or taking on direct fiduciary liability?

Three escrow models were evaluated:
1. **Direct custody** — Styx holds funds in its own bank account
2. **Smart contract escrow** — on-chain escrow via Ethereum/Solana
3. **FBO (For Benefit Of)** — Stripe holds funds on behalf of individual users

## Decision

We use **Stripe FBO escrow** with a hold/capture/cancel lifecycle:

```
User stakes $100 → Stripe creates PaymentIntent (hold)
                    ↓
              Contract period runs
                    ↓
    Fury auditors reach consensus
                    ↓
  ┌─────────────────┴─────────────────┐
  Pass → capture() releases           Fail → capture() transfers
         hold back to user                   stake to platform revenue
         (minus platform fee)                + auditor bounties
  │                                    │
  └─ Cancel path: grace period         └─ Dispute path: appeal window
     expires without proof submission       before final settlement
```

**Implementation**: `src/api/services/escrow/stripe.service.ts` handles hold/capture/cancel. `src/api/src/modules/payments/stripe-fbo.service.ts` manages the FBO-specific lifecycle. `src/api/src/modules/payments/settlement.service.ts` orchestrates the final distribution.

## Consequences

**Positive:**
- Styx never has direct custody of user funds — Stripe is the regulated entity
- Reduces money transmitter licensing burden (Stripe handles compliance)
- PaymentIntent lifecycle maps cleanly to contract lifecycle (hold → audit → capture/cancel)
- Built-in dispute resolution via Stripe's dispute API
- PCI compliance delegated to Stripe

**Negative:**
- Stripe fees reduce margins on small stakes (significant at $5-$20 micro-stakes)
- Platform is dependent on Stripe's risk appetite — high-risk merchant classification is possible
- Hold expiration window (7 days default) must align with contract durations
- FBO model limits some flexibility vs. direct custody (e.g., partial captures require careful orchestration)

## Alternatives Considered

1. **Direct custody** — rejected due to money transmitter licensing requirements in 49+ US states. Compliance cost would exceed early-stage revenue.

2. **Smart contract escrow** — rejected for beta phase. Gas fees make micro-stakes ($5-$20) uneconomical. User onboarding friction (wallet setup) conflicts with mainstream audience goal. Remains a future option for decentralized mode.

3. **Hybrid (Stripe + on-chain)** — deferred. Plan is to add on-chain escrow as an alternative for crypto-native users post-beta, while maintaining Stripe FBO as default.

## Related

- ADR-001: Dual-layer architecture separates escrow domain logic from HTTP/payment webhooks
- `src/api/services/escrow/dispute.service.ts`: Dispute handling
- `src/api/src/modules/payments/settlement.worker.ts`: Background settlement processing
- Validation gate 01 (`scripts/validation/01-phantom-money-check.ts`): Ensures no unbalanced ledger entries from escrow operations
