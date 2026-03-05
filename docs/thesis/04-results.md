# Chapter 4: Results

This chapter presents the nine formal theorems that constitute the core analytical contribution of this dissertation. Each theorem establishes a mathematically provable property of the Styx platform, and each maps directly to working code with automated test coverage. The full proofs, including all intermediate steps, code-to-proof mappings, and worked examples, appear in the Appendix (Chapter 7) as self-contained proof documents. Here, we state each theorem, sketch the proof strategy, highlight the key result, and discuss its significance within the broader system design.

The theorems are organized into three groups that reflect the layered architecture of Styx's guarantees. The first group, *Financial Integrity* (Theorems T1 and T2), establishes that the monetary substrate is trustworthy: money cannot be created or destroyed, and the audit trail cannot be silently tampered with. The second group, *Behavioral Mechanisms* (Theorems T3, T4, and T5), demonstrates that the incentive and safety systems function correctly: the scoring mechanism penalizes defection more than it rewards compliance, truth-telling is the dominant auditor strategy, and harmful contracts are rejected before they enter the system. The third group, *Operational Guarantees* (Theorems T6 through T9), ensures that subsidiary processes terminate, converge, and detect correctly: disputes resolve in bounded time, dishonest auditors are detected within bounded cycles, recovery contracts cannot enable social isolation, and duplicate media submissions are identified with astronomically low false positive rates.

Together, these nine theorems form a defense-in-depth architecture whose conjunction provides comprehensive coverage of the financial, behavioral, and operational failure modes identified in Chapter 2. All proofs are constructive, and each construction maps to a specific code artifact verified by one or more of the platform's 467 automated tests.

---

## 4.1 Theorem T1: Ledger Balance Invariant

The first theorem addresses the most fundamental requirement of any financial system: that money is conserved. In Styx, where users stake real currency into behavioral contracts and auditors earn bounties, a ledger that could spontaneously create or destroy value would violate the fiduciary relationship between platform and users.

**Definition D1 (Net Account Balance).** Let *A* be the set of all ledger accounts and *E* = <*e*_1, *e*_2, ..., *e*_n> an ordered sequence of double-entry transactions where each *e*_i = (*d*_i, *c*_i, *m*_i) consists of a debit account *d*_i in *A*, a credit account *c*_i in *A*, and an amount *m*_i in Z>0 (integer cents, strictly positive), subject to the entry guard *d*_i != *c*_i for all *i*. The net balance of account *a* after *n* transactions is:

> *B*_n(*a*) = Sum_i {*m*_i : *d*_i = *a*} - Sum_i {*m*_i : *c*_i = *a*}

**Theorem T1 (Ledger Balance Invariant).** For any sequence of transactions *E* = <*e*_1, ..., *e*_n> satisfying the entry guard, the sum of all account balances is identically zero:

> Sum_{*a* in *A*} *B*_n(*a*) = 0, for all *n* >= 0

*Proof sketch.* The proof proceeds by strong induction on the number of transactions *n*. The base case is trivial: with no transactions, all balances are zero. For the inductive step, consider transaction *e*_{k+1} = (*d*_{k+1}, *c*_{k+1}, *m*_{k+1}). This transaction affects exactly two accounts, adding *m*_{k+1} to the debit account and subtracting *m*_{k+1} from the credit account. The net contribution to the global sum is +*m*_{k+1} - *m*_{k+1} = 0, preserving the invariant established by the inductive hypothesis. The entry guard (*d*_i != *c*_i) prevents degenerate self-referencing transactions, and the positive-amount constraint (*m*_i > 0) prevents zero-value or negative entries from bypassing the accounting structure. From an algebraic perspective, the ledger operates on the abelian group (Z, +, 0), and each transaction is a pair (+*m*, -*m*) whose sum is the identity element. The complete proof appears in the Appendix.

Three application-layer guards enforce the preconditions: positive amount, integer denomination, and distinct accounts. These guards are implemented in `recordTransaction()` within `ledger.service.ts` and are exercised by validation Gate 01 (`01-phantom-money-check.ts`), which programmatically verifies the invariant against a test ledger. A runtime defense-in-depth layer, `verifyLedgerIntegrity()`, recomputes the global balance sum and reports any deviation, providing ongoing monitoring independent of the proof-by-construction guarantee.

**Corollary T1.1 (Conservation of Stake).** For any contract *c* with associated ledger entries, the total amount debited equals the total amount credited. This follows immediately from T1 restricted to the contract-scoped sub-ledger, as verified by `getContractLedger()`. The practical consequence is that every cent staked into a behavioral contract is accounted for: it is either held in escrow, captured as a penalty, returned upon completion, or distributed as a Fury bounty --- but it never vanishes.

---

## 4.2 Theorem T2: Truth Log Tamper Evidence

While T1 guarantees that the ledger is internally consistent, T2 addresses whether the historical record can be silently altered after the fact. A ledger that preserves balance invariants but whose history can be rewritten offers no accountability. The truth log provides an append-only, hash-chained audit trail analogous to a blockchain, but implemented within a PostgreSQL database.

**Definition D2 (Hash Chain Construction).** The truth log is an ordered sequence *L* = <l_1, l_2, ..., l_n> of events where each event l_j carries a payload *pi*_j (event data as JSON) and a hash value *h*_j (the "current hash"). The hash chain is defined recursively:

> *h*_0 = "GENESIS_HASH" (sentinel constant)
> *h*_j = SHA-256(*h*_{j-1} || serialize(*pi*_j)), for *j* >= 1

where || denotes string concatenation and serialize() is deterministic JSON stringification.

**Theorem T2 (Truth Log Tamper Evidence).** Under the collision resistance assumption for SHA-256, any modification to an event l_j (1 <= *j* <= *n*) in the truth log is detectable by the `verifyChain()` procedure with overwhelming probability. More precisely: if an adversary modifies *pi*_j to *pi*_j' != *pi*_j, then `verifyChain()` reports corruption at position *j* (or earlier) with probability at least 1 - negl(256).

*Proof sketch.* The proof has four parts. First, *modification detection*: if the adversary changes the payload *pi*_j but not the stored hash *h*_j, then the recomputed hash h-hat_j = SHA-256(*h*_{j-1} || serialize(*pi*_j')) differs from *h*_j by the second preimage resistance of SHA-256, and the verification check flags the entry. Second, *cascading break*: if the adversary also updates *h*_j to match the new payload, the next entry l_{j+1} still stores the original *h*_j as its `previous_hash`, creating a link mismatch that propagates forward. To conceal the modification, the adversary must rewrite every entry from position *j* through *n* --- a cascading chain rewrite. Third, *rewrite cost*: such a rewrite requires (*n* - *j* + 1) SHA-256 computations and database UPDATE operations, and must contend with the `FOR UPDATE` lock acquired by `appendEvent()`, which serializes concurrent insertions. Fourth, *collision resistance*: SHA-256 provides 128-bit collision resistance (birthday bound), yielding a collision probability of at most q^2 / 2^257 after *q* hash queries --- negligible by any practical standard.

The `verifyChain()` procedure implements a linear-time chain walk with O(*n*) time complexity and O(1) working memory. It is important to note that the truth log is *tamper-evident*, not *tamper-proof*: an attacker with direct database access can modify entries, but such modifications are detectable. The implementation resides in `truth-log.service.ts`.

---

## 4.3 Theorem T3: Integrity Score Properties

The Integrity Score is the central reputation mechanism of the Styx platform. It governs which financial tiers a user may access, determining the maximum stake amount they can commit to a behavioral contract. The score must satisfy several properties simultaneously: it must be bounded below to prevent undefined behavior at negative values, monotonically increasing in positive actions to reward compliance, monotonically decreasing in negative actions to penalize defection, and calibrated such that penalties exceed the psychological threshold of loss aversion.

**Definition D3 (Integrity Score Function).** The Integrity Score *IS*: *U* -> Z>=0 is defined for user *u* with history (*c*_u, *f*_u, *s*_u, *d*_u) as:

> *IS*(*u*) = max(0, *IS*_0 + *beta*_c * *c*_u - *beta*_f * *f*_u - *beta*_s * *s*_u - *beta*_d * *d*_u)

where *IS*_0 = 50 (base score), *beta*_c = 5 (completion bonus), *beta*_f = 15 (fraud penalty), *beta*_s = 20 (strike penalty), and *beta*_d = 1 (inactivity decay per month). The tier function *T*: Z>=0 -> {RESTRICTED, T1, T2, T3, T4} assigns access levels at thresholds 20, 50, 100, and 500, with corresponding maximum stakes of $0, $20, $100, $1,000, and unlimited.

**Theorem T3 (Integrity Score Properties).** The Integrity Score *IS* satisfies six properties:

**(a) Lower Boundedness:** *IS*(*u*) >= 0 for all *u* in *U*, guaranteed by the max(0, ...) floor operator.

**(b) Upper Unboundedness:** For any target *M* > 0, a user with zero penalties and sufficiently many completions (*c*_u = ceil((*M* - 50)/5) + 1) achieves *IS* > *M*. The score has no ceiling, preserving long-term incentives for continued compliance.

**(c) Completion Monotonicity:** *IS* is strictly increasing in *c*_u (in the interior region above the floor), with each completion adding exactly *beta*_c = 5 points.

**(d) Penalty Anti-Monotonicity:** *IS* is strictly decreasing in *f*_u, *s*_u, and *d*_u (until the floor at 0), with each fraud strike subtracting 15 points and each failure strike subtracting 20 points.

**(e) Tier Nesting:** If *IS*(*u*) qualifies for tier *T*_k, then *u* also qualifies for all tiers *T*_j with *j* < *k*. The tier thresholds are strictly ordered (20 < 50 < 100 < 500), and `getAllowedTiers()` returns cumulative access.

**(f) Asymmetric Incentive:** The penalty-to-reward ratios are *beta*_f / *beta*_c = 15/5 = 3.0 and *beta*_s / *beta*_c = 20/5 = 4.0. Both exceed the loss aversion coefficient *lambda* = 1.955 (Kahneman & Tversky, 1979). The perceived penalty-to-reward ratios, accounting for loss aversion, are *lambda* * *beta*_f / *beta*_c = 5.87 and *lambda* * *beta*_s / *beta*_c = 7.82 --- well above the indifference threshold of 1.

Property (f) is the linchpin of the behavioral mechanism. Prospect theory predicts that individuals weight losses approximately 1.955 times more heavily than equivalent gains (Tversky & Kahneman, 1992). The Styx scoring system exploits this asymmetry: even before accounting for loss aversion, the raw penalty-to-reward ratios already exceed *lambda*. After accounting for loss aversion, the perceived penalty for a single fraud strike is equivalent to approximately 5.87 completions, creating a strong deterrent where rational agents strongly prefer compliance over defection. The implementation resides in `integrity.ts`. As illustrated in Figure 5, the tier thresholds create a step function mapping the continuous score to discrete access levels.

---

## 4.4 Theorem T4: Fury Accuracy Dominance

The Fury network is the system's most novel component and its most vulnerable to strategic manipulation. If auditors can profit from dishonest verdicts, the entire verification layer collapses. Theorem T4 establishes that the accuracy mechanism makes truth-telling the weakly dominant strategy.

**Definition D4 (Fury Accuracy Function).** The Fury Accuracy *FA*: *F* -> [0, 1] for auditor *v* with history (*a*_v, a-bar_v, *n*_v) is:

> *FA*(*v*) = clamp_01((*a*_v - *omega* * a-bar_v) / *n*_v), when *n*_v > 0
> *FA*(*v*) = 1.0, when *n*_v = 0

where *a*_v is successful audits, a-bar_v is false accusations, *n*_v is total audits, and *omega* = 3 is the false accusation penalty weight. Demotion occurs when *FA*(*v*) < 0.8 and *n*_v >= 10 (the burn-in period).

**Theorem T4 (Honest Auditor Dominance).** Under the Styx Fury accuracy mechanism with penalty weight *omega* = 3:

**(a)** An honest auditor (one who reports truthfully) maintains *FA* >= 0.8 if their error rate *epsilon* is at most 5% of total audits. The derivation is direct: FA = (1 - *epsilon*)*n* - 3*epsilon**n) / *n* = 1 - 4*epsilon*, which meets the 0.8 threshold when *epsilon* <= 0.05.

**(b)** A dishonest auditor who submits false accusations at rate *r* > 5% will be demoted after the 10-audit burn-in period. With *FA* = 1 - 4*r* < 0.8 and *n* >= 10, the `shouldDemoteFury()` function triggers demotion.

**(c)** Truth-telling is the weakly dominant strategy. The proof models each audit as a single-shot game where the auditor observes evidence and forms a posterior belief *q* = P(true state = FAIL | evidence). The expected Fury Accuracy contribution of reporting FAIL is (4*q* - 3)/*n*, while reporting PASS yields (1 - *q*)/*n*. Reporting FAIL is strictly better only when *q* > 0.8 --- that is, when the auditor is highly confident the proof genuinely fails. This conservative bias protects oath-takers from frivolous rejections: the 3x false accusation weight means auditors should only reject proofs when they are at least 80% certain of failure.

The strategic analysis, depicted in Figure 6, reveals that the 3x penalty weight effectively raises the evidentiary threshold for rejection. For truthful auditors who accurately calibrate their beliefs, this mechanism rewards honest assessment: correct verdicts accumulate credit, while the occasional honest error (at rates below 5%) does not trigger demotion. For strategic liars who attempt to harm oath-takers through false accusations, the mechanism is punitive: their accuracy drops below the demotion threshold, terminating their audit privileges and their bounty income.

This mechanism differs from classical peer prediction schemes. The Bayesian Truth Serum (Prelec, 2004) achieves incentive compatibility under a common prior assumption; Styx uses direct penalty weighting, which does not require a common prior but achieves only weak dominance. Kleros relies on Schelling focal points; Styx supplements accuracy tracking with honeypot probes (Theorem T7) for ground-truth calibration. TrueBit uses computational verification games with forced errors; Styx's honeypot injection serves an analogous function (Section 4.7). The implementation resides in `integrity.ts`.

---

## 4.5 Theorem T5: Aegis Safety (Contract Harm Prevention)

The Aegis Protocol addresses a problem unique to behavioral commitment platforms: the system must refuse to enforce contracts that would harm the user. Styx occupies a domain where users place themselves under coercive financial pressure to change their behavior, creating an iatrogenic risk: the platform itself could become an instrument of self-harm if it allows excessive stakes during emotional crises, unsafe eating disorder parameters, or gambling-like patterns of doubling down after failure.

**Definition D5 (Aegis Safety Predicate Set).** The Aegis Safety Predicate Set defines a feasibility region *R* in R^6 for behavioral contracts. A contract proposal characterized by the tuple (*sigma*, *delta*, *IS*, *kappa*, *BMI*, *v*_w) is admissible if and only if *R* = *P*_1 AND *P*_2 AND *P*_3 AND *P*_4 AND *P*_5 AND *P*_6 holds, where: *P*_1 caps the stake at *sigma*-bar = $500; *P*_2 enforces a minimum duration of *delta*-floor = 7 days; *P*_3 downscales stakes after *kappa* >= 3 consecutive failures; *P*_4 imposes integrity-based stake limits for low-trust users; *P*_5 enforces a BMI floor of 18.5 for biological contracts; and *P*_6 caps weekly weight loss velocity at 2%.

**Theorem T5 (Aegis Safety).** The Aegis Protocol safety predicate set *R* satisfies three properties:

**(a) Non-emptiness (Validity):** *R* != empty set. A constructive witness demonstrates satisfiability: a contract with *sigma* = $20, *delta* = 30 days, *kappa* = 0, *IS* = 50, *BMI* = 22.0, and *v*_w = 0.01 satisfies all six predicates simultaneously.

**(b) Harm Coverage (Completeness):** The complement R-bar captures all five identified iatrogenic harm scenarios. Revenge staking (a user impulsively staking $1,000 after a breakup) violates *P*_1. Eating disorder acceleration (a user with BMI 17.2 creating a weight loss contract) violates *P*_5. Financial spiral (a user with 4 consecutive failures staking $200 to "win it back") violates *P*_3. Meaningless commitment (a 2-day contract insufficient for behavioral change) violates *P*_2. Unsafe weight loss velocity (targeting 5 lbs/week, or 3.3% body weight) violates *P*_6. A sixth harm scenario, social isolation through no-contact contracts, is addressed by the complementary Recovery Protocol (Theorem T8).

**(c) Determinism:** Each predicate *P*_i is a comparison operation (integer or floating-point) evaluable in O(1) time. The conjunction *R* = *P*_1 AND ... AND *P*_6 evaluates in O(6) = O(1) time with no probabilistic evaluation, external data fetching, or iterative computation.

The Aegis Protocol also includes a volatility multiplier *mu*(*t*) that increases breach penalties by 50% during Friday and Saturday nights (9 PM -- 4 AM), reflecting self-control depletion peaks during weekend evenings (Baumeister et al., 2007). This multiplier does not affect contract admissibility but adjusts penalty severity at breach time. The feasibility region is visualized in Figure 7, depicting the (*sigma*, *IS*) cross-section where *P*_1, *P*_3, and *P*_4 interact to create a layered stake ceiling. The constraint interactions are noteworthy: *P*_1 AND *P*_3 together drop the effective maximum from $500 to $50 after 3 failures, while *P*_5 AND *P*_6 prevent both acute and chronic eating disorder patterns. The implementation resides in `aegis.service.ts`.

---

## 4.6 Theorem T6: Dispute Resolution Termination

When a user disagrees with a Fury verdict, the dispute resolution system must provide a fair appeals process that terminates in bounded time --- an appeals process that loops indefinitely would leave funds frozen and users in limbo.

**Definition D6 (Dispute Resolution FSM).** The dispute FSM is a 5-tuple *M* = (*Q*, *Sigma*, *delta*_FSM, *q*_0, *Q*_F) where the state set *Q* = {*q*_1, *q*_2, *q*_3, *q*_4, *q*_5} consists of FEE_AUTHORIZED_PENDING_REVIEW, IN_REVIEW, ESCALATED, RESOLVED_UPHELD, and RESOLVED_OVERTURNED. The initial state is *q*_0 = *q*_1, and the terminal states are *Q*_F = {*q*_4, *q*_5}. The transition function *delta*_FSM is a partial function defined on 7 of the 25 possible (state, input) pairs, as shown in Figure 2.

**Theorem T6 (Dispute Resolution Properties).** The dispute FSM *M* satisfies:

**(a) Termination:** Every dispute reaches a terminal state in at most 3 transitions from *q*_1. The proof enumerates all possible paths: direct resolution paths (*q*_1 -> *q*_2 -> *q*_4 or *q*_5, length 2) and escalated resolution paths (*q*_1 -> *q*_2 -> *q*_3 -> *q*_4 or *q*_5, length 3). The RE_REVIEW transition from *q*_3 back to *q*_2 introduces a potential cycle. Termination is guaranteed by a policy constraint limiting escalation depth to *k* = 1, yielding a maximum path length of 2 + *k* = 3. Without the policy bound, termination relies on the liveness assumption that the human judge will eventually render a final verdict (UPHOLD or OVERTURN).

**(b) Determinism:** Exhaustive enumeration of all 7 defined (state, input) pairs confirms that each maps to exactly one next state. TypeScript's union type system (`'UPHELD' | 'OVERTURNED' | 'ESCALATED'`) enforces exhaustive case coverage in the `resolveDispute()` method, preventing undefined transitions at compile time.

**(c) Financial Consistency:** In terminal state *q*_4 (RESOLVED_UPHELD), the appeal fee is captured as platform revenue and the original Fury verdict stands. In terminal state *q*_5 (RESOLVED_OVERTURNED), the appeal fee is cancelled (returned to the appellant) and the offending Furies receive a -10 integrity penalty. In both cases, exactly one of {capture, cancel} is applied --- never both, never neither. The entire `resolveDispute()` method executes within a PostgreSQL transaction, ensuring that partial state transitions cannot occur.

The ACID guarantee deserves emphasis. The most dangerous failure mode is a partial transition: the state updates to RESOLVED but the financial side effect fails, leaving the fee in limbo. By wrapping the entire resolution in a single PostgreSQL transaction, the implementation eliminates this failure mode. The implementation resides in `dispute.service.ts`.

---

## 4.7 Theorem T7: Honeypot Detection Lower Bound

Theorem T4 established that truth-telling is the dominant strategy, but the accuracy mechanism has a blind spot: an auditor who always votes PASS will never accumulate false accusations and will maintain a high accuracy score despite providing zero verification value. The honeypot system closes this gap by periodically injecting synthetic proofs with known-fail ground truth.

**Definition D7 (Honeypot Injection System).** The honeypot system injects known-fail synthetic proofs every *T*_inj = 6 hours, with a correct identification bonus *Delta*+ = +5 and a miss penalty *Delta*- = -5. An auditor's integrity trajectory under honeypot exposure is modeled as a random walk:

> *IS*_{t+1} = *IS*_t + *Delta*+ with probability *rho* (correct identification)
> *IS*_{t+1} = *IS*_t + *Delta*- with probability 1 - *rho* (missed honeypot)

where *rho* in [0, 1] is the auditor's honeypot detection probability.

**Theorem T7 (Honeypot Detection Lower Bound).** For a dishonest auditor with honeypot detection probability *rho* < 0.5:

**(a)** The expected number of honeypot cycles to reach RESTRICTED_MODE (*IS* < 20) from initial score *IS*_0 is at most (*IS*_0 - 20) / (5 * (1 - 2*rho*)). This follows from the optional stopping theorem for submartingales: when the walk has negative drift (expected displacement 5(2*rho* - 1) < 0), the first passage time to a lower barrier is bounded by distance divided by drift rate.

**(b)** For *rho* = 0 (a completely inattentive auditor who always votes PASS), the trajectory is deterministic: the score decreases by exactly 5 per cycle. Starting from *IS*_0 = 50, demotion occurs after (50 - 20)/5 = **6 cycles, or 36 hours**.

**(c)** For *rho* = 0.5 (random guessing), the walk is unbiased. By the classical gambler's ruin result, the expected hitting time is *k*(*N* - *k*) where *k* = 6 and *N* = 16 (in step units), yielding approximately **60 cycles, or 15 days**.

As depicted in Figure 8, the integrity trajectory under repeated honeypot injection reveals a clear separation between honest and dishonest auditors. Any auditor with *rho* < 0.5 faces certain eventual demotion (with probability 1), while auditors with *rho* > 0.5 see their scores drift upward, bounded only by the system ceiling.

The interaction between T4 and T7 creates a *pincer detection* architecture. An auditor who games T4 by always voting PASS will fail honeypots, triggering T7. An auditor who games T7 by always voting FAIL will accumulate false accusations on real proofs, triggering T4. The only stable strategy is honest, attentive auditing --- precisely the behavior the platform seeks to incentivize. The implementation resides in `honeypot.service.ts`.

---

## 4.8 Theorem T8: Anti-Isolation Guarantee

The Recovery Protocol addresses the most ethically sensitive category of behavioral contracts: no-contact commitments during addiction recovery or relationship detachment. These contracts carry a unique social risk: the platform could enable users to isolate themselves from their entire support network under the guise of self-improvement. This concern is not theoretical --- researchers have documented cases where commitment devices are weaponized for coercive control (Holt et al., 2003; Cordier et al., 2021).

**Definition D8 (Anti-Isolation Predicate).** The Anti-Isolation Predicate is a universally quantified conjunction over all recovery contracts:

> For all *c* in *C*_recovery: *Phi*(*c*) = *phi*_1(*c*) AND *phi*_2(*c*) AND *phi*_3(*c*) AND *phi*_4(*c*) AND *phi*_5(*c*)

where *phi*_1 limits no-contact targets to n-bar_NC = 3; *phi*_2 caps duration at delta-bar_R = 30 days; *phi*_3 requires a non-empty accountability partner external to the platform; *phi*_4 requires explicit voluntary consent; and *phi*_5 ensures no minors, dependents, or legal obligations are implicated.

**Theorem T8 (Anti-Isolation Guarantee).** The Recovery Protocol satisfies:

**(a) Isolation Prevention:** No recovery contract can target more than 3 individuals for no-contact enforcement. With contracts capped at 30 days, a user's social network disruption is bounded to at most 3 relationships for at most 30 days. The service rejects any proposal with more than 3 (or fewer than 1) targets before any database write occurs.

**(b) Temporal Bound:** No recovery contract can exceed 30 days without explicit renewal, forcing periodic welfare assessment. The 30-day cap aligns with Marlatt's (2005) relapse prevention model, which identifies the first 30 days of behavior change as the highest-risk period warranting clinical re-evaluation.

**(c) Witness Guarantee:** Every recovery contract requires at least one designated accountability partner identified by email address (external to the Styx platform), preventing closed-system feedback loops where a user's self-destructive commitments are invisible to anyone who could intervene.

**(d) Consent Completeness:** Every recovery contract requires explicit acknowledgment of four safety conditions --- voluntariness, no minors involved, no dependents affected, and no legal obligations violated --- forming a safety attestation tuple *Ack*(*c*) in B^4 where all four values must be true.

**(e) Conjunction Necessity:** All five predicates are independently necessary. The proof exhibits a specific harm scenario enabled by removing each predicate: without *phi*_1, a user could target 20 people, effectively self-isolating; without *phi*_2, indefinite no-contact commitments could evolve from therapeutic to harmful; without *phi*_3, the platform becomes a closed system invisible to potential interveners; without *phi*_4, an abusive partner could coerce a victim into targeting their support network; without *phi*_5, a parent could create a no-contact contract targeting their own minor children.

Theorem T8 is complementary to Theorem T5 (Aegis Safety). The Aegis Protocol covers financial harm (stake caps, failure downscaling) and physiological harm (BMI floor, velocity cap), while the Recovery Protocol covers social harm (target limits, accountability partner) and psychological harm (duration cap, consent verification). Together, they span all four identified harm domains without overlap, as documented in the interaction analysis in the Appendix. The implementation resides in `recovery-protocol.service.ts`.

---

## 4.9 Theorem T9: pHash Duplicate Detection Soundness

The final theorem addresses proof integrity at the media layer. When users submit photographic or video evidence of contract compliance, the system must detect duplicate submissions --- the same proof image resubmitted for multiple attestation periods. Styx uses perceptual hashing (pHash) rather than cryptographic hashing because it must tolerate innocuous variations such as format conversion, resizing, and minor compression artifacts, while still detecting substantive reuse.

**Definition D9 (Duplicate Detection Decision Rule).** The duplicate detection system operates on perceptual hashes *pH*: Media -> {0,1}^64 with Hamming distance *d*_H and threshold *theta*_H = 5:

> duplicate(*p*_1, *p*_2) iff *d*_H(*pH*(*p*_1), *pH*(*p*_2)) < *theta*_H

**Theorem T9 (pHash Duplicate Detection Soundness).** The Styx duplicate detection system with 64-bit perceptual hashes and Hamming threshold *theta*_H = 5 satisfies:

**(a) Completeness (True Duplicate Detection):** If *p*_1 and *p*_2 are perceptually identical (or near-identical with minor compression/resize artifacts), then *d*_H(*pH*(*p*_1), *pH*(*p*_2)) < *theta*_H with high probability. This follows from the locality-sensitive hashing property of well-designed perceptual hash functions (Zauner, 2010): identical images produce *d*_H = 0, format conversions produce *d*_H <= 3, and minor quality variations produce *d*_H <= 4 --- all below the threshold of 5.

**(b) Soundness (False Positive Bound):** Under the assumption that independently produced media yield approximately uniformly distributed 64-bit hashes, the false positive rate is:

> FPR = Sum_{k=0}^{4} C(64, k) / 2^64 = 679,121 / 18,446,744,073,709,551,616 approximately equals 3.68 * 10^{-14}

This corresponds to approximately 1 false positive per 27 trillion comparisons. The computation sums the binomial coefficients C(64, k) for k = 0, 1, 2, 3, 4, reflecting the probability that two independent 64-bit strings differ in fewer than 5 positions. As shown in Figure 9, the Hamming distance distribution for genuinely different media is centered at *d*_H = 32 (the expected value of Binomial(64, 0.5)), while duplicate media cluster at *d*_H <= 4, with a wide separation that makes the threshold of 5 a natural decision boundary.

**(c) Threshold Monotonicity:** The false positive rate FPR(*theta*_H) is monotonically increasing in *theta*_H (the CDF of Binomial(64, 0.5)), while the false negative rate FNR(*theta*_H) is monotonically decreasing. The choice *theta*_H = 5 is Pareto-optimal for the Styx use case: it catches exact and near-exact duplicates (the primary fraud vector of resubmitting old proofs) while maintaining an astronomically low false positive rate that ensures legitimate but similar proofs are not wrongly flagged.

An important limitation must be acknowledged: the current `computePHash()` is a deterministic hash of the URI string, functioning as a testing stub rather than a true DCT-based perceptual hash. The completeness guarantee (Part a) applies to a production pHash implementation (Zauner, 2010), not the stub. Parts (b) and (c) hold for any hash function that distributes independently across bits for unrelated inputs. Additionally, the current duplicate check performs a linear scan (O(*n*) comparisons); production deployment would require a VP-tree or LSH index for sub-linear search. The implementation resides in `anomaly.service.ts`.

---

## Chapter Summary

The nine theorems presented in this chapter establish a layered defense architecture spanning three levels of system guarantees.

At the foundation, *Financial Integrity* (T1, T2) ensures that the monetary substrate is trustworthy. Theorem T1 proves that the double-entry ledger conserves stake across all transactions, making "phantom money" --- value created or destroyed by the system --- provably impossible. Theorem T2 proves that the SHA-256 hash-chained truth log makes any post-hoc modification to the event history detectable with overwhelming probability. Together, these two theorems guarantee that users can trust the financial and historical records of the platform.

At the behavioral layer, *Behavioral Mechanisms* (T3, T4, T5) ensure that the incentive and safety systems function as designed. Theorem T3 establishes that the Integrity Score creates an asymmetric incentive structure where penalties exceed the loss aversion threshold, making defection perceived as approximately 6--8 times more costly than the reward of a single completion. Theorem T4 proves that truth-telling is the weakly dominant strategy for Fury auditors, with the 3x false accusation weight raising the evidentiary threshold for rejection to 80% confidence. Theorem T5 proves that the Aegis Protocol's six-predicate constraint set captures all five identified iatrogenic harm scenarios while maintaining a non-empty feasibility region for legitimate contracts. These three theorems collectively ensure that the platform's behavioral mechanisms align individual incentives with prosocial outcomes and prevent the platform from becoming an instrument of harm.

At the operational level, *Operational Guarantees* (T6, T7, T8, T9) ensure that subsidiary systems behave predictably. Theorem T6 proves that disputes terminate within 3 transitions with deterministic, financially consistent outcomes. Theorem T7 proves that the honeypot system demotes inattentive auditors within 36 hours (or 15 days for random guessers), closing the rubber-stamping loophole left by T4. Theorem T8 proves that recovery contracts cannot enable social isolation, with all five predicates independently necessary for harm prevention. Theorem T9 proves that duplicate media detection operates with a false positive rate of approximately 3.68 * 10^{-14}, ensuring proof integrity without wrongly penalizing legitimate submissions.

Several cross-theorem interactions deserve emphasis. The T4--T7 pincer demotes both types of dishonest auditors (false accusers via T4, rubber-stampers via T7), creating a strategy space where only honest auditing is stable. The T5--T8 complement covers all four harm domains (financial, physiological, social, psychological) without overlap. The T1--T2 stack ensures both instantaneous consistency (balance invariant) and historical integrity (tamper-evident log). These interactions reflect the deliberate architectural principle of defense in depth: each theorem addresses a specific failure mode, and their conjunction eliminates the gaps that any single guarantee would leave.

All nine proofs are constructive: each demonstrates its property through explicit mathematical construction that maps to a specific code artifact within the Styx codebase. The 467 automated tests exercise the code paths identified in the proof-to-code mappings, providing empirical verification that complements the formal guarantees. This dual validation strategy --- formal proof plus automated testing --- demonstrates that the Design Science Research framework can accommodate rigorous mathematical analysis alongside iterative artifact development.

Chapter 5 examines the implications of these results, discussing their theoretical contributions to the behavioral economics and mechanism design literatures, their practical significance for platform design, the limitations of the current proofs and implementations, and directions for future research.
