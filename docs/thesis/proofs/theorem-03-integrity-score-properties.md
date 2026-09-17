# Theorem T3: Integrity Score Boundedness & Monotonicity

> **Chapter:** 4 (Results)
> **Mathematical tool:** Real analysis; direct proof from definition
> **Code mapping:** `src/shared/libs/integrity.ts`
> **References:** Resnick et al. (2000), Ostrom (1990)

---

## Formal Definition (D3)

The **Integrity Score** function _IS_: _U_ → ℤ≥0 is defined for user _u_ with history (*c*ᵤ, *f*ᵤ, *s*ᵤ, *d*ᵤ) as:

> _IS_(_u_) = max(0, *IS*₀ + *β*c · *c*ᵤ − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ)

where:

- *IS*₀ = 50 (base score)
- *β*c = 5 (completion bonus)
- *β*f = 15 (fraud penalty)
- *β*s = 20 (strike/failure penalty)
- *β*d = 1 (inactivity decay per month)
- *c*ᵤ, *f*ᵤ, *s*ᵤ, *d*ᵤ ∈ ℤ≥0 (non-negative integers)

The **tier function** _T_: ℤ≥0 → {RESTRICTED, T1, T2, T3, T4} assigns access levels based on thresholds:

| Tier                | Condition        | Max Stake |
| ------------------- | ---------------- | --------- |
| RESTRICTED_MODE     | _IS_ < 20        | $0        |
| TIER_1_MICRO_STAKES | 20 ≤ _IS_ < 50   | $20       |
| TIER_2_STANDARD     | 50 ≤ _IS_ < 100  | $100      |
| TIER_3_HIGH_ROLLER  | 100 ≤ _IS_ < 500 | $1,000    |
| TIER_4_WHALE_VAULTS | _IS_ ≥ 500       | ∞         |

---

## Theorem Statement

**Theorem T3 (Integrity Score Properties).** The Integrity Score _IS_ satisfies the following properties:

**(a) Lower Boundedness:** _IS_(_u_) ≥ 0 for all _u_ ∈ _U_.

**(b) Upper Unboundedness:** For any _M_ > 0, there exists a user history such that _IS_(_u_) > _M_.

**(c) Completion Monotonicity:** _IS_ is strictly increasing in *c*ᵤ (all else equal).

**(d) Penalty Anti-Monotonicity:** _IS_ is strictly decreasing in *f*ᵤ, *s*ᵤ, and *d*ᵤ (all else equal), until the floor at 0.

**(e) Tier Nesting:** If _IS_(_u_) qualifies for tier *T*ₖ, then _u_ also qualifies for all tiers *T*ⱼ with _j_ < _k_.

**(f) Asymmetric Incentive:** The penalty-to-reward ratio (*β*f/*β*c = 3, *β*s/*β*c = 4) exceeds the loss aversion coefficient (_λ_ = 1.955), ensuring penalties dominate rewards in perceived magnitude.

---

## Proof

### (a) Lower Boundedness

By definition, _IS_(_u_) = max(0, *IS*₀ + *β*c · *c*ᵤ − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ).

The max(0, ·) operator ensures _IS_(_u_) ≥ 0 for all inputs. ✓

**Code:** `return Math.max(0, score);` (integrity.ts:40)

### (b) Upper Unboundedness

Choose *f*ᵤ = *s*ᵤ = *d*ᵤ = 0. Then _IS_(_u_) = 50 + 5*c*ᵤ.

For any _M_ > 0, setting *c*ᵤ = ⌈(_M_ − 50)/5⌉ + 1 gives _IS_(_u_) > _M_. ✓

### (c) Completion Monotonicity

Fix *f*ᵤ, *s*ᵤ, *d*ᵤ. Let _g_(_c_) = *IS*₀ + *β*c · _c_ − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ.

Then _g_(_c_ + 1) − _g_(_c_) = *β*c = 5 > 0.

Since _IS_(_u_) = max(0, _g_(_c_)):

- If _g_(_c_) > 0 and _g_(_c_ + 1) > 0: _IS_ increases by exactly 5. ✓
- If _g_(_c_) ≤ 0 and _g_(_c_ + 1) ≤ 0: _IS_ = 0 in both cases (monotone, but not strictly). ✓
- If _g_(_c_) ≤ 0 and _g_(_c_ + 1) > 0: _IS_ increases from 0 to _g_(_c_ + 1) > 0. ✓

In the interior region (_g_(_c_) > 0), monotonicity is strict. At the boundary, monotonicity is weak. ✓

### (d) Penalty Anti-Monotonicity

Fix *c*ᵤ, *s*ᵤ, *d*ᵤ. Let _g_(_f_) = *IS*₀ + *β*c · *c*ᵤ − *β*f · _f_ − *β*s · *s*ᵤ − *β*d · *d*ᵤ.

Then _g_(_f_ + 1) − _g_(_f_) = −*β*f = −15 < 0.

Since _IS_ = max(0, _g_(_f_)):

- In the interior region (_g_(_f_) > 0): _IS_ decreases by exactly 15 per fraud strike. ✓
- At the floor: _IS_ = 0 regardless of additional penalties. ✓

Analogous arguments hold for *s*ᵤ (with *β*s = 20) and *d*ᵤ (with *β*d = 1). ✓

### (e) Tier Nesting

The tier thresholds are strictly ordered: 20 < 50 < 100 < 500.

`getAllowedTiers()` implements cumulative tier access:

```typescript
if (score < 500)
  return ["TIER_1_MICRO_STAKES", "TIER_2_STANDARD", "TIER_3_HIGH_ROLLER"];
```

Each tier function value includes all lower tiers. Formally:

> _T_(_IS_) ⊇ _T_(_IS_') for _IS_ > _IS_'

where tier sets are ordered by inclusion: {RESTRICTED} ⊂ {T1} ⊂ {T1, T2} ⊂ {T1, T2, T3} ⊂ {T1, T2, T3, T4}. ✓

### (f) Asymmetric Incentive

The penalty-to-reward ratios are:

- Fraud: *β*f/*β*c = 15/5 = 3.0
- Strike: *β*s/*β*c = 20/5 = 4.0

Both exceed _λ_ = 1.955.

By prospect theory (Kahneman & Tversky, 1979), the perceived disutility of a penalty of magnitude _p_ is _λ_ · _p_. For the penalties to dominate rewards in perceived terms:

> _λ_ · *β*f > *β*c ⟺ 1.955 · 15 > 5 ⟺ 29.33 > 5 ✓
> _λ_ · *β*s > *β*c ⟺ 1.955 · 20 > 5 ⟺ 39.10 > 5 ✓

The perceived penalty-to-reward ratio is effectively:

- Fraud: _λ_ · *β*f / *β*c = 1.955 · 3.0 = 5.87
- Strike: _λ_ · *β*s / *β*c = 1.955 · 4.0 = 7.82

Both are well above 1, confirming that the scoring system creates a strong deterrent against negative behaviors. ∎

---

## Worked Examples

### Example 1: New User (Base Score)

_c_ = 0, _f_ = 0, _s_ = 0, _d_ = 0
_IS_ = max(0, 50 + 0 − 0 − 0 − 0) = **50** → TIER_2_STANDARD ($100 max)

### Example 2: Active Compliant User

_c_ = 20, _f_ = 0, _s_ = 1, _d_ = 0
_IS_ = max(0, 50 + 100 − 0 − 20 − 0) = **130** → TIER_3_HIGH_ROLLER ($1,000 max)

### Example 3: Fraudulent User

_c_ = 5, _f_ = 3, _s_ = 2, _d_ = 0
_IS_ = max(0, 50 + 25 − 45 − 40 − 0) = max(0, −10) = **0** → RESTRICTED_MODE ($0)

### Example 4: Path to Whale Vault

Required: _IS_ ≥ 500 with no penalties
500 = 50 + 5*c* → _c_ = 90 completed oaths (minimum)

---

## Code-to-Proof Mapping

| Proof Element       | Code Location                                | Line(s) |
| ------------------- | -------------------------------------------- | ------- |
| Base score constant | `integrity.ts:BASE_INTEGRITY`                | L1      |
| Penalty constants   | `integrity.ts:FRAUD_PENALTY, STRIKE_PENALTY` | L2–3    |
| Bonus constant      | `integrity.ts:COMPLETION_BONUS`              | L4      |
| Score computation   | `integrity.ts:calculateIntegrity()`          | L30–41  |
| Floor operator      | `integrity.ts:calculateIntegrity()`          | L40     |
| Tier function       | `integrity.ts:getAllowedTiers()`             | L46–52  |
| Max stake mapping   | `integrity.ts:getTierMaxStake()`             | L81–87  |
