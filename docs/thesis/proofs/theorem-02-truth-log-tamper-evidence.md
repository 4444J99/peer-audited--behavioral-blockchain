# Theorem T2: Truth Log Tamper Evidence

> **Chapter:** 4 (Results)
> **Mathematical tool:** Cryptographic hash chain properties; collision resistance of SHA-256
> **Code mapping:** `src/api/services/ledger/truth-log.service.ts`
> **References:** Menezes et al. (1996), Caldarelli & Ellul (2021)

---

## Formal Definition (D2)

The **truth log** is an ordered sequence *L* = ⟨*ℓ*₁, *ℓ*₂, …, *ℓ*ₙ⟩ of events where each event *ℓ*ⱼ carries:
- *π*ⱼ: a JSON payload (event data)
- *h*ⱼ: a hash value (the "current hash")

The hash chain is defined recursively:

> *h*₀ = `"GENESIS_HASH"` (sentinel constant)
> *h*ⱼ = SHA-256(*h*ⱼ₋₁ ‖ serialize(*π*ⱼ))   for *j* ≥ 1

where ‖ denotes string concatenation and serialize(·) is deterministic JSON stringification.

---

## Theorem Statement

**Theorem T2 (Truth Log Tamper Evidence).** Under the collision resistance assumption for SHA-256, any modification to an event *ℓ*ⱼ (1 ≤ *j* ≤ *n*) in the truth log is detectable by the `verifyChain()` procedure with overwhelming probability.

More precisely: if an adversary modifies *π*ⱼ to *π*ⱼ' ≠ *π*ⱼ (or modifies *h*ⱼ₋₁), then `verifyChain()` reports corruption at position *j* (or earlier) with probability at least 1 − negl(256), where negl(·) is a negligible function.

---

## Proof

### Part 1: Modification at Position *j* Breaks the Chain

Suppose an adversary modifies event *ℓ*ⱼ by changing *π*ⱼ to *π*ⱼ' where *π*ⱼ' ≠ *π*ⱼ, but does NOT modify the stored hash *h*ⱼ.

The `verifyChain()` procedure recomputes:

> *ĥ*ⱼ = SHA-256(*h*ⱼ₋₁ ‖ serialize(*π*ⱼ'))

Since *π*ⱼ' ≠ *π*ⱼ, the hash inputs differ:

> *h*ⱼ₋₁ ‖ serialize(*π*ⱼ') ≠ *h*ⱼ₋₁ ‖ serialize(*π*ⱼ)

By the **second preimage resistance** of SHA-256:

> Pr[SHA-256(*x*) = SHA-256(*y*) | *x* ≠ *y*] ≤ negl(256)

Therefore *ĥ*ⱼ ≠ *h*ⱼ with overwhelming probability, and the verification check at line 33:

```typescript
if (recomputedHash !== row.current_hash) {
    corrupted.push(row.id);
}
```

flags event *ℓ*ⱼ as corrupted. ✓

### Part 2: Cascading Hash Modification

Suppose the adversary additionally modifies *h*ⱼ to match the new payload (i.e., sets *h*ⱼ ← *ĥ*ⱼ). Then at position *j* + 1, the verification checks:

> Is *h*ⱼ (now modified) = expectedPreviousHash (which equals the original *h*ⱼ)?

Since *ĥ*ⱼ ≠ *h*ⱼ (original), the `previous_hash` link check at line 24:

```typescript
if (row.previous_hash !== expectedPreviousHash) {
    corrupted.push(row.id);
}
```

fails at position *j* + 1 (because *ℓ*_{j+1}.previous_hash still stores the original *h*ⱼ).

To avoid this, the adversary must also modify *ℓ*_{j+1}.previous_hash and recompute *h*_{j+1}, which in turn breaks *ℓ*_{j+2}, and so on. This cascading modification requires rewriting the entire chain from position *j* to *n*.

### Part 3: Complete Chain Rewrite Cost

A complete chain rewrite from position *j* to *n* requires:
- (*n* − *j* + 1) SHA-256 computations
- (*n* − *j* + 1) database UPDATE operations within a single transaction (to maintain consistency)
- The `FOR UPDATE` lock in `appendEvent()` (line 65) serializes insertions, creating a race condition for the attacker

**Critical:** The `appendEvent()` method acquires a `FOR UPDATE` lock on the latest row before computing the next hash. An attacker attempting a concurrent rewrite must either:
1. Obtain the lock (blocking legitimate writes), or
2. Modify the database directly (bypassing application-layer controls)

Scenario (2) is detectable by the PostgreSQL immutability trigger (defense-in-depth layer) and by the runtime `verifyChain()` audit.

### Part 4: Collision Resistance Bound

SHA-256 provides 128-bit collision resistance (birthday bound). The probability of finding a collision after *q* queries is:

> Pr[collision] ≤ *q*² / 2²⁵⁷

For *q* = 2⁶⁴ queries (an astronomically large number of events), this gives:

> Pr[collision] ≤ 2¹²⁸ / 2²⁵⁷ = 2⁻¹²⁹ ≈ 10⁻³⁹

This is negligible by any practical standard. ∎

---

## Verification Procedure Specification

The `verifyChain()` method implements a linear-time chain walk:

```
VERIFY-CHAIN(L):
  expected ← "GENESIS_HASH"
  corrupted ← ∅
  for j ← 1 to |L|:
    if L[j].previous_hash ≠ expected:
      corrupted ← corrupted ∪ {j}
    ĥ ← SHA-256(L[j].previous_hash ‖ serialize(L[j].payload))
    if ĥ ≠ L[j].current_hash:
      corrupted ← corrupted ∪ {j}
    expected ← L[j].current_hash
  return (corrupted = ∅, |L|, corrupted)
```

**Time complexity:** O(*n*) where *n* = |*L*|
**Space complexity:** O(1) working memory (plus output set)

---

## Code-to-Proof Mapping

| Proof Element | Code Location | Line(s) |
|--------------|---------------|---------|
| Genesis hash constant | `truth-log.service.ts:appendEvent()` | L69 |
| Hash computation | `truth-log.service.ts:appendEvent()` | L75–76 |
| FOR UPDATE lock | `truth-log.service.ts:appendEvent()` | L65 |
| Chain verification | `truth-log.service.ts:verifyChain()` | L14–47 |
| Previous hash check | `truth-log.service.ts:verifyChain()` | L24 |
| Recomputed hash check | `truth-log.service.ts:verifyChain()` | L33 |

---

## Limitations

1. **Not tamper-proof, tamper-evident.** The truth log detects modification but cannot prevent it if an attacker has direct database access. Prevention requires hardware-backed integrity (e.g., TPM-sealed key for hash computation).

2. **Deterministic serialization assumption.** The proof assumes `JSON.stringify()` produces deterministic output. In JavaScript, object key ordering is deterministic for non-integer keys (insertion order), but this could be violated if payloads are reconstructed from database JSON columns with different key ordering. The current implementation serializes payloads identically at write and verification time because the same JSON column is read back.

3. **Single-chain topology.** The truth log is a single linear chain (not a Merkle tree or DAG). This provides O(*n*) verification but limits parallelism. A Merkle tree variant would provide O(log *n*) membership proofs at the cost of implementation complexity.
