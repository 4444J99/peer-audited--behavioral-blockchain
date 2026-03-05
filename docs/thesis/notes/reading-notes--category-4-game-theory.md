# Reading Notes: Category 4 — Game Theory & Mechanism Design

> **Dissertation sections:** §2.5, §5.2
> **Research questions:** RQ2 (incentive-compatible peer audit), RQ3 (HVCS as framework)
> **Sources:** 10 entries (syllabus Cat. 4)
> **Date:** 2026-03-04

---

## Foundational Mechanism Design

### Myerson (2007) — Perspectives on Mechanism Design (Nobel Lecture)

**Key findings:**
- Revelation principle: any outcome achievable by ANY mechanism can be achieved by an incentive-compatible, direct-revelation mechanism
- Strategic information transmission requires either incentive alignment or costly verification
- Mechanism design is "reverse game theory": design the game to get the desired equilibrium

**Styx application:**
- The revelation principle validates that Styx's Fury system CAN be designed for truthful auditing
- The question is not "is truthful auditing possible?" but "what specific mechanism achieves it?"
- Theorem T4 (Fury Accuracy Dominance) formalizes the specific mechanism: 3× penalty weight makes truth-telling dominant

**Dissertation use:**
- §2.5 theoretical foundation: mechanism design as the formal framework for Fury network analysis
- §4 (T4 proof): invoke the revelation principle to establish the theoretical possibility, then prove specific incentive compatibility

### Nisan & Ronen (2001) — Algorithmic Mechanism Design

**Key findings:**
- Computational constraints interact with incentive constraints
- Polynomial-time mechanisms may sacrifice incentive compatibility (and vice versa)
- VCG mechanisms are incentive-compatible but computationally expensive for some problems

**Styx application:**
- Fury Router's BullMQ-based proof assignment is a practical algorithmic mechanism
- The routing algorithm must be computationally efficient (real-time) AND incentive-compatible
- Current implementation uses random assignment + weighted consensus — polynomial time, approximately IC

---

## Peer Prediction & Truthful Reporting

### Prelec (2004) — Bayesian Truth Serum

**Key findings:**
- Scoring mechanism incentivizes truthful reporting WITHOUT objective ground truth
- "Surprisingly common" answers receive higher scores
- Works for subjective data where verification is impossible
- Requires large population and common prior assumptions

**Styx application:**
- BTS is the theoretical gold standard for Fury verdict incentive compatibility
- Challenge: Styx has small auditor panels (3–7 per proof), not large populations
- Modified BTS: Styx uses consensus-based scoring instead of full BTS mathematics
- Future work: implement full BTS for high-stakes verdicts

### Witkowski & Parkes (2012) — Peer Prediction without Common Prior

**Key findings:**
- Extended peer prediction to heterogeneous belief settings
- Achieves strict incentive compatibility without assuming common priors
- Uses a "mirror" scoring rule that rewards correlation between reports

**Styx application:**
- Directly applicable: Fury auditors may have heterogeneous beliefs about proof quality
- Heterogeneous beliefs are especially relevant for subjective oath categories (Creative, Environmental)
- Current implementation approximates this with majority-vote consensus + accuracy weighting

---

## Reputation Systems

### Resnick et al. (2000) — Reputation Systems

**Key findings:**
- Three properties of effective reputation systems: long-lived entities, capture of feedback, visible history
- Challenges: initial trust bootstrapping, strategic behavior, identity changes
- Reputation must be costly to build and easy to lose

**Styx application:**
- Integrity Score satisfies all three properties: persistent user accounts, proof/audit feedback, visible score
- "Costly to build" (5 points per completion) and "easy to lose" (15 per fraud, 20 per strike) — asymmetric by design
- Strategic behavior risk: users might game the system by submitting easy oaths to inflate scores → tiered verification prevents this

### Resnick et al. (2006) — Reputation on eBay

**Key findings:**
- Controlled field experiment: high-reputation sellers earn 8.1% price premiums
- Reputation has measurable economic value
- New sellers face a trust deficit that takes time to overcome

**Styx application:**
- Higher integrity scores unlock higher staking tiers → tangible economic value of reputation
- New user onboarding bonus ($5) partially addresses the trust deficit
- B2B applications: integrity scores could have third-party economic value (employer verification)

---

## Anti-Collusion & Governance

### Schelling (1960) — Strategy of Conflict

**Key findings:**
- Focal points: natural coordination solutions without explicit communication
- The power of "salience" in creating natural equilibria
- Commitment and credible threats as strategic tools

**Styx application:**
- Fury auditors should converge on verdicts through focal points (clear proof criteria, explicit rubrics)
- Honeypot proofs test whether auditors coordinate on the "correct" focal point (FAIL)
- Clear proof submission guidelines create salient criteria that honest auditors naturally coordinate around

### Buterin, Hitzig & Weyl (2018) — Liberal Radicalism / Quadratic Funding

**Key findings:**
- Quadratic funding: amount = (Σ √individual_contributions)² allocates for public goods
- Anti-plutocracy property: many small contributions outweigh a few large ones
- Democratic allocation of shared resources without centralized authority

**Styx application:**
- Fury bounty economy should resist whale manipulation (one high-reputation Fury shouldn't dominate)
- Quadratic-style influence weighting: many low-reputation Furies agreeing outweighs one high-reputation dissenter
- Future governance: community rule changes could use quadratic voting

### Buterin (2021) — Moving Beyond Coin Voting

**Key findings:**
- Coin voting vulnerabilities: vote buying, collusion, plutocracy
- MACI (Minimal Anti-Collusion Infrastructure) using zkSNARKs prevents vote buying
- Identity-based alternatives: proof-of-personhood, proof-of-participation
- Conviction voting: sustained preference over time rather than one-shot voting

**Styx application:**
- Fury verdict collusion is the central adversarial threat to the network
- Honeypot injection is a practical anti-collusion mechanism (test probes detect coordinated dishonesty)
- Future: MACI-style encrypted verdicts could prevent Fury-to-Fury coordination
- Conviction voting concept maps to integrity score (sustained good behavior over time)

### Posner & Weyl (2018) — Radical Markets

**Key findings:**
- Quadratic voting for collective decisions
- COST (Common Ownership Self-assessed Tax) for resource allocation
- Diminishing marginal influence prevents plutocratic capture

**Styx application:**
- Informational — Styx doesn't currently use quadratic mechanisms
- Future governance model could adopt QV for community rule changes
- Relevant to §5.7 (future work)

---

## Synthesis for Theorem T4

### Proof strategy:
1. **Setup:** Define the Fury accuracy game: auditor *v* submits verdict *r* ∈ {PASS, FAIL} for proof *p* with true state *s* ∈ {PASS, FAIL}
2. **Payoff structure:** Correct verdict → +5 (via honeypot) or continued participation. False accusation → -3× weight in accuracy calculation
3. **Dominance argument:** Show that for any prior belief *q* = P(s = FAIL), the expected payoff of truthful reporting exceeds dishonest reporting
4. **Bound derivation:** Solve FA ≥ 0.8 for maximum tolerable false accusation ratio: *ā*/*n* ≤ 0.05 (5%)

### Key references for proof:
- Myerson (2007): revelation principle establishes theoretical possibility
- Prelec (2004): BTS provides the scoring mechanism template
- Witkowski & Parkes (2012): heterogeneous beliefs extension
- Resnick et al. (2000): reputation system design properties

### Key comparison (§5.2):
| System | Mechanism | Incentive Compatibility | Styx Comparison |
|--------|-----------|------------------------|-----------------|
| BTS | Bayesian scoring | IC under common prior | Modified: consensus + weighting |
| Kleros | Schelling point voting + staking | IC under focal point salience | Similar: honeypot tests focal convergence |
| TrueBit | Verification game with forced errors | IC under computational honesty | Similar: honeypot as forced error |
| Styx/Fury | Consensus + 3× penalty + honeypot | IC under honest-majority assumption | Novel combination |
