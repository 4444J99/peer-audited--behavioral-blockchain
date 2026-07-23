# Appendix A: FBO Architecture Diagram

This appendix provides the visual fund flow architecture for the Styx Real-Money Rails using Stripe For-Benefit-Of (FBO) accounts.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Participant
    participant Stripe as Stripe API / Escrow
    participant FBO as FBO Escrow Account
    participant Pool as Settlement Pool

    User->>Stripe: 1. Authorize Stake / Hold (POST /subscribe)
    Stripe->>FBO: 2. Lock Stake in FBO Escrow
    Note over FBO: Funds held off-balance-sheet<br/>per FBO Escrow Agreement
    
    alt Dispute Resolved - Verified / Succeeded
        FBO->>User: 3a. Return Stake + Bounty Yield
    else Dispute Resolved - Failed / Forfeited
        FBO->>Pool: 3b. Transfer Forfeited Stake to Pool
    end
```

## Flow Description

1. **Stake Authorization**: User initiates a contract stake via the Stripe API integration (`@styx/api`).
2. **FBO Escrow Lock**: Funds are held off-balance-sheet in an FBO account, preventing proprietary commingling.
3. **Settlement**: Upon consensus verification, the settlement worker releases funds back to the user or transfers forfeited amounts to the designated pool.
