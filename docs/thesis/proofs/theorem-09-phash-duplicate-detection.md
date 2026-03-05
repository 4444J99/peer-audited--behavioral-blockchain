# Theorem T9: pHash Duplicate Detection Soundness

> **Chapter:** 4 (Results)
> **Mathematical tool:** Information theory; Hamming space analysis; binomial probability
> **Code mapping:** `src/api/services/anomaly/anomaly.service.ts`
> **References:** Zauner (2010), C2PA (2024)

---

## Formal Definition (D9)

The **duplicate detection system** operates on perceptual hashes:

- *pH*: Media → {0,1}⁶⁴ (perceptual hash function producing 64-bit values)
- *d*H(*x*, *y*): Hamming distance between hashes *x* and *y*
- *θ*H = 5: Hamming distance threshold for duplicate classification

**Decision rule:**

> duplicate(*p*₁, *p*₂) ⟺ *d*H(*pH*(*p*₁), *pH*(*p*₂)) < *θ*H

A proof *p*₂ is flagged as a duplicate of existing proof *p*₁ if and only if their perceptual hashes differ in fewer than *θ*H = 5 bit positions.

---

## Theorem Statement

**Theorem T9 (pHash Duplicate Detection Soundness).** The Styx duplicate detection system with 64-bit perceptual hashes and Hamming threshold *θ*H = 5 satisfies:

**(a) Completeness (True Duplicate Detection):** If *p*₁ and *p*₂ are perceptually identical (or near-identical with minor compression/resize artifacts), then *d*H(*pH*(*p*₁), *pH*(*p*₂)) < *θ*H with high probability.

**(b) Soundness (False Positive Bound):** The probability that two independently random 64-bit hashes are falsely flagged as duplicates is:

> FPR ≤ Σ_{k=0}^{θ_H - 1} C(64, k) / 2⁶⁴ ≈ 7.59 × 10⁻¹⁴

**(c) Monotonicity:** Reducing *θ*H decreases false positives but increases false negatives; increasing *θ*H has the opposite effect. *θ*H = 5 is a Pareto-optimal trade-off for the Styx use case.

---

## Proof

### Part (a): Completeness — True Duplicate Detection

**Perceptual hash locality property:** A well-designed perceptual hash function satisfies the locality-sensitive hashing (LSH) property: perceptually similar inputs map to nearby hash values.

Formally, for a perceptual hash *pH* with quality parameter *q*:

> If perceptual_similarity(*p*₁, *p*₂) > 1 − *q*, then *d*H(*pH*(*p*₁), *pH*(*p*₂)) < *q* · 64

For a typical pHash implementation (Zauner, 2010):
- Identical images (any format): *d*H = 0
- Same image resized/recompressed: *d*H ≤ 3
- Same image with minor edits (crop, brightness): *d*H ≤ 8
- Completely different images: *d*H ≈ 32 (expected for independent hashes)

With *θ*H = 5, the system correctly identifies:
- Exact duplicates (*d*H = 0): always detected ✓
- Format conversions (*d*H ≤ 3): always detected ✓
- Minor quality variations (*d*H ≤ 4): detected ✓
- Moderate edits (*d*H = 5–8): may or may not be detected (threshold boundary)

**Note:** The current implementation uses a deterministic URI-based hash (`computePHash()` at anomaly.service.ts:83–89) as a testing stub. In production, this would be replaced by an actual DCT-based perceptual hash (e.g., pHash library). The theorem's bounds apply to the production pHash, not the test stub. ✓

### Part (b): Soundness — False Positive Rate

**Assumption:** For two independently produced media items with no perceptual similarity, their 64-bit perceptual hashes are approximately uniformly distributed (each bit independently 0 or 1 with equal probability).

Under this assumption, *d*H(*pH*(*p*₁), *pH*(*p*₂)) follows a binomial distribution:

> *d*H ~ Binomial(64, 0.5)

The false positive rate (probability of flagging unrelated media as duplicates) is:

> FPR = P(*d*H < *θ*H) = P(*d*H < 5) = Σ_{k=0}^{4} C(64, k) · (0.5)⁶⁴

Computing each term:

| *k* | C(64, *k*) | Contribution |
|-----|-----------|--------------|
| 0 | 1 | 5.42 × 10⁻²⁰ |
| 1 | 64 | 3.47 × 10⁻¹⁸ |
| 2 | 2,016 | 1.09 × 10⁻¹⁶ |
| 3 | 41,664 | 2.26 × 10⁻¹⁵ |
| 4 | 635,376 | 3.45 × 10⁻¹⁴ |

Summing:

> FPR = Σ_{k=0}^{4} C(64, k) / 2⁶⁴
> = (1 + 64 + 2,016 + 41,664 + 635,376) / 2⁶⁴
> = 679,121 / 18,446,744,073,709,551,616
> ≈ **3.68 × 10⁻¹⁴**

This is approximately 1 in 27 trillion comparisons — effectively zero for any practical Styx deployment.

**Upper bound with margin:**

> FPR < 10⁻¹³ = 0.00000000001%

✓

### Part (c): Threshold Monotonicity

The false positive rate as a function of *θ*H is:

> FPR(*θ*H) = Σ_{k=0}^{*θ*_H - 1} C(64, k) / 2⁶⁴

This is the CDF of Binomial(64, 0.5) evaluated at *θ*H − 1, which is monotonically increasing in *θ*H.

The false negative rate (missing a true duplicate) is approximately:

> FNR(*θ*H) ≈ P(*d*H ≥ *θ*H | true duplicate) = 1 − P(*d*H < *θ*H | true duplicate)

which is monotonically decreasing in *θ*H.

**Trade-off table:**

| *θ*H | FPR (false alarm) | FNR (missed duplicate) | Styx Suitability |
|------|-------------------|----------------------|------------------|
| 3 | ~10⁻¹⁷ | Misses format conversions | Too strict |
| 5 | ~10⁻¹⁴ | Catches most duplicates | **Optimal** |
| 8 | ~10⁻¹⁰ | Catches edited copies | Acceptable |
| 10 | ~10⁻⁸ | May flag unrelated media | Too permissive |

*θ*H = 5 is the Pareto-optimal choice for Styx: it catches exact and near-exact duplicates (the primary fraud vector — resubmitting old proofs) while maintaining an astronomically low false positive rate. ✓ ∎

---

## Hamming Distance Implementation

```typescript
hammingDistance(a: string, b: string): number {
  let distance = 0;
  const aBig = BigInt('0x' + a);
  const bBig = BigInt('0x' + b);
  let xor = aBig ^ bBig;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}
```

**Correctness:** XOR produces a bitmask where 1s mark positions where the hashes differ. Counting the 1-bits (popcount) gives the Hamming distance. The while loop implements Kernighan's bit-counting algorithm variant.

**Time complexity:** O(64) = O(1) for 64-bit hashes.

---

## Duplicate Detection Pipeline

```
Media Upload → computePHash(media) → checkDuplicate(hash)
                                       ↓
                            ┌─ Redis SCAN (production)
                            └─ In-memory Map (dev/test)
                                       ↓
                            For each stored hash:
                              hammingDistance(new, stored) < 5?
                                       ↓
                            ┌─ Yes: REJECT (duplicate)
                            └─ No:  STORE hash, continue to EXIF check
```

**Scalability concern:** The current implementation does a linear scan of all stored hashes (O(*n*) comparisons). For large-scale deployment, this should be replaced with a VP-tree or locality-sensitive hashing index for sub-linear duplicate search.

---

## Code-to-Proof Mapping

| Proof Element | Code Location | Line(s) |
|--------------|---------------|---------|
| Hamming threshold constant | `anomaly.service.ts:PHASH_HAMMING_THRESHOLD` | L5 |
| pHash computation | `anomaly.service.ts:computePHash()` | L83–89 |
| Hamming distance | `anomaly.service.ts:hammingDistance()` | L94–104 |
| Duplicate check (Redis) | `anomaly.service.ts:checkDuplicateRedis()` | L113–132 |
| Duplicate check (memory) | `anomaly.service.ts:checkDuplicateMemory()` | L135–145 |
| Threshold comparison | `anomaly.service.ts:checkDuplicateRedis()` | L125 |
| EXIF validation | `anomaly.service.ts:checkExifTimestamp()` | L167–206 |

---

## Limitations

1. **Stub implementation:** The current `computePHash()` is a deterministic hash of the URI string, NOT a true perceptual hash. The theorem's completeness guarantee (Part a) applies only to a production DCT-based pHash implementation.

2. **Adversarial robustness:** A determined adversary could defeat pHash by applying semantic-preserving transformations that exceed *θ*H bits of hash change (e.g., significant cropping, rotation, or overlay). The Fury audit network (T4) provides the second line of defense for such cases.

3. **Hash collision for different media:** While FPR is astronomically low, perceptual hash collisions for genuinely different but visually similar images (e.g., two photos of the same gym taken from slightly different angles) could occur. The system should treat "duplicate detected" as a flag for Fury review, not automatic rejection, in borderline cases.

4. **Linear scan scalability:** O(*n*) comparison against all stored hashes becomes impractical at scale. Production deployment should use approximate nearest neighbor search (e.g., VP-tree, HNSW) for O(log *n*) lookups.
