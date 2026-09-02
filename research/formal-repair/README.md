# Formal Repair Starter

This directory converts the thesis proof documents into bounded, correction-preserving formal artifacts.

## Truth boundary

The nine documents under `docs/thesis/proofs/` are described collectively as **formal models and proof attempts linking claims to implementation**. They are not collectively described as nine proven theorems, as proof of production deployment, or as proof of behavioral efficacy or safety.

A green formal-repair workflow establishes only the bounded properties named below.

## Verified starter artifacts

- `lean/StyxLedger.lean` — a dependency-free Lean 4 proof that every declared double-entry posting contributes `amount + (-amount) = 0` and that the recursively accumulated posting total remains zero.
- `tla/StyxDispute.tla` — a bounded TLA+ dispute model with explicit fairness assumptions, absorbing terminal states, type and financial-consistency invariants, and eventual resolution under `MaxEscalations = 1`.
- `python/runtime_contract.py` — fail-closed derivation of the T7 threshold, reward, penalty, ceiling, and cadence from the TypeScript runtime source.
- `python/t7_markov.py` — an exact finite-state expected-hitting-time model plus Monte Carlo simulation for the honeypot score process.
- `python/t9_hamming.py` — the exact Hamming-ball null probability and a DCT-based 64-bit perceptual-hash implementation suitable for later empirical calibration.
- `python/styx_ledger.py` — an executable account-level double-entry invariant model.
- `python/tests/` — deterministic and randomized executable checks for the Python lane.

## Repository CI verification

Formal Repair workflow run **33687940706** completed successfully on 2 September 2026:

- **Python:** 13 tests passed, including runtime-source contract derivation, randomized ledger invariants, exact Markov results, Monte Carlo agreement, the exact Hamming calculation, and bounded image-hash behavior.
- **Lean 4:** the pinned Lean project built successfully and the axiom audit completed for `StyxLedger`.
- **TLA+:** SANY parsed the specification and TLC model-checked the declared invariants and liveness property for the bounded configuration.

These results are repository CI evidence for those bounded artifacts. They are not deployment evidence, user-outcome evidence, empirical safety evidence, or external academic review.

## Corrections established

### T7 — honeypot score process

The runtime contract derives:

- restricted condition: `integrity_score < 20`;
- correct-vote bonus: `+5`;
- missed-honeypot penalty: `-5`;
- score ceiling: `100`;
- cadence: every six hours.

Starting from 50 with deterministic misses, six cycles reach 20; **seven** cycles reach 15 and cross the restriction threshold. Under the exact finite chain with the runtime's ceiling clamp, the unbiased process has expected hitting time **196 cycles**, not 60.

### T9 — Hamming null model and perceptual hashing

For independent uniformly random 64-bit values and decision rule `d_H < 5`:

```text
P(d_H < 5) = 679121 / 2^64
             = 3.6815223179026413e-14
```

This is a null-model Hamming-space probability. It is not an empirical production false-positive rate for perceptual hashing. The DCT implementation in this directory is research infrastructure; the current product URI-hash path remains unchanged until a labeled corpus, ROC/precision-recall analysis, threshold calibration, and product-integration review exist.

## Remaining formal-repair gates

1. Narrow T2 to a declared adversary model with an external trusted checkpoint.
2. Split T3 into boundedness, weak-monotonicity, floor, and tier-nesting lemmas.
3. Preserve the T4 counterexample and redesign the incentive rule before making any dominance claim.
4. Reclassify T5 as an eligibility predicate until empirical safety validation exists.
5. Replace T8 guarantee language with bounded operational risk controls.
6. Build and publish the T9 labeled calibration study before changing the product detector.
7. Obtain independent mathematical, security, and domain review.
8. Update public/canonical thesis claims only after each corresponding repair gate passes.
