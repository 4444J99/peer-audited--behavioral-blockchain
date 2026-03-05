# Theorem T3: Integrity Score Boundedness & Monotonicity

> **Chapter:** 4 (Results)
> **Mathematical tool:** Real analysis; direct proof from definition
> **Code mapping:** `src/shared/libs/integrity.ts`
> **References:** Resnick et al. (2000), Ostrom (1990)

---

## Formal Definition (D3)

The **Integrity Score** function *IS*: *U* → ℤ≥0 is defined for user *u* with history (*c*ᵤ, *f*ᵤ, *s*ᵤ, *d*ᵤ) as:

> *IS*(*u*) = max(0, *IS*₀ + *β*c · *c*ᵤ − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ)

where:
- *IS*₀ = 50 (base score)
- *β*c = 5 (completion bonus)
- *β*f = 15 (fraud penalty)
- *β*s = 20 (strike/failure penalty)
- *β*d = 1 (inactivity decay per month)
- *c*ᵤ, *f*ᵤ, *s*ᵤ, *d*ᵤ ∈ ℤ≥0 (non-negative integers)

The **tier function** *T*: ℤ≥0 → {RESTRICTED, T1, T2, T3, T4} assigns access levels based on thresholds:

| Tier | Condition | Max Stake |
|------|-----------|-----------|
| RESTRICTED_MODE | *IS* < 20 | $0 |
| TIER_1_MICRO_STAKES | 20 ≤ *IS* < 50 | $20 |
| TIER_2_STANDARD | 50 ≤ *IS* < 100 | $100 |
| TIER_3_HIGH_ROLLER | 100 ≤ *IS* < 500 | $1,000 |
| TIER_4_WHALE_VAULTS | *IS* ≥ 500 | ∞ |

---

## Theorem Statement

**Theorem T3 (Integrity Score Properties).** The Integrity Score *IS* satisfies the following properties:

**(a) Lower Boundedness:** *IS*(*u*) ≥ 0 for all *u* ∈ *U*.

**(b) Upper Unboundedness:** For any *M* > 0, there exists a user history such that *IS*(*u*) > *M*.

**(c) Completion Monotonicity:** *IS* is strictly increasing in *c*ᵤ (all else equal).

**(d) Penalty Anti-Monotonicity:** *IS* is strictly decreasing in *f*ᵤ, *s*ᵤ, and *d*ᵤ (all else equal), until the floor at 0.

**(e) Tier Nesting:** If *IS*(*u*) qualifies for tier *T*ₖ, then *u* also qualifies for all tiers *T*ⱼ with *j* < *k*.

**(f) Asymmetric Incentive:** The penalty-to-reward ratio (*β*f/*β*c = 3, *β*s/*β*c = 4) exceeds the loss aversion coefficient (*λ* = 1.955), ensuring penalties dominate rewards in perceived magnitude.

---

## Proof

### (a) Lower Boundedness

By definition, *IS*(*u*) = max(0, *IS*₀ + *β*c · *c*ᵤ − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ).

The max(0, ·) operator ensures *IS*(*u*) ≥ 0 for all inputs. ✓

**Code:** `return Math.max(0, score);` (integrity.ts:40)

### (b) Upper Unboundedness

Choose *f*ᵤ = *s*ᵤ = *d*ᵤ = 0. Then *IS*(*u*) = 50 + 5*c*ᵤ.

For any *M* > 0, setting *c*ᵤ = ⌈(*M* − 50)/5⌉ + 1 gives *IS*(*u*) > *M*. ✓

### (c) Completion Monotonicity

Fix *f*ᵤ, *s*ᵤ, *d*ᵤ. Let *g*(*c*) = *IS*₀ + *β*c · *c* − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ.

Then *g*(*c* + 1) − *g*(*c*) = *β*c = 5 > 0.

Since *IS*(*u*) = max(0, *g*(*c*)):
- If *g*(*c*) > 0 and *g*(*c* + 1) > 0: *IS* increases by exactly 5. ✓
- If *g*(*c*) ≤ 0 and *g*(*c* + 1) ≤ 0: *IS* = 0 in both cases (monotone, but not strictly). ✓
- If *g*(*c*) ≤ 0 and *g*(*c* + 1) > 0: *IS* increases from 0 to *g*(*c* + 1) > 0. ✓

In the interior region (*g*(*c*) > 0), monotonicity is strict. At the boundary, monotonicity is weak. ✓

### (d) Penalty Anti-Monotonicity

Fix *c*ᵤ, *s*ᵤ, *d*ᵤ. Let *g*(*f*) = *IS*₀ + *β*c · *c*ᵤ − *β*f · *f* − *β*s · *s*ᵤ − *β*d · *d*ᵤ.

Then *g*(*f* + 1) − *g*(*f*) = −*β*f = −15 < 0.

Since *IS* = max(0, *g*(*f*)):
- In the interior region (*g*(*f*) > 0): *IS* decreases by exactly 15 per fraud strike. ✓
- At the floor: *IS* = 0 regardless of additional penalties. ✓

Analogous arguments hold for *s*ᵤ (with *β*s = 20) and *d*ᵤ (with *β*d = 1). ✓

### (e) Tier Nesting

The tier thresholds are strictly ordered: 20 < 50 < 100 < 500.

`getAllowedTiers()` implements cumulative tier access:
```typescript
if (score < 500) return ['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER'];
```

Each tier function value includes all lower tiers. Formally:

> *T*(*IS*) ⊇ *T*(*IS*') for *IS* > *IS*'

where tier sets are ordered by inclusion: {RESTRICTED} ⊂ {T1} ⊂ {T1, T2} ⊂ {T1, T2, T3} ⊂ {T1, T2, T3, T4}. ✓

### (f) Asymmetric Incentive

The penalty-to-reward ratios are:
- Fraud: *β*f/*β*c = 15/5 = 3.0
- Strike: *β*s/*β*c = 20/5 = 4.0

Both exceed *λ* = 1.955.

By prospect theory (Kahneman & Tversky, 1979), the perceived disutility of a penalty of magnitude *p* is *λ* · *p*. For the penalties to dominate rewards in perceived terms:

> *λ* · *β*f > *β*c ⟺ 1.955 · 15 > 5 ⟺ 29.33 > 5 ✓
> *λ* · *β*s > *β*c ⟺ 1.955 · 20 > 5 ⟺ 39.10 > 5 ✓

The perceived penalty-to-reward ratio is effectively:
- Fraud: *λ* · *β*f / *β*c = 1.955 · 3.0 = 5.87
- Strike: *λ* · *β*s / *β*c = 1.955 · 4.0 = 7.82

Both are well above 1, confirming that the scoring system creates a strong deterrent against negative behaviors. ∎

---

## Worked Examples

### Example 1: New User (Base Score)
*c* = 0, *f* = 0, *s* = 0, *d* = 0
*IS* = max(0, 50 + 0 − 0 − 0 − 0) = **50** → TIER_2_STANDARD ($100 max)

### Example 2: Active Compliant User
*c* = 20, *f* = 0, *s* = 1, *d* = 0
*IS* = max(0, 50 + 100 − 0 − 20 − 0) = **130** → TIER_3_HIGH_ROLLER ($1,000 max)

### Example 3: Fraudulent User
*c* = 5, *f* = 3, *s* = 2, *d* = 0
*IS* = max(0, 50 + 25 − 45 − 40 − 0) = max(0, −10) = **0** → RESTRICTED_MODE ($0)

### Example 4: Path to Whale Vault
Required: *IS* ≥ 500 with no penalties
500 = 50 + 5*c* → *c* = 90 completed oaths (minimum)

---

## Code-to-Proof Mapping

| Proof Element | Code Location | Line(s) |
|--------------|---------------|---------|
| Base score constant | `integrity.ts:BASE_INTEGRITY` | L1 |
| Penalty constants | `integrity.ts:FRAUD_PENALTY, STRIKE_PENALTY` | L2–3 |
| Bonus constant | `integrity.ts:COMPLETION_BONUS` | L4 |
| Score computation | `integrity.ts:calculateIntegrity()` | L30–41 |
| Floor operator | `integrity.ts:calculateIntegrity()` | L40 |
| Tier function | `integrity.ts:getAllowedTiers()` | L46–52 |
| Max stake mapping | `integrity.ts:getTierMaxStake()` | L81–87 |
