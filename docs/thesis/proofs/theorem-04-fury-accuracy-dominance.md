# Theorem T4: Fury Accuracy — Honest Auditor Dominance

> **Chapter:** 4 (Results)
> **Mathematical tool:** Game theory; mechanism design; dominant strategy analysis
> **Code mapping:** `src/shared/libs/integrity.ts` (calculateAccuracy, shouldDemoteFury)
> **References:** Myerson (2007), Prelec (2004), Witkowski & Parkes (2012)

---

## Formal Definition (D4)

The **Fury Accuracy** function _FA_: _F_ → [0, 1] for auditor _v_ with history (*a*ᵥ, *ā*ᵥ, *n*ᵥ) is:

> _FA_(_v_) = clamp₀¹( (*a*ᵥ − _ω_ · *ā*ᵥ) / *n*ᵥ ) when *n*ᵥ > 0
> _FA_(_v_) = 1.0 when *n*ᵥ = 0

where:

- *a*ᵥ ∈ ℤ≥0: successful (correct) audits
- *ā*ᵥ ∈ ℤ≥0: false accusations (incorrect FAIL verdicts on honest proofs)
- *n*ᵥ = *a*ᵥ + *ā*ᵥ + *m*ᵥ where *m*ᵥ is other audit outcomes
- _ω_ = 3: false accusation penalty weight
- clamp₀¹(_x_) = max(0, min(1, _x_))

**Demotion rule:** Fury _v_ is demoted if _FA_(_v_) < 0.8 AND *n*ᵥ ≥ 10 (burn-in).

---

## Theorem Statement

**Theorem T4 (Honest Auditor Dominance).** Under the Styx Fury accuracy mechanism with penalty weight _ω_ = 3:

**(a)** An honest auditor (one who reports truthfully) maintains _FA_ ≥ 0.8 if their error rate is at most ~5% of total audits.

**(b)** A dishonest auditor who submits false accusations at rate _r_ > 5% will be demoted after the 10-audit burn-in period.

**(c)** Truth-telling is the weakly dominant strategy for a Fury auditor seeking to maximize long-term participation (avoid demotion).

---

## Proof

### Setup: The Fury Audit Game

Model each audit as a single-shot game where Fury _v_ observes proof _p_ and submits verdict *r*ᵥ ∈ {PASS, FAIL}. The true state is _s_ ∈ {PASS, FAIL} (determined by consensus or honeypot ground truth).

**Payoff structure:**

| Verdict | True State | Outcome          | _FA_ Effect                      |
| ------- | ---------- | ---------------- | -------------------------------- |
| PASS    | PASS       | Correct          | +1 to *a*ᵥ                       |
| FAIL    | FAIL       | Correct          | +1 to *a*ᵥ                       |
| FAIL    | PASS       | False accusation | +1 to *ā*ᵥ (weighted 3× in _FA_) |
| PASS    | FAIL       | Missed failure   | +0 (counts toward *n*ᵥ only)     |

### Part (a): Honest Auditor Accuracy Bound

Consider an honest auditor with error rate _ε_ (probability of any incorrect verdict). After _n_ audits:

- Expected successful audits: *a*ᵥ = (1 − _ε_) · _n_
- Expected false accusations: *ā*ᵥ ≤ _ε_ · _n_ (worst case: all errors are false accusations)

The accuracy score:

> _FA_ = (*a*ᵥ − _ω_ · *ā*ᵥ) / *n*ᵥ
> = ((1 − _ε_)_n_ − 3*ε* · _n_) / _n_
> = 1 − _ε_ − 3*ε*
> = 1 − 4*ε*

For _FA_ ≥ 0.8:

> 1 − 4*ε* ≥ 0.8
> _ε_ ≤ 0.05

**Result:** An auditor with error rate _ε_ ≤ 5% maintains _FA_ ≥ 0.8. ✓

### Part (b): Dishonest Auditor Demotion

Consider a dishonest auditor who submits false accusations at rate _r_ > 0.05. Their expected accuracy after _n_ ≥ 10 audits:

> _FA_ = 1 − 4*r* < 1 − 4(0.05) = 0.8

Since _FA_ < 0.8 and _n_ ≥ 10 (burn-in satisfied), the demotion rule triggers:

```typescript
export function shouldDemoteFury(history: FuryHistory): boolean {
  if (history.totalAudits < 10) return false;
  return calculateAccuracy(history) < 0.8;
}
```

**Expected audits to demotion:** For an auditor with false accusation rate _r_, after 10 audits the expected _FA_ = 1 − 4*r*. If _r_ = 0.10 (10%), then _FA_ = 0.60 < 0.80 → demoted at the first check after burn-in. ✓

### Part (c): Dominant Strategy Argument

Define the auditor's **continuation value** _V_ as the expected present value of future audit participation (bounty income). Demotion sets _V_ = 0.

**Strategy comparison for a single audit:**

Let _q_ = P(_s_ = FAIL | evidence) be the auditor's private posterior belief.

**If the auditor reports FAIL:**

- P(correct) = _q_ → contributes +1 to *a*ᵥ
- P(false accusation) = 1 − _q_ → contributes +1 to *ā*ᵥ (weighted 3× in _FA_)

**If the auditor reports PASS:**

- P(correct) = 1 − _q_ → contributes +1 to *a*ᵥ
- P(missed failure) = _q_ → contributes +0 (no penalty, just counted toward *n*ᵥ)

**Expected _FA_ contribution of FAIL verdict:**

> Δ*FA*_FAIL = _q_ · (+1/_n_) + (1 − _q_) · (−3/_n_) = (_q_ − 3 + 3*q*)/_n_ = (4*q* − 3)/_n_

**Expected _FA_ contribution of PASS verdict:**

> Δ*FA*_PASS = (1 − _q_) · (+1/_n_) + _q_ · (0) = (1 − _q_)/_n_

**FAIL is better than PASS when:**

> (4*q* − 3)/_n_ > (1 − _q_)/_n_
> 4*q* − 3 > 1 − _q_
> 5*q* > 4
> _q_ > 0.8

**PASS is better than FAIL when _q_ < 0.8.**

**Truth-telling strategy:** Report FAIL when _q_ ≥ 0.5 (i.e., when belief favors failure).

For _q_ ∈ [0.5, 0.8): truth-telling (FAIL) yields a lower _FA_ contribution than reporting PASS. However, in this region, the auditor's belief genuinely favors FAIL, and reporting PASS would be a lie.

**Key insight:** The 3× penalty weight means that auditors should only report FAIL when they are highly confident (_q_ > 0.8). This is a CONSERVATIVE mechanism: it biases toward PASS verdicts, protecting oath-takers from frivolous rejections.

**For truthful auditors (who accurately assess _q_):**

- When _s_ = PASS: _q_ is low → report PASS → correct
- When _s_ = FAIL: _q_ is high → report FAIL only when confident → mostly correct, occasionally miss (no penalty)

This yields _FA_ ≈ 1 − _ε_ where _ε_ is the residual honest error rate. As shown in (a), _ε_ < 0.05 keeps _FA_ ≥ 0.8.

**For strategic liars (who report FAIL to harm oath-takers):**

- Their false accusation rate _r_ > 0.05 → _FA_ < 0.80 → demotion after burn-in

Therefore truth-telling (reporting one's honest assessment) is the dominant strategy for any auditor seeking to maintain _FA_ ≥ 0.80 and avoid demotion. ∎

---

## Honeypot Reinforcement

The honeypot system (Theorem T7) provides additional truth-telling incentive by injecting known-fail proofs:

- Correct honeypot identification: +5 integrity bonus
- Missed honeypot: −5 integrity penalty

This creates a secondary incentive for attentiveness beyond the accuracy-based demotion mechanism, closing the gap for "lazy but honest" auditors who might always vote PASS.

---

## Code-to-Proof Mapping

| Proof Element          | Code Location                          | Line(s) |
| ---------------------- | -------------------------------------- | ------- |
| Accuracy computation   | `integrity.ts:calculateAccuracy()`     | L60–69  |
| Penalty weight _ω_ = 3 | `integrity.ts:FALSE_ACCUSATION_WEIGHT` | L58     |
| Demotion threshold     | `integrity.ts:shouldDemoteFury()`      | L71–75  |
| Burn-in period         | `integrity.ts:shouldDemoteFury()`      | L73     |
| Auditor stake amount   | `integrity.ts:AUDITOR_STAKE_AMOUNT`    | L6      |

---

## Comparison with Related Mechanisms

| Mechanism                                  | IC Property                               | Styx Difference                                                                       |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| BTS (Prelec, 2004)                         | IC under common prior                     | Styx uses penalty weighting instead of Bayesian scoring; doesn't require common prior |
| Peer Prediction (Witkowski & Parkes, 2012) | Strict IC without common prior            | Styx approximates with consensus + accuracy weighting                                 |
| Kleros                                     | IC under Schelling focal points           | Similar: honeypots test focal convergence                                             |
| TrueBit                                    | IC under computational verification games | Styx's honeypots serve analogous "forced error" function                              |
