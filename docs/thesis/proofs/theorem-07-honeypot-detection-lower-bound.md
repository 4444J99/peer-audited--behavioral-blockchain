# Theorem T7: Honeypot Detection Rate Lower Bound

> **Chapter:** 4 (Results)
> **Mathematical tool:** Random walk; Markov chain analysis; expected hitting time
> **Code mapping:** `src/api/services/intelligence/honeypot.service.ts`
> **References:** Schelling (1960), Buterin (2021)

---

## Formal Definition (D7)

The **honeypot injection system** is a periodic integrity calibration mechanism with parameters:

- *Δ*⁺ = +5: integrity bonus for correct honeypot identification
- *Δ*⁻ = −5: integrity penalty for missed honeypot
- *T*inj = 6 hours: injection cadence
- *N*F ≥ 3: minimum active Furies required for injection
- Expected verdict: FAIL (honeypots are known-fail synthetic proofs)

An auditor's **integrity trajectory** under honeypot exposure is a random walk:

> _IS__{t+1} = _IS__t + *Δ*⁺ with probability *ρ* (correct identification)
> *IS*_{t+1} = _IS__t + *Δ*⁻ with probability 1 − _ρ_ (missed honeypot)

where _ρ_ ∈ [0, 1] is the auditor's honeypot detection probability.

---

## Theorem Statement

**Theorem T7 (Honeypot Detection Lower Bound).** For a dishonest auditor with honeypot detection probability _ρ_ < 0.5:

**(a)** The expected number of honeypot cycles to reach RESTRICTED_MODE (_IS_ < 20) from initial score *IS*₀ is at most:

> _E_[_τ_] ≤ (*IS*₀ − 20) / (5 · (1 − 2*ρ*))

**(b)** For _ρ_ = 0 (completely inattentive auditor), the expected demotion time from the base score (*IS*₀ = 50) is 6 honeypot cycles (36 hours).

**(c)** For _ρ_ = 0.5 (random guessing), the walk is unbiased and reaches RESTRICTED_MODE in O((*IS*₀ − 20)²) expected cycles by the gambler's ruin result.

---

## Proof

### Part (a): Expected Hitting Time — Biased Random Walk

Model the auditor's integrity score under honeypot exposure as a discrete random walk on ℤ with:

- Step size: |_Δ_| = 5 (symmetric magnitude)
- Upward probability: _ρ_ (correct → +5)
- Downward probability: 1 − _ρ_ (missed → −5)
- Absorbing barrier at _IS_ = 20 (RESTRICTED_MODE)
- Reflecting barrier at _IS_ = 0 (score floor)

The expected displacement per step is:

> _E_[*Δ*IS] = _ρ_ · 5 + (1 − _ρ_) · (−5) = 5(2*ρ* − 1)

For _ρ_ < 0.5: _E_[*Δ*IS] = 5(2*ρ* − 1) < 0 (negative drift — score decreases on average).

The net drift magnitude is _μ_ = 5(1 − 2*ρ*) > 0 downward per cycle.

**Expected hitting time to the absorbing barrier:**

Starting at *IS*₀, the expected number of steps to reach _IS_ = 20 is bounded above by:

> _E_[_τ_] ≤ (*IS*₀ − 20) / _μ_ = (*IS*₀ − 20) / (5(1 − 2*ρ*))

This bound follows from the optional stopping theorem for submartingales: when the walk has negative drift, the expected first passage time to any lower level is bounded by the distance divided by the drift rate. ✓

### Part (b): Completely Inattentive Auditor (_ρ_ = 0)

If _ρ_ = 0, the auditor always misses honeypots (always votes PASS on known-fail proofs):

> _E_[*Δ*IS] = −5 per honeypot cycle (deterministic)

Starting from *IS*₀ = 50:

> _E_[_τ_] = (50 − 20) / 5 = **6 cycles**

At *T*inj = 6 hours per cycle: **36 hours** to demotion.

After 6 consecutive missed honeypots:

- _IS_ = 50 − 6 × 5 = 20 → RESTRICTED_MODE (demoted)

**Code verification:**

```typescript
// Integrity penalty for missed honeypot
const delta = isCorrect
  ? HoneypotService.HONEYPOT_CORRECT_BONUS // +5
  : -HoneypotService.HONEYPOT_MISS_PENALTY; // -5

await client.query(
  `UPDATE users SET integrity_score = GREATEST(0, LEAST(100, integrity_score + $1))
   WHERE id = $2`,
  [delta, assignment.fury_user_id],
);
```

Note: The SQL clamps integrity_score to [0, 100] in the honeypot grading context. This introduces a ceiling that doesn't affect the demotion analysis but does limit the upside for honest auditors. ✓

### Part (c): Random Guessing (_ρ_ = 0.5)

When _ρ_ = 0.5, the expected displacement is zero (unbiased random walk):

> _E_[*Δ*IS] = 5(2 · 0.5 − 1) = 0

By the classical gambler's ruin result (Feller, 1968), the expected hitting time for an unbiased walk starting at position _k_ with absorbing barrier at 0 is:

> _E_[_τ_] = _k_ · (_N_ − _k_)

where _N_ is the upper barrier. In our case, with the score clamped to [0, 100] and the target at 20:

Let _k_ = (*IS*₀ − 20)/5 = 6 (starting position in step units) and _N_ = (100 − 20)/5 = 16 (upper barrier in step units).

> _E_[_τ_] = _k_(_N_ − _k_) = 6 × 10 = **60 cycles** (360 hours ≈ 15 days)

A random-guessing auditor reaches RESTRICTED_MODE in ~15 days on expectation. ✓

---

## Detection Efficiency Table

| Auditor Type                | _ρ_ | Drift      | _E_[_τ_] from *IS*₀=50 | Calendar Time |
| --------------------------- | --- | ---------- | ---------------------- | ------------- |
| Completely inattentive      | 0.0 | −5.0/cycle | 6 cycles               | 36 hours      |
| Mostly inattentive          | 0.2 | −3.0/cycle | 10 cycles              | 60 hours      |
| Slightly biased toward PASS | 0.4 | −1.0/cycle | 30 cycles              | 7.5 days      |
| Random guessing             | 0.5 | 0.0/cycle  | ~60 cycles             | ~15 days      |
| Mostly attentive            | 0.8 | +3.0/cycle | ∞ (score increases)    | Never demoted |
| Fully attentive             | 1.0 | +5.0/cycle | ∞ (capped at 100)      | Never demoted |

**Key threshold:** _ρ_ = 0.5 separates convergent demotion (below) from divergent score growth (above). Any auditor with _ρ_ < 0.5 will eventually be demoted with probability 1.

---

## Interaction with Fury Accuracy (T4)

The honeypot system and the accuracy-based demotion (T4) provide complementary detection:

- **T4 (Accuracy):** Detects auditors who submit false accusations on real proofs. Requires 10-audit burn-in.
- **T7 (Honeypot):** Detects auditors who are inattentive or systematically dishonest. Operates on 6-hour cadence independently of real audit volume.

An auditor who games T4 (by always voting PASS to avoid false accusations) will have high accuracy but will fail honeypots (which require FAIL verdicts). The combination of T4 and T7 creates a pincer: honest auditors satisfy both; dishonest auditors fail at least one.

---

## Code-to-Proof Mapping

| Proof Element               | Code Location                                    | Line(s)  |
| --------------------------- | ------------------------------------------------ | -------- |
| Injection cadence           | `honeypot.service.ts:@Cron(EVERY_6_HOURS)`       | L40      |
| Minimum Furies check        | `honeypot.service.ts:injectHoneypot()`           | L44–57   |
| Known-fail expected verdict | `honeypot.service.ts:injectHoneypot()`           | L82      |
| Correct bonus (+5)          | `honeypot.service.ts:HONEYPOT_CORRECT_BONUS`     | L22      |
| Miss penalty (−5)           | `honeypot.service.ts:HONEYPOT_MISS_PENALTY`      | L25      |
| Score update (clamped)      | `honeypot.service.ts:gradeHoneypotPerformance()` | L138–142 |
| Truth log audit trail       | `honeypot.service.ts:gradeHoneypotPerformance()` | L153–159 |

---

## Limitations

1. **Honeypot detectability:** Sophisticated adversaries might distinguish honeypots from real proofs (e.g., synthetic media patterns, missing metadata). The system relies on honeypot indistinguishability for security.

2. **Asymmetric step size assumption:** The proof assumes equal |*Δ*⁺| = |*Δ*⁻| = 5. If these were asymmetric, the random walk analysis would change (drift = _ρ_ · *Δ*⁺ + (1−*ρ*) · |*Δ*⁻|, with different convergence properties).

3. **Independence assumption:** The proof assumes independent honeypot outcomes. If an auditor learns from previous honeypot results, their _ρ_ may change over time (adaptive adversary). The 6-hour cadence limits the information available for adaptation.
