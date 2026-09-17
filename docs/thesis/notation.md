# Notation Conventions

> **Purpose:** Defines all mathematical symbols, operators, and naming conventions used across the 9 formal proofs (T1–T9) and 9 formal definitions (D1–D9) in the dissertation.
> **Last updated:** 2026-03-04

---

## General Conventions

| Convention         | Meaning                                              |
| ------------------ | ---------------------------------------------------- |
| Uppercase italic   | Sets and domains: _U_, _C_, _P_, _A_                 |
| Lowercase italic   | Elements and variables: _u_, _c_, _p_, _a_           |
| Bold lowercase     | Vectors and tuples: **h**, **v**                     |
| Caligraphic        | Systems and protocols: 𝒮 (Styx), 𝒜 (Aegis), ℱ (Fury) |
| Subscript notation | Indexing: *IS*ᵤ = integrity score of user _u_        |
| Hat notation       | Computed/estimated values: _ĥ_ (recomputed hash)     |
| Bar notation       | Thresholds: _IS̄_ (minimum integrity threshold)       |

---

## Core Domains

| Symbol | Domain    | Description                          | Source                   |
| ------ | --------- | ------------------------------------ | ------------------------ |
| _U_    | Users     | Set of all registered users          | `users` table            |
| _C_    | Contracts | Set of all behavioral contracts      | `contracts` table        |
| _P_    | Proofs    | Set of all submitted proofs          | `proofs` table           |
| _A_    | Accounts  | Set of all ledger accounts           | `entries` table          |
| _E_    | Entries   | Set of all ledger entries            | `entries` table          |
| _F_    | Furies    | Set of all auditor users, _F_ ⊂ _U_  | `fury_assignments` table |
| _L_    | Log       | Ordered sequence of truth log events | `event_log` table        |
| _D_    | Disputes  | Set of all disputes                  | `disputes` table         |
| _O_    | Oaths     | Set of 7 oath categories             | `OathCategory` enum      |

---

## Integrity Score (Theorems T3, T4)

| Symbol                 | Type    | Definition                                  | Code Reference         |
| ---------------------- | ------- | ------------------------------------------- | ---------------------- |
| _IS_(_u_)              | ℤ → ℤ≥0 | Integrity Score of user _u_                 | `calculateIntegrity()` |
| *IS*₀                  | ℤ       | Base integrity score = 50                   | `BASE_INTEGRITY`       |
| *c*ᵤ                   | ℤ≥0     | Completed oaths count for user _u_          | `completedOaths`       |
| *f*ᵤ                   | ℤ≥0     | Fraud strikes for user _u_                  | `fraudStrikes`         |
| *s*ᵤ                   | ℤ≥0     | Failed oaths (strikes) for user _u_         | `failedOaths`          |
| *d*ᵤ                   | ℤ≥0     | Months inactive for user _u_                | `monthsInactive`       |
| *β*c                   | 5       | Bonus per completed oath                    | `COMPLETION_BONUS`     |
| *β*f                   | 15      | Penalty per fraud strike                    | `FRAUD_PENALTY`        |
| *β*s                   | 20      | Penalty per failed oath                     | `STRIKE_PENALTY`       |
| *β*d                   | 1       | Decay per inactive month                    | implicit               |
| *τ*₁, *τ*₂, *τ*₃, *τ*₄ | ℤ       | Tier thresholds: 20, 50, 100, 500           | `getAllowedTiers()`    |
| _T_(_IS_)              | Tier    | Tier function mapping score to access level | `getAllowedTiers()`    |

**Definition (D3):**

> _IS_(_u_) = max(0, *IS*₀ + *β*c · *c*ᵤ − *β*f · *f*ᵤ − *β*s · *s*ᵤ − *β*d · *d*ᵤ)

---

## Fury Accuracy (Theorem T4)

| Symbol    | Type      | Definition                                  | Code Reference            |
| --------- | --------- | ------------------------------------------- | ------------------------- |
| _FA_(_v_) | ℝ → [0,1] | Fury Accuracy of auditor _v_                | `calculateAccuracy()`     |
| *a*ᵥ      | ℤ≥0       | Successful audits by Fury _v_               | `successfulAudits`        |
| *ā*ᵥ      | ℤ≥0       | False accusations by Fury _v_               | `falseAccusations`        |
| *n*ᵥ      | ℤ≥0       | Total audits by Fury _v_                    | `totalAudits`             |
| _ω_       | 3         | False accusation penalty weight             | `FALSE_ACCUSATION_WEIGHT` |
| _FA̲_      | 0.8       | Minimum accuracy before demotion            | `shouldDemoteFury()`      |
| _n̲_       | 10        | Burn-in period (min audits before demotion) | `shouldDemoteFury()`      |

**Definition (D4):**

> _FA_(_v_) = clamp₀¹( (*a*ᵥ − _ω_ · *ā*ᵥ) / *n*ᵥ ) when *n*ᵥ > 0; _FA_(_v_) = 1.0 when *n*ᵥ = 0

---

## Ledger & Double-Entry (Theorem T1)

| Symbol   | Type            | Definition                                             | Code Reference            |
| -------- | --------------- | ------------------------------------------------------ | ------------------------- |
| _B_(_a_) | ℤ               | Net balance of account _a_ ∈ _A_                       | `getAccountBalance()`     |
| *e*ᵢ     | (_d_, _c_, _m_) | Entry _i_: debit account, credit account, amount       | `recordTransaction()`     |
| *m*ᵢ     | ℤ>0             | Amount of entry _i_ (integer cents, strictly positive) | `amount` param            |
| Σ*B*     | ℤ               | Sum of all account balances across _A_                 | `verifyLedgerIntegrity()` |

**Definition (D1):**

> _B_(_a_) = Σ{*m*ᵢ : *e*ᵢ.d = _a_} − Σ{*m*ᵢ : *e*ᵢ.c = _a_}

**Invariant:** Σ*B*(_a_) for all _a_ ∈ _A_ = 0

---

## Truth Log / Hash Chain (Theorem T2)

| Symbol | Type              | Definition                      | Code Reference         |
| ------ | ----------------- | ------------------------------- | ---------------------- |
| *ℓ*ⱼ   | Event             | The _j_-th event in log _L_     | `event_log` row        |
| _H_(·) | {0,1}* → {0,1}²⁵⁶ | SHA-256 hash function           | `createHash('sha256')` |
| *h*ⱼ   | {0,1}²⁵⁶          | Current hash of event _j_       | `current_hash` column  |
| *h*₀   | string            | Genesis hash = `"GENESIS_HASH"` | constant               |
| *π*ⱼ   | JSON              | Payload of event _j_            | `payload` column       |

**Definition (D2):**

> *h*ⱼ = _H_(*h*ⱼ₋₁ ‖ serialize(*π*ⱼ)) for _j_ ≥ 1
> *h*₀ = `GENESIS_HASH` (sentinel)

---

## Aegis Safety Protocol (Theorem T5)

| Symbol     | Type            | Definition                           | Code Reference                      |
| ---------- | --------------- | ------------------------------------ | ----------------------------------- |
| _R_        | Feasible region | Conjunction of all safety predicates | `validatePsychologicalGuardrails()` |
| _σ_        | ℤ>0             | Proposed stake amount (cents)        | `stakeAmount`                       |
| _σ̄_        | 50000           | Maximum stake ceiling (cents) = $500 | `MAX_STAKE_LIMIT`                   |
| _δ_        | ℤ>0             | Contract duration in days            | `durationDays`                      |
| _δ̲_        | 7               | Minimum contract duration (days)     | `MIN_DURATION_DAYS`                 |
| _κ_        | ℤ≥0             | Count of past consecutive failures   | `pastFailures`                      |
| _κ̄_        | 3               | Downscale trigger threshold          | `DOWNSCALE_STRIKE_THRESHOLD`        |
| _BMI_(_u_) | ℝ>0             | Body mass index of user _u_          | computed                            |
| _BMI̲_      | 18.5            | Minimum safe BMI                     | `MIN_SAFE_BMI`                      |
| *v*w       | ℝ               | Weekly weight loss rate (fraction)   | computed                            |
| *v̄*w       | 0.02            | Maximum safe weekly loss velocity    | `MAX_WEEKLY_LOSS_VELOCITY_PCT`      |
| _μ_(_t_)   | {1.0, 1.5}      | Volatility multiplier at time _t_    | `getVolatilityMultiplier()`         |

**Definition (D5) — Safety Predicate Set:**

> _R_ = *P*₁ ∧ *P*₂ ∧ *P*₃ ∧ *P*₄ ∧ *P*₅ ∧ *P*₆

Where:

- *P*₁: _σ_ ≤ _σ̄_ (absolute stake cap)
- *P*₂: _δ_ ≥ _δ̲_ (minimum duration)
- *P*₃: _κ_ < _κ̄_ ∨ _σ_ ≤ 5000 (failure downscaling)
- *P*₄: _IS_(_u_) ≥ 40 ∨ _σ_ ≤ 10000 (integrity-based cap)
- *P*₅: _BMI_(_u_) ≥ _BMI̲_ (health floor)
- *P*₆: *v*w ≤ *v̄*w (velocity cap)

---

## Dispute Resolution FSM (Theorem T6)

| Symbol | Type            | Definition                                                | Code Reference     |
| ------ | --------------- | --------------------------------------------------------- | ------------------ |
| _Q_    | Set             | FSM state set                                             | dispute states     |
| _Σ_    | Set             | Input alphabet (judge decisions)                          | `outcome` param    |
| *δ*FSM | _Q_ × _Σ_ → _Q_ | Transition function                                       | `resolveDispute()` |
| *q*₀   | State           | Initial state = `FEE_AUTHORIZED_PENDING_REVIEW`           | initial insert     |
| *q*F   | Set             | Terminal states: `{RESOLVED_UPHELD, RESOLVED_OVERTURNED}` | outcome mapping    |

**States:**

- *q*₁ = `FEE_AUTHORIZED_PENDING_REVIEW`
- *q*₂ = `IN_REVIEW`
- *q*₃ = `ESCALATED`
- *q*₄ = `RESOLVED_UPHELD` (terminal)
- *q*₅ = `RESOLVED_OVERTURNED` (terminal)

---

## Honeypot Detection (Theorem T7)

| Symbol | Type      | Definition                                     | Code Reference             |
| ------ | --------- | ---------------------------------------------- | -------------------------- |
| *Δ*⁺   | +5        | Integrity bonus for correct honeypot verdict   | `HONEYPOT_CORRECT_BONUS`   |
| *Δ*⁻   | −5        | Integrity penalty for missed honeypot          | `HONEYPOT_MISS_PENALTY`    |
| _ρ_    | ℝ ∈ [0,1] | Probability of correct honeypot identification | empirical                  |
| *N*F   | ℤ≥3       | Minimum active Furies for injection            | `MIN_FURIES_FOR_INJECTION` |
| *T*inj | 6h        | Injection cadence                              | `EVERY_6_HOURS`            |

---

## Recovery Protocol (Theorem T8)

| Symbol     | Type   | Definition                                                                          | Code Reference                    |
| ---------- | ------ | ----------------------------------------------------------------------------------- | --------------------------------- |
| *δ̄*R       | 30     | Maximum recovery contract duration (days)                                           | `MAX_NOCONTACT_DURATION_DAYS`     |
| *n̄*NC      | 3      | Maximum no-contact targets                                                          | `MAX_NOCONTACT_TARGETS`           |
| *χ̄*miss    | 3      | Missed attestations before auto-fail                                                | `NOCONTACT_MISS_STRIKE_THRESHOLD` |
| _AP_(_c_)  | string | Accountability partner for contract _c_                                             | `accountabilityPartnerEmail`      |
| _Ack_(_c_) | 𝔹⁴     | Safety acknowledgment tuple (voluntary, noMinors, noDependents, noLegalObligations) | `acknowledgments`                 |

**Definition (D8) — Anti-Isolation Predicate:**

> ∀*c* ∈ _C__recovery: |targets(_c_)| ≤ *n̄*NC ∧ duration(_c_) ≤ *δ̄*R ∧ _AP_(_c_) ≠ ∅ ∧ ∧*Ack*(_c_)

---

## pHash Duplicate Detection (Theorem T9)

| Symbol         | Type            | Definition                               | Code Reference            |
| -------------- | --------------- | ---------------------------------------- | ------------------------- |
| _pH_(·)        | Media → {0,1}⁶⁴ | Perceptual hash function                 | `computePHash()`          |
| *d*H(_x_, _y_) | ℤ≥0             | Hamming distance between hashes _x_, _y_ | `hammingDistance()`       |
| *θ*H           | 5               | Hamming distance threshold for duplicate | `PHASH_HAMMING_THRESHOLD` |
| _FPR_          | ℝ               | False positive rate upper bound          | computed                  |

**Definition (D9) — Duplicate Detection:**

> duplicate(*p*₁, *p*₂) ⟺ *d*H(_pH_(*p*₁), _pH_(*p*₂)) < *θ*H

---

## Behavioral Constants (Cross-cutting)

| Symbol     | Value        | Description                  | Code Reference               |
| ---------- | ------------ | ---------------------------- | ---------------------------- |
| _λ_        | 1.955        | Loss aversion coefficient    | `LOSS_AVERSION_COEFFICIENT`  |
| *g*max     | 2/month      | Maximum grace days per month | `MAX_GRACE_DAYS_PER_MONTH`   |
| *B*onboard | $5.00 (500¢) | Onboarding bonus             | `ONBOARDING_BONUS_AMOUNT`    |
| *σ*audit   | $2.00 (200¢) | Auditor stake per audit      | `AUDITOR_STAKE_AMOUNT`       |
| *σ*appeal  | $5.00 (500¢) | Appeal friction fee          | `APPEAL_FEE_AMOUNT`          |
| *τ*cool    | 7 days       | Failure cool-off period      | `FAILURE_COOL_OFF_DAYS`      |
| *τ*grace   | 24h          | Dispute grace period         | `DISPUTE_GRACE_PERIOD_HOURS` |

---

## Oath Category Taxonomy

| Stream        | Symbol | Categories | Verification Method                       |
| ------------- | ------ | ---------- | ----------------------------------------- |
| Biological    | *O*B   | 5 oaths    | Hardware oracle (HealthKit/HealthConnect) |
| Cognitive     | *O*C   | 4 oaths    | Device oracle (Screen Time API)           |
| Professional  | *O*P   | 3 oaths    | API oracle (third-party)                  |
| Creative      | *O*CR  | 4 oaths    | Time-lapse + Fury consensus               |
| Environmental | *O*E   | 4 oaths    | Fury consensus + GPS                      |
| Character     | *O*CH  | 3 oaths    | Multi-oracle                              |
| Recovery      | *O*R   | 4 oaths    | Daily attestation + Fury                  |

**Total:** 7 streams × variable categories = 27 oath types

---

## Operators and Abbreviations

| Notation      | Meaning                           |
| ------------- | --------------------------------- |
| ‖             | String concatenation              |
| clamp₀¹(_x_)  | max(0, min(1, _x_))               |
| max(0, ·)     | Floor at zero                     |
| ∧             | Logical AND (conjunction)         |
| ∀             | Universal quantifier              |
| ⟺             | If and only if                    |
| _C_(_n_, _k_) | Binomial coefficient "n choose k" |
| _O_(·)        | Big-O asymptotic notation         |
| 𝔹             | Boolean domain {true, false}      |
