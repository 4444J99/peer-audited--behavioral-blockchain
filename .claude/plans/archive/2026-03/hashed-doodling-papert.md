# Doctoral Dissertation Plan: Styx Behavioral Market

**Date:** 2026-03-04
**Project:** `peer-audited--behavioral-blockchain`
**SOP:** https://organvm-v-logos.github.io/public-process/docs/sop-doctoral-dissertation/
**Readiness Score:** 11/12 (minimum 8/12)

---

## Context

The Styx project has accumulated 79 documents (21 research, 8 reference library, 6 legal, 5 architecture, 22 planning), 200+ academic citations, 467 tests, and 11 formally formalizable algorithms — but no unified scholarly treatment. This dissertation transforms operational knowledge into a ~45,000-word academic contribution following the ORGANVM Doctoral Dissertation SOP (5 phases, 8 chapters, 60+ references, formal proofs, APA 7th).

---

## Title

**"Loss-Averse Commitment Devices with Decentralized Peer Audit: A Cybernetic Framework for Financially-Staked Behavioral Contracts"**

*Subtitle: Design, Formalization, and Prototype Evaluation of the Styx Peer-Audited Behavioral Market*

---

## Research Questions

**RQ1.** How can loss aversion (λ=1.955) be operationalized as a calibrated penalty coefficient within a digital commitment device, and under what conditions does financially-staked behavioral contracting produce sustained habit adherence?

**RQ2.** What mechanism design properties must a decentralized peer-audit network satisfy to achieve incentive-compatible truthful reporting under subjective proof evaluation, collusion risk, and information asymmetry?

**RQ3.** Can a cybernetic model of human drives (the HVCS) — treating classical vices as interacting control nodes — serve as a principled design framework for behavioral technology?

**RQ4.** What formal safety invariants (the Aegis Protocol) are necessary and sufficient to prevent iatrogenic harm — revenge staking, eating disorder acceleration, financial spiral, and social isolation?

**RQ5.** How does the legal classification of financially-staked behavioral contracts map onto the skill-chance spectrum under U.S. gambling law?

---

## Thesis Statement

Behavioral technology platforms fail not from insufficient motivation delivery but from broken feedback loops. This dissertation proposes, formalizes, and prototypically implements a peer-audited behavioral market that restores consequence density through: (1) prospect-theoretic financial stakes calibrated by λ=1.955, (2) a decentralized audit network whose incentive compatibility is proved via mechanism design, and (3) a cybernetic drive-regulation model that treats platform feedback as a negative-feedback control surface. Through 9 formal proofs and a working prototype with 467+ tests, the dissertation demonstrates this architecture satisfies safety, financial integrity, and legal classification constraints while addressing the 3.9% 15-day retention crisis in digital health.

---

## 7 Research Traditions

| # | Tradition | Key Sources | Maps To |
|---|-----------|-------------|---------|
| 1 | Prospect Theory / Behavioral Economics | Kahneman & Tversky 1979; Thaler 1999; Laibson 1997 | λ=1.955, endowed progress, mental accounting |
| 2 | Mechanism Design / Game Theory | Myerson 2007; Prelec 2004; Witkowski & Parkes 2012 | Fury audit network, honeypot calibration |
| 3 | Control Theory / Cybernetics | Wiener 1948; Ashby 1956; Conant-Ashby | HVCS model, feedback loop analysis |
| 4 | Commitment Device Theory | Bryan, Karlan & Nelson 2010; O'Donoghue & Rabin 1999 | Contract design, grace days, cool-off |
| 5 | Two-Sided Markets / Platform Economics | Rochet & Tirole 2003; Ostrom 1990 | Integrity tiers, fee allocation, commons |
| 6 | Contingency Management / Addiction Science | Volpp et al. 2009; Stitzer & Petry 2018; Marlatt 2005 | Recovery protocol, 90-day timeline |
| 7 | Cryptographic Audit / Distributed Trust | Caldarelli & Ellul 2021; C2PA 2024; Resnick 2000 | Truth log, pHash, oracle problem |

---

## Chapter Outline

### Ch 0: Preliminary Pages (2,000–3,000 words)
- Title Page, Abstract (≤350 words), Acknowledgments, TOC, List of Figures (~18), List of Tables (~10), Abbreviations
- **Source:** New content entirely

### Ch 1: Introduction (4,000–6,000 words)
| Section | Content | Source |
|---------|---------|--------|
| 1.1 | The 3.9% retention crisis | `research--commitment-device-market-analysis.md` |
| 1.2 | The feedback loop failure hypothesis | `research--behavioral-physics-manifesto.md` |
| 1.3 | Styx system overview | `CLAUDE.md`, `architecture--truth-blockchain.md` |
| 1.4 | Research questions (RQ1–RQ5) | New |
| 1.5 | Scope and delimitations | New |
| 1.6 | Significance | `research--market-analysis-v2.md` ($50B TAM) |
| 1.7 | Key terms | `behavioral-logic.ts` constants |
| 1.8 | Dissertation organization | New |

### Ch 2: Literature Review (12,000–16,000 words)
| Section | Subsections | Primary Sources |
|---------|-------------|-----------------|
| 2.1 Behavioral Economics | Prospect theory, mental accounting, present bias, commitment devices | Kahneman/Tversky, Thaler, Laibson, Bryan et al. |
| 2.2 Habit Formation | Automaticity timeline, SDT, implementation intentions, COM-B | Lally, Ryan/Deci, Gollwitzer, Michie |
| 2.3 Cybernetic Models | Control theory foundations, HVCS, institutional feedback failure | Wiener, Ashby; `research--behavioral-physics-manifesto.md` |
| 2.4 Financial Incentives | CM in substance use, crowding-out problem | Volpp, Stitzer/Petry, Gneezy/Rustichini |
| 2.5 Mechanism Design | Revelation principle, BTS, peer prediction, reputation | Myerson, Prelec, Witkowski/Parkes, Resnick |
| 2.6 Oracle Problem | Off-chain evidence, content provenance, Sybil resistance | Caldarelli/Ellul, C2PA |
| 2.7 Platform Economics | Two-sided markets, commons governance | Rochet/Tirole, Ostrom |
| 2.8 Legal Landscape | Skill vs. chance, FBO, health data, FTC | `legal--performance-wagering.md`, `legal--aegis-protocol.md` |

**~70% synthesized from existing research docs; ~30% new academic framing**

### Ch 3: Methodology (6,000–9,000 words)
| Section | Content | Source |
|---------|---------|--------|
| 3.1 | Design Science Research (DSR) methodology | New (Hevner et al. 2004; Peffers et al. 2007) |
| 3.2 | System architecture (monorepo, dual-layer API, ledger, escrow) | `CLAUDE.md`, `architecture--truth-blockchain.md`, `schema.sql` |
| 3.3 | **9 Formal Definitions** (see below) | `integrity.ts`, `behavioral-logic.ts`, services |
| 3.4 | Verification methodology (467 tests, 8 gates, Playwright E2E) | Test configs, validation scripts |
| 3.5 | Ethical considerations (Aegis, recovery, privacy) | `aegis.service.ts`, `recovery-protocol.service.ts` |

**~40% synthesized; ~60% new formalization**

### Ch 4: Results — 9 Formal Proofs (3,000–5,000 words)
| Theorem | Statement | Mathematical Tool |
|---------|-----------|-------------------|
| T1 | Ledger Balance Invariant (no phantom money) | Group theory over (Z, +) |
| T2 | Truth Log Tamper Evidence | Cryptographic hash properties |
| T3 | Integrity Score Boundedness & Monotonicity | Real analysis |
| T4 | Fury Accuracy — Honest Auditor Dominance | Game theory / mechanism design |
| T5 | Aegis Safety — Contract Harm Prevention | CSP formalization |
| T6 | Dispute Resolution Termination & Determinism | Finite automaton theory |
| T7 | Honeypot Detection Rate Lower Bound | Markov chain convergence |
| T8 | Recovery Protocol Anti-Isolation Guarantee | Predicate logic |
| T9 | pHash Duplicate Detection Soundness | Information theory / Hamming space |

**100% new content**

### Ch 5: Discussion (7,000–10,000 words)
| Section | RQ Addressed | Key Comparisons |
|---------|--------------|-----------------|
| 5.1 | RQ1: Loss aversion as commitment engine | DietBet, HealthyWage, Beeminder |
| 5.2 | RQ2: Fury incentive compatibility | BTS, Kleros, TrueBit |
| 5.3 | RQ3: HVCS as design framework | Gamification (Habitica, Duolingo) |
| 5.4 | RQ4: Aegis safety invariants | 90-day recovery timeline, vulnerability windows |
| 5.5 | RQ5: Legal classification | Three-part test, predominance test, state matrix |
| 5.6 | Limitations | No live data, regulatory uncertainty, scalability |
| 5.7 | Future work | RCT design, on-chain migration, federated Fury, B2B |

**~50% synthesized; ~50% new interpretive discussion**

### Ch 6: References (1,500–2,500 words)
- 65–75 unique references in APA 7th
- **~90% from existing `research--academic-market-syllabus.md`; ~10% new DSR/control theory sources**

### Ch 7: Appendices (4,000–6,000 words)
- A: Algorithm listings (annotated TypeScript)
- B: Database schema (`schema.sql`)
- C: API endpoint spec
- D: Validation gate descriptions (gates 01–08)
- E: Test coverage summary
- F: Oath category taxonomy (7 streams × 4 categories)
- G: State transition diagrams (contract, dispute, proof)
- H: HVCS inter-regulation matrix

---

## 9 Formal Proofs — Detail

### T1: Ledger Balance Invariant
**Approach:** Induction on transaction sequence. Base case: empty ledger (sum = 0). Inductive step: `recordTransaction(debit, credit, amount)` adds +amount to debit, -amount to credit → net change = 0. Guards: amount > 0, debit ≠ credit, integer cents.
**Code:** `src/api/services/ledger/ledger.service.ts`
**Validation:** `scripts/validation/01-phantom-money-check.ts`

### T2: Truth Log Tamper Evidence
**Approach:** By collision resistance of SHA-256. Modification at position j produces h_j' ≠ h_j, propagating chain break. PostgreSQL immutability trigger provides defense in depth.
**Code:** `src/api/services/ledger/truth-log.service.ts`

### T3: Integrity Score Properties
**Approach:** Direct from definition IS(u) = max(0, 50 + 5c - 15f - 20s - d). Lower bound from max(0, ·). Monotonicity from positive/negative coefficients. Tier subset property from threshold ordering.
**Code:** `src/shared/libs/integrity.ts`

### T4: Fury Accuracy Dominance
**Approach:** Solve FA ≥ 0.8 for max tolerable false accusation ratio: a/n ≤ 0.05 (≈5%). The 3× penalty makes truth-telling dominant strategy.
**Code:** `src/shared/libs/integrity.ts`

### T5: Aegis Safety CSP
**Approach:** Define feasibility region R as conjunction of 6 safety predicates. Show R is non-empty (valid contracts exist) and complement captures all identified harm scenarios.
**Code:** `src/api/services/health/aegis.service.ts`

### T6: Dispute Resolution FSM
**Approach:** Enumerate all (state, input) → state transitions. Show: max 3 transitions to terminal state, determinism by exhaustive case analysis, financial consistency in each terminal state.
**Code:** `src/api/services/escrow/dispute.service.ts`

### T7: Honeypot Detection Lower Bound
**Approach:** Model auditor integrity as random walk with -5 per missed honeypot. Expected time to RESTRICTED_MODE (score < 20): O(IS₀ / 5) injection cycles.
**Code:** `src/api/services/intelligence/honeypot.service.ts`

### T8: Anti-Isolation Guarantee
**Approach:** Universally quantified predicates: |targets| ≤ 3 ∧ duration ≤ 30 ∧ accountability_partner ≠ null. Show conjunction prevents social isolation.
**Code:** `src/api/services/health/recovery-protocol.service.ts`

### T9: pHash Soundness
**Approach:** 64-bit hash, Hamming threshold < 10. False positive bound: Σ_{k=0}^{9} C(64,k) / 2^64.
**Code:** `src/api/services/anomaly/anomaly.service.ts`

---

## Production Phases

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| I: Research Notes | Weeks 1–4 | Annotated reading notes (8 category files), literature matrix, gap analysis, BibTeX bibliography, notation conventions |
| II: Mathematical Foundations | Weeks 5–10 | 9 proof drafts, 9 formal definitions, state machine diagrams, HVCS block diagram |
| III: Thesis Drafting | Weeks 11–22 | Ch 0+1 (wk 11-12), Ch 2 (wk 13-16), Ch 3 (wk 17-18), Ch 4 (wk 19-20), Ch 5+7 (wk 21-22) |
| IV: Integration | Weeks 23–26 | Unified manuscript, cross-references verified, word count audit, Ch 6 finalized |
| V: Publication | Weeks 27–30 | Final PDF, `docs/thesis/` committed, deployed to public-process site |

---

## File Structure

```
docs/thesis/
  00-preliminary-pages.md
  01-introduction.md
  02-literature-review.md
  03-methodology.md
  04-results.md
  05-discussion.md
  06-references.md
  07-appendices.md
  peer-audited--behavioral-blockchain-thesis.md   # unified
  thesis.bib                                       # BibTeX
  notation.md                                      # symbol table
  proofs/theorem-{01..09}-*.md                     # individual proofs
  notes/reading-notes--category-{1..8}.md          # annotated notes
  notes/literature-matrix.md
  notes/gap-analysis.md
  figures/*.svg                                    # diagrams
```

---

## Quality Gates

| Gate | Criterion | How to Verify |
|------|-----------|---------------|
| Q1 | Total 40,000–57,500 words | `wc -w docs/thesis/0*.md` |
| Q2 | ≥60 unique references | Count entries in `thesis.bib` |
| Q3 | 9 complete proofs (statement + proof + code mapping) | Review `proofs/` directory |
| Q4 | Code-proof consistency | `make test` (467+ pass) + gates 01–07 pass |
| Q5 | APA 7th formatting | Spot-check 20 random citations |
| Q6 | Cross-reference integrity | Every Ch 5 section cites Ch 4 results; every Ch 3 definition used in Ch 4 |
| Q7 | Figure/table numbering | Sequential within chapters, all referenced |
| Q8 | Originality | HVCS model is original application, not restatement |
| Q9 | Limitation honesty | §5.6 acknowledges: no live data, regulatory uncertainty, scalability unknowns |
| Q10 | SOP compliance | 8 chapters, ≥60 refs, proofs, APA 7th, 5 phases documented |

---

## Execution Strategy

Given the scale (~45,000 words, 9 proofs, 8 chapters), I propose building the dissertation **incrementally per SOP phase**, starting with Phase I (research notes + bibliography). Each phase produces a dated plan revision per the plan file discipline.

**Phase I deliverables (immediate next step):**
1. Create `docs/thesis/` directory structure
2. Generate `thesis.bib` from existing 76-entry academic syllabus
3. Write `notation.md` (symbol conventions for all 9 proofs)
4. Produce 8 reading-note files (one per citation category)
5. Write `literature-matrix.md` mapping sources → RQs
6. Write `gap-analysis.md` identifying missing sources

After Phase I, proceed to Phase II (mathematical foundations), then Phase III (chapter drafting).

---

## Critical Source Files

| File | Role in Dissertation |
|------|---------------------|
| `docs/research/research--academic-market-syllabus.md` | Primary bibliography (76 citations) |
| `src/shared/libs/integrity.ts` | Theorems 3, 4 (integrity + fury accuracy) |
| `src/shared/libs/behavioral-logic.ts` | Constants, oath taxonomy, λ=1.955 |
| `docs/research/research--behavioral-physics-manifesto.md` | HVCS model → §2.3, §5.3 |
| `src/api/services/ledger/truth-log.service.ts` | Theorem 2 (hash chain) |
| `src/api/services/health/aegis.service.ts` | Theorem 5 (safety CSP) |
| `src/api/services/escrow/dispute.service.ts` | Theorem 6 (dispute FSM) |
| `src/api/services/intelligence/honeypot.service.ts` | Theorem 7 (honeypot convergence) |
| `src/api/services/health/recovery-protocol.service.ts` | Theorem 8 (anti-isolation) |
| `src/api/services/ledger/ledger.service.ts` | Theorem 1 (ledger invariant) |
| `docs/legal/legal--performance-wagering.md` | §2.8, §5.5 (legal classification) |
| `docs/research/research--breakup-psychology-loss-aversion.md` | §5.4 (90-day recovery timeline) |
