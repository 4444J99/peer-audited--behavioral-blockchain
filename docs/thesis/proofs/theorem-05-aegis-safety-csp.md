# Theorem T5: Aegis Safety — Contract Harm Prevention

> **Chapter:** 4 (Results)
> **Mathematical tool:** CSP formalization; predicate logic; constraint satisfaction
> **Code mapping:** `src/api/services/health/aegis.service.ts`
> **References:** Hoare (1985), Marlatt (2005), Baumeister et al. (2007)

---

## Formal Definition (D5)

The **Aegis Safety Predicate Set** defines a feasibility region *R* ⊂ ℝ⁶ for behavioral contracts. A contract proposal is characterized by the tuple (*σ*, *δ*, *IS*, *κ*, *BMI*, *v*w) and is admissible if and only if *R* holds.

*R* = *P*₁ ∧ *P*₂ ∧ *P*₃ ∧ *P*₄ ∧ *P*₅ ∧ *P*₆

where:

| Predicate | Statement | Harm Prevented |
|-----------|-----------|----------------|
| *P*₁ | *σ* ≤ *σ̄* = 50000¢ ($500) | Revenge staking, emotional gambling |
| *P*₂ | *δ* ≥ *δ̲* = 7 days | Meaningless contracts, trivial commitments |
| *P*₃ | *κ* < 3 ∨ *σ* ≤ 5000¢ ($50) | Financial downward spiral after repeated failure |
| *P*₄ | *IS*(*u*) ≥ 40 ∨ *σ* ≤ 10000¢ ($100) | Escalation by low-trust users |
| *P*₅ | *BMI*(*u*) ≥ 18.5 (if biological) | Eating disorder acceleration |
| *P*₆ | *v*w ≤ 0.02 (if weight loss) | Unsafe weight loss velocity |

---

## Theorem Statement

**Theorem T5 (Aegis Safety).** The Aegis Protocol safety predicate set *R* satisfies three properties:

**(a) Non-emptiness (Validity):** *R* ≠ ∅. There exist contract parameters that satisfy all six predicates simultaneously.

**(b) Harm Coverage (Completeness):** The complement *R̄* captures all five identified iatrogenic harm scenarios: revenge staking, eating disorder acceleration, financial spiral, social isolation (via Recovery Protocol, T8), and meaningless commitment.

**(c) Determinism:** For any contract proposal tuple, the admissibility decision is deterministic and computable in O(1) time.

---

## Proof

### Part (a): Non-emptiness

Exhibit a valid contract:
- *σ* = 2000¢ ($20) → *P*₁: 2000 ≤ 50000 ✓
- *δ* = 30 days → *P*₂: 30 ≥ 7 ✓
- *κ* = 0 failures → *P*₃: 0 < 3 ✓
- *IS* = 50 (new user) → *P*₄: 50 ≥ 40 ✓
- *BMI* = 22.0 → *P*₅: 22.0 ≥ 18.5 ✓
- *v*w = 0.01 → *P*₆: 0.01 ≤ 0.02 ✓

All six predicates hold. Therefore *R* ≠ ∅. ✓

### Part (b): Harm Coverage

We demonstrate that each identified harm scenario falls in *R̄* by exhibiting a predicate violation.

**Harm 1: Revenge Staking**
An emotionally distressed user attempts to stake $1,000 after a breakup.
- *σ* = 100000¢ → *P*₁ violated: 100000 > 50000

```typescript
if (stakeAmount > MAX_STAKE_LIMIT) {
  throw new HttpException(
    `Aegis Violation: Proposed stake (${stakeAmount}¢) exceeds...`,
    HttpStatus.NOT_ACCEPTABLE
  );
}
```

**Harm 2: Eating Disorder Acceleration**
A user with BMI 17.2 creates a weight loss contract.
- *BMI* = 17.2 → *P*₅ violated: 17.2 < 18.5

```typescript
if (bmiCurrent < MIN_SAFE_BMI) {
  throw new HttpException(
    `Aegis Health Guard: Current BMI (${bmiCurrent.toFixed(1)}) is below...`,
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

**Harm 3: Financial Spiral**
A user with 4 consecutive failures attempts a $200 stake to "win it back."
- *κ* = 4, *σ* = 20000¢ → *P*₃ violated: 4 ≥ 3 AND 20000 > 5000

```typescript
if (pastFailures >= 3 && stakeAmount > 5000) {
  throw new HttpException(
    `Aegis Velocity Check: After ${pastFailures} recent contract failures...`,
    HttpStatus.NOT_ACCEPTABLE
  );
}
```

**Harm 4: Meaningless Commitment**
A user creates a 2-day contract (insufficient for behavioral change).
- *δ* = 2 → *P*₂ violated: 2 < 7

```typescript
if (durationDays < MIN_DURATION_DAYS) {
  throw new HttpException(
    `Aegis Violation: Proposed duration (${durationDays} days) is beneath...`,
    HttpStatus.NOT_ACCEPTABLE
  );
}
```

**Harm 5: Unsafe Weight Loss Velocity**
A user targets 5 lbs/week loss (3.3% of body weight).
- *v*w = 0.033 → *P*₆ violated: 0.033 > 0.02

```typescript
if (weeklyLossRate > MAX_WEEKLY_LOSS_VELOCITY_PCT) {
  throw new HttpException(
    `Aegis Velocity Guard: Projected weekly weight loss...`,
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

**Note on Harm 6 (Social Isolation):** Prevented by the Recovery Protocol (Theorem T8), which is a complementary safety mechanism. The Aegis Protocol handles financial and physiological harm; the Recovery Protocol handles social harm.

All five financial/physiological harm scenarios are captured by predicate violations in *R̄*. ✓

### Part (c): Determinism

Each predicate *P*ᵢ is a comparison of the form:
- *P*₁: *σ* ≤ constant → single integer comparison
- *P*₂: *δ* ≥ constant → single integer comparison
- *P*₃: (*κ* < constant) ∨ (*σ* ≤ constant) → two comparisons + OR
- *P*₄: (*IS* ≥ constant) ∨ (*σ* ≤ constant) → two comparisons + OR
- *P*₅: *BMI* ≥ constant → single float comparison (if applicable)
- *P*₆: *v*w ≤ constant → single float comparison (if applicable)

Each predicate evaluates in O(1) time. The conjunction *R* = *P*₁ ∧ … ∧ *P*₆ evaluates in O(6) = O(1) time.

No predicate involves probabilistic evaluation, external data fetching, or iterative computation. The decision is deterministic for any given input tuple. ✓ ∎

---

## Volatility Multiplier Extension

The Aegis Protocol includes a breach-time volatility multiplier *μ*(*t*):

> *μ*(*t*) = 1.5 if *t* is a Friday or Saturday night (9 PM–4 AM)
> *μ*(*t*) = 1.0 otherwise

**Behavioral rationale (Baumeister et al., 2007):** Self-control depletion peaks during weekend nights, making breaches during these periods stronger indicators of loss of discipline. The 1.5× multiplier adjusts penalties to reflect this asymmetry.

**Implementation:**
```typescript
getVolatilityMultiplier(date: Date = new Date()): number {
  const isFriSat = (day === 5 || day === 6);
  const isNight = (hour >= 21 || hour < 4);
  if (isFriSat && isNight) return 1.5;
  return 1.0;
}
```

This multiplier does NOT affect contract admissibility (it is not part of *R*) but adjusts penalty severity at breach time.

---

## Code-to-Proof Mapping

| Proof Element | Code Location | Line(s) |
|--------------|---------------|---------|
| *P*₁: stake cap | `aegis.service.ts:validatePsychologicalGuardrails()` | L21–26 |
| *P*₂: duration minimum | `aegis.service.ts:validatePsychologicalGuardrails()` | L29–34 |
| *P*₃: failure downscaling | `aegis.service.ts:validatePsychologicalGuardrails()` | L37–42 |
| *P*₄: integrity-based cap | `aegis.service.ts:validatePsychologicalGuardrails()` | L45–49 |
| *P*₅: BMI floor | `aegis.service.ts:validateHealthMetrics()` | L70–76 |
| *P*₆: velocity cap | `aegis.service.ts:validateHealthMetrics()` | L79–90 |
| Volatility multiplier | `aegis.service.ts:getVolatilityMultiplier()` | L101–115 |

---

## Constraint Interaction Analysis

| Predicates | Interaction | Effect |
|-----------|-------------|--------|
| *P*₁ ∧ *P*₃ | After 3 failures, effective max stake drops from $500 to $50 | Compounding protection |
| *P*₁ ∧ *P*₄ | Low integrity + high stake blocked even below $500 cap | Layered defense |
| *P*₅ ∧ *P*₆ | BMI floor + velocity cap together prevent both acute and chronic eating disorder patterns | Complementary health guards |
| *P*₂ ∧ *P*₃ | Minimum 7 days + failure downscaling prevents rapid loss cycling | Anti-gambling-behavior defense |
