# Aegis / Tier System Reconciliation

## Overview

Styx has two parallel safety systems that govern contract creation:

1. **Integrity Tier System** — progressive trust tiers based on integrity score
2. **Aegis Health Protocol** — medical safety gates for biological oaths

These systems interact as layered gates: a contract must pass **both** to be created.

## Tier System (Integrity Score)

| Tier | Score Range | Max Stake (cents) |
|------|-------------|-------------------|
| RESTRICTED_MODE | < 20 | 0 (no contracts) |
| TIER_1_MICRO_STAKES | 20–49 | 2,000 |
| TIER_2_STANDARD | 50–99 | 10,000 |
| TIER_3_HIGH_ROLLER | 100–499 | 100,000 |
| TIER_4_WHALE_VAULTS | >= 500 | Unlimited* |

*\*"Unlimited" is subject to the Aegis ceiling — see below.*

## Aegis Protocol

Aegis is the **final safety gate** that overrides tier-based maximums for biological oath categories. It enforces:

### BMI Floor (18.5)

Any contract with `oathCategory` starting with `BIOLOGICAL` requires a BMI check. If the user's current BMI is below 18.5, the contract is rejected regardless of tier status.

```
BMI = (weightLbs / heightInches²) × 703
```

### Weight Velocity Cap (2% per week)

For biological contracts with a duration >= 7 days, Aegis calculates projected weekly weight loss as a percentage of current body weight. If this exceeds 2% per week, the contract is rejected.

```
weeklyLossRate = (currentWeight - targetWeight) / weeks / currentWeight
```

Weight **gain** contracts are always allowed (no velocity cap applies).

### Absolute Stake Ceiling ($500 / 50,000 cents)

`MAX_STAKE_LIMIT = 50000` (cents) applies to all biological oaths regardless of tier. A TIER_4 whale with score 600 attempting a $1,000 biological stake will be rejected by Aegis even though their tier theoretically allows unlimited stakes.

## Recovery Protocol (Parallel Gate)

Recovery oath categories (`RECOVERY_NO_CONTACT`, `RECOVERY_SUBSTANCE`, `RECOVERY_BEHAVIORAL`) have their own separate constraints enforced alongside Aegis:

- Maximum duration: 30 days
- Maximum no-contact targets: 3
- Daily attestation required (3 missed = auto-fail)
- No velocity cap (not weight-related)

Recovery Protocol and Aegis are **parallel gates** — a `RECOVERY_` oath must pass Recovery constraints, while a `BIOLOGICAL_` oath must pass Aegis constraints. They do not overlap.

## Gate Ordering

```
User Request
  │
  ├─ 1. Tier Check (integrity score → max stake)
  │     └─ Reject if stake > tier maximum
  │
  ├─ 2. Aegis Check (biological oaths only)
  │     ├─ BMI floor
  │     ├─ Velocity cap
  │     └─ Absolute ceiling ($500)
  │
  ├─ 3. Recovery Check (recovery oaths only)
  │     ├─ Duration <= 30 days
  │     └─ No-contact target limit
  │
  └─ 4. Contract Created
```

## Key Principle

**Aegis always wins.** The tier system grants trust-based access to higher stakes, but Aegis enforces absolute medical safety limits that no amount of trust can override. This is by design — financial incentive systems must never incentivize self-harm.
