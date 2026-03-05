# Gap Analysis

> **Purpose:** Identifies missing sources, underrepresented traditions, and coverage gaps in the current bibliography relative to dissertation requirements.
> **Current count:** ~91 sources | **Target:** 65–75 unique references cited in text
> **Date:** 2026-03-04

---

## Summary of Gaps

| Priority | Gap | Category | Sources Needed | Status |
|----------|-----|----------|----------------|--------|
| HIGH | Design Science Research methodology | Methodology | 0–1 more | Covered (Hevner, Peffers, Gregor) |
| HIGH | Control theory formalism for HVCS | Cat. 3 (new) | 1–2 more | Partially covered (Wiener, Ashby, Conant) |
| HIGH | Behavioral commitment device empirical studies | Cat. 1/3 | 2–3 more | Gap |
| MEDIUM | Crowding-out effect meta-analyses | Cat. 2/3 | 1–2 more | Gap |
| MEDIUM | International gambling law comparison | Cat. 6 | 1–2 more | Gap |
| MEDIUM | State privacy law (post-HIPAA) | Cat. 6 | 1 more | Gap |
| MEDIUM | Perceptual hashing formal properties | Cat. 8 | 1 more | Gap |
| LOW | Blockchain ledger formal verification | Cat. 8 | 0–1 more | Optional |
| LOW | B2B employee wellness programs | Cat. 7 | 1 more | Optional |
| LOW | Dispute resolution theory | Cat. 4 | 1 more | Optional |

---

## Detailed Gap Analysis

### GAP-1: Behavioral Commitment Device Empirical Studies (HIGH)

**Current coverage:** Bryan et al. (2010) provides the theoretical survey; Volpp et al. (2009) provides the landmark RCT. But the dissertation lacks empirical studies on DIGITAL commitment devices specifically.

**Missing sources to acquire:**
1. **Royer et al. (2015)** — "Incentives, Commitments, and Habit Formation in Exercise: Evidence from a Field Experiment" (*American Economic Journal: Applied Economics*). Tests commitment contracts for gym attendance with financial stakes. Directly comparable to Styx.
2. **Kaur, Kremer & Mullainathan (2015)** — "Self-Control at Work" (*Journal of Political Economy*). Field experiment on commitment devices in the workplace. Tests financial self-commitment for productivity.
3. **Giné, Karlan & Zinman (2010)** — "Put Your Money Where Your Butt Is: A Commitment Contract for Smoking Cessation" (*American Economic Journal: Applied Economics*). The CARES commitment savings product for smoking cessation — closest published study to Styx's model.

**Impact:** These three sources would strengthen §2.1 (commitment device evidence) and §5.1 (empirical comparison) significantly.

---

### GAP-2: Control Theory / Cybernetics for Behavioral Systems (HIGH)

**Current coverage:** Wiener (1948), Ashby (1956), Conant & Ashby (1970) provide foundational cybernetics. Carver & Scheier (1998) bridge to psychology. But the HVCS model in the behavioral-physics-manifesto.md is an original application — need stronger theoretical grounding.

**Missing sources to acquire:**
1. **Powers (1973)** — *Behavior: The Control of Perception* (Aldine). Perceptual Control Theory (PCT): behavior is the control of perception, not the response to stimuli. Directly supports the HVCS model's feedback-loop-first framework.
2. **Mansell & Carey (2015)** — "A Century of Psychology and Psychotherapy: Is an Understanding of 'Control' the Missing Link Between Theory, Research, and Practice?" (*Psychology and Psychotherapy*). Modern synthesis of PCT with clinical psychology.

**Impact:** These would ground the HVCS model (§2.3) in established perceptual control theory rather than presenting it as purely novel.

---

### GAP-3: Crowding-Out Effect (MEDIUM)

**Current coverage:** Gneezy & Rustichini (2000) establishes the basic effect. Ryan & Deci (2000) provides SDT framework. But the dissertation needs a more nuanced treatment of when financial incentives help vs. hurt.

**Missing sources to acquire:**
1. **Deci, Koestner & Ryan (1999)** — "A Meta-analytic Review of Experiments Examining the Effects of Extrinsic Rewards on Intrinsic Motivation" (*Psychological Bulletin*). The definitive meta-analysis on crowding-out: 128 experiments, nuanced by reward type and context.
2. **Bowles & Polania-Reyes (2012)** — "Economic Incentives and Social Preferences: Substitutes or Complements?" (*Journal of Economic Literature*). Theoretical framework for when incentives crowd out vs. crowd in social preferences.

**Impact:** Strengthens §2.1 (theoretical nuance on when stakes help) and §5.1 (explains Styx's tiered design as crowding-out mitigation).

---

### GAP-4: International Gambling Law (MEDIUM)

**Current coverage:** Exclusively US-focused. The dissertation should at least acknowledge international regulatory variation.

**Missing sources to acquire:**
1. **UK Gambling Commission framework** — UK's regulatory approach to skill-based gaming and novel financial products. The UK has more developed case law on the skill-chance spectrum.
2. **GDPR and behavioral data** — For EU expansion considerations. Specifically: the tension between truth log immutability and Article 17 (right to erasure).

**Impact:** Strengthens §2.8 and §5.5 with international comparison. Honest in §5.6 about geographic limitations.

---

### GAP-5: State Privacy Law (MEDIUM)

**Current coverage:** Turner Lee et al. (2021) notes HIPAA doesn't apply; Zarour et al. (2022) covers HIPAA technical safeguards. But the Washington My Health My Data Act (2023) and similar state laws are not covered.

**Missing source to acquire:**
1. **Washington My Health My Data Act (2023)** — Washington State HB 1155. First comprehensive state-level consumer health data privacy law outside of HIPAA. Applies to all entities collecting health data, not just covered entities.

**Impact:** Directly relevant to Styx's health data handling. Should be added to §2.8.

---

### GAP-6: Perceptual Hashing Formal Properties (MEDIUM)

**Current coverage:** No source provides formal mathematical properties of perceptual hashing. The Theorem T9 proof requires a reference for pHash's false positive rate derivation.

**Missing source to acquire:**
1. **Zauner (2010)** — "Implementation and Benchmarking of Perceptual Image Hash Functions" (Master's thesis, University of Applied Sciences, Hagenberg). Formal analysis of pHash collision properties and Hamming distance distributions.

**Impact:** Provides the mathematical foundation for Theorem T9's false positive bound calculation.

---

### GAP-7: Dispute Resolution / Online Arbitration (LOW)

**Current coverage:** Ostrom (1990) covers conflict resolution principles. But no source specifically addresses online dispute resolution (ODR) mechanisms.

**Optional source:**
1. **Katsh & Rabinovich-Einy (2017)** — *Digital Justice: Technology and the Internet of Disputes* (Oxford University Press). Framework for technology-assisted dispute resolution.

**Impact:** Would strengthen §2.7 (platform governance) and provide theoretical grounding for Theorem T6.

---

### GAP-8: B2B Employee Wellness (LOW)

**Current coverage:** Market reports cover consumer wellness. Missing: enterprise/employer-sponsored wellness programs.

**Optional source:**
1. **Mattke et al. (2013)** — "Workplace Wellness Programs Study: Final Report" (RAND Corporation). Comprehensive analysis of employer wellness program effectiveness and ROI.

**Impact:** Supports §5.7 (future B2B expansion path) with evidence on employer willingness to pay.

---

## Tradition Coverage Assessment

| Tradition | Current Sources | Target | Status |
|-----------|----------------|--------|--------|
| Prospect Theory / Behavioral Economics | 13 | 10+ | SUFFICIENT |
| Mechanism Design / Game Theory | 10 | 8+ | SUFFICIENT |
| Control Theory / Cybernetics | 4 | 5+ | NEEDS 1–2 more |
| Commitment Device Theory | 8 (overlaps Cat. 1) | 6+ | SUFFICIENT |
| Two-Sided Markets / Platform Economics | 7 | 5+ | SUFFICIENT |
| Contingency Management / Addiction Science | 11 | 8+ | SUFFICIENT |
| Cryptographic Audit / Distributed Trust | 10 | 8+ | SUFFICIENT |
| DSR Methodology | 3 | 2+ | SUFFICIENT |
| Formal Methods | 3 | 2+ | SUFFICIENT |

---

## Action Items

### Must-acquire (before Phase II):
1. [ ] Royer et al. (2015) — gym commitment contract RCT
2. [ ] Giné, Karlan & Zinman (2010) — CARES smoking commitment contract
3. [ ] Powers (1973) — Perceptual Control Theory
4. [ ] Zauner (2010) — pHash formal properties

### Should-acquire (before Phase III):
5. [ ] Kaur, Kremer & Mullainathan (2015) — workplace self-control
6. [ ] Deci, Koestner & Ryan (1999) — crowding-out meta-analysis
7. [ ] Bowles & Polania-Reyes (2012) — incentives & social preferences
8. [ ] Washington My Health My Data Act (2023) — state privacy law

### Nice-to-have (before Phase IV):
9. [ ] UK Gambling Commission framework — international comparison
10. [ ] GDPR Article 17 analysis — right to erasure vs. immutable logs
11. [ ] Katsh & Rabinovich-Einy (2017) — digital justice / ODR
12. [ ] Mattke et al. (2013) — workplace wellness evidence

---

## Post-Acquisition Bibliography Count

| Stage | Count | Target |
|-------|-------|--------|
| Current | ~91 entries in thesis.bib | — |
| After must-acquire | ~95 | — |
| After should-acquire | ~99 | — |
| After nice-to-have | ~103 | — |
| Cited in text (target) | 65–75 | 65–75 |

The bibliography intentionally exceeds the citation target to allow selective citation. Not all thesis.bib entries will appear in the final reference list — only those actually cited in chapters 1–5.
