# Formal Repair Starter

This directory begins the conversion of the thesis proof documents into bounded, correction-preserving formal artifacts.

## Truth boundary

The nine documents under `docs/thesis/proofs/` are currently described as **formal models and proof attempts linking claims to implementation**. They are not collectively described as nine proven theorems, as formal verification, or as proof of deployment, behavioral efficacy, or safety.

## Current starter artifacts

- `lean/StyxLedger.lean` — candidate Lean 4/Mathlib proof that one double-entry transaction preserves total balance and that a list of transactions therefore has zero total balance.
- `tla/StyxDispute.tla` — candidate TLA+ specification for the dispute state machine with bounded escalation, financial-consistency invariants, and a liveness property.
- `python/t7_markov.py` — exact finite-state expected hitting-time model plus Monte Carlo simulation for the honeypot score process.
- `python/t9_hamming.py` — exact Hamming-ball null probability and a DCT-based 64-bit perceptual-hash implementation.
- `python/styx_ledger.py` — executable double-entry invariant model.
- `python/tests/` — executable tests for the Python lane.

## Verification status

- Python tests were executed in the originating audit environment: **12 passed**.
- The Lean source has **not** yet been machine-checked in repository CI.
- The TLA+ source has **not** yet been model-checked in repository CI.

Do not promote either candidate to `proved_machine_checked` or `model_checked_bounded` until those toolchains run from a clean checkout.

## Corrections already established

### T7

The implementation uses `integrity_score < 20` as the restricted condition. From 50 with deterministic -5 steps, six misses reach 20; **seven** misses reach 15 and trigger restriction. Under the exact finite chain with a clamp at 100, the unbiased process has expected hitting time **196 cycles**, not 60.

### T9

For independent uniformly random 64-bit values and decision rule `d_H < 5`:

```text
P(d_H < 5) = 679121 / 2^64
             = 3.6815223179026413e-14
```

This is a null-model Hamming-space probability. It is not an empirical production false-positive rate for perceptual hashing. Production claims require labeled transformations, unrelated-image pairs, ROC/precision-recall analysis, and threshold calibration.

## Required next gates

1. Add Lean 4/Mathlib CI and compile `lean/StyxLedger.lean`.
2. Add TLC CI and check `tla/StyxDispute.cfg`.
3. Preserve every counterexample trace.
4. Integrate the T7 exact model with the code-defined state/threshold constants.
5. Replace the URI-hash stub before calibrating T9.
6. Update the canonical claim records only after each gate passes.
