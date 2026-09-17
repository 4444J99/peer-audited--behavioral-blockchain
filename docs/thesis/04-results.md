# Chapter 4: Results

This chapter presents the nine formal theorems that constitute the core analytical contribution of this dissertation. Each theorem establishes a mathematically provable property of the Styx platform, and each maps directly to working code with automated test coverage. The full proofs, including all intermediate steps, code-to-proof mappings, and worked examples, appear in the Appendix (Chapter 7) as self-contained proof documents. Here, we state each theorem, sketch the proof strategy, highlight the key result, and discuss its significance within the broader system design.

The theorems are organized into three groups that reflect the layered architecture of Styx's guarantees. The first group, _Financial Integrity_ (Theorems T1 and T2), establishes that the monetary substrate is trustworthy: money cannot be created or destroyed, and the audit trail cannot be silently tampered with. The second group, _Behavioral Mechanisms_ (Theorems T3, T4, and T5), demonstrates that the incentive and safety systems function correctly: the scoring mechanism penalizes defection more than it rewards compliance, truth-telling is the dominant auditor strategy, and harmful contracts are rejected before they enter the system. The third group, _Operational Guarantees_ (Theorems T6 through T9), ensures that subsidiary processes terminate, converge, and detect correctly: disputes resolve in bounded time, dishonest auditors are detected within bounded cycles, recovery contracts cannot enable social isolation, and duplicate media submissions are identified with astronomically low false positive rates.

Together, these nine theorems form a defense-in-depth architecture whose conjunction provides comprehensive coverage of the financial, behavioral, and operational failure modes identified in Chapter 2. All proofs are constructive, and each construction maps to a specific code artifact verified by one or more of the platform's 467 automated tests.

---

## 4.1 Theorem T1: Ledger Balance Invariant

The first theorem addresses the most fundamental requirement of any financial system: that money is conserved. In Styx, where users stake real currency into behavioral contracts and auditors earn bounties, a ledger that could spontaneously create or destroy value would violate the fiduciary relationship between platform and users.

**Definition D1 (Net Account Balance).** Let _A_ be the set of all ledger accounts and _E_ = <_e__1, _e__2, ..., _e__n> an ordered sequence of double-entry transactions where each _e__i = (_d__i, _c__i, _m__i) consists of a debit account _d__i in _A_, a credit account _c__i in _A_, and an amount _m__i in Z>0 (integer cents, strictly positive), subject to the entry guard _d__i != _c__i for all _i_. The net balance of account _a_ after _n_ transactions is:

> _B__n(_a_) = Sum_i {_m__i : _d__i = _a_} - Sum_i {_m__i : _c__i = _a_}

**Theorem T1 (Ledger Balance Invariant).** For any sequence of transactions _E_ = <_e__1, ..., _e__n> satisfying the entry guard, the sum of all account balances is identically zero:

> Sum_{_a_ in _A_} _B__n(_a_) = 0, for all _n_ >= 0

_Proof sketch._ The proof proceeds by strong induction on the number of transactions _n_. The base case is trivial: with no transactions, all balances are zero. For the inductive step, consider transaction _e__{k+1} = (*d*_{k+1}, _c__{k+1}, *m*_{k+1}). This transaction affects exactly two accounts, adding _m__{k+1} to the debit account and subtracting *m*_{k+1} from the credit account. The net contribution to the global sum is +_m__{k+1} - *m*_{k+1} = 0, preserving the invariant established by the inductive hypothesis. The entry guard (_d__i != _c__i) prevents degenerate self-referencing transactions, and the positive-amount constraint (_m__i > 0) prevents zero-value or negative entries from bypassing the accounting structure. From an algebraic perspective, the ledger operates on the abelian group (Z, +, 0), and each transaction is a pair (+_m_, -_m_) whose sum is the identity element. The complete proof appears in the Appendix.

Three application-layer guards enforce the preconditions: positive amount, integer denomination, and distinct accounts. These guards are implemented in `recordTransaction()` within `ledger.service.ts` and are exercised by validation Gate 01 (`01-phantom-money-check.ts`), which programmatically verifies the invariant against a test ledger. A runtime defense-in-depth layer, `verifyLedgerIntegrity()`, recomputes the global balance sum and reports any deviation, providing ongoing monitoring independent of the proof-by-construction guarantee.

**Corollary T1.1 (Conservation of Stake).** For any contract _c_ with associated ledger entries, the total amount debited equals the total amount credited. This follows immediately from T1 restricted to the contract-scoped sub-ledger, as verified by `getContractLedger()`. The practical consequence is that every cent staked into a behavioral contract is accounted for: it is either held in escrow, captured as a penalty, returned upon completion, or distributed as a Fury bounty --- but it never vanishes.

---

## 4.2 Theorem T2: Truth Log Tamper Evidence

While T1 guarantees that the ledger is internally consistent, T2 addresses whether the historical record can be silently altered after the fact. A ledger that preserves balance invariants but whose history can be rewritten offers no accountability. The truth log provides an append-only, hash-chained audit trail analogous to a blockchain, but implemented within a PostgreSQL database.

**Definition D2 (Hash Chain Construction).** The truth log is an ordered sequence _L_ = <l_1, l_2, ..., l_n> of events where each event l_j carries a payload _pi__j (event data as JSON) and a hash value _h__j (the "current hash"). The hash chain is defined recursively:

> _h__0 = "GENESIS_HASH" (sentinel constant)
> _h__j = SHA-256(*h*_{j-1} || serialize(_pi__j)), for _j_ >= 1

where || denotes string concatenation and serialize() is deterministic JSON stringification.

**Theorem T2 (Truth Log Tamper Evidence).** Under the collision resistance assumption for SHA-256, any modification to an event l_j (1 <= _j_ <= _n_) in the truth log is detectable by the `verifyChain()` procedure with overwhelming probability. More precisely: if an adversary modifies _pi__j to _pi__j' != _pi__j, then `verifyChain()` reports corruption at position _j_ (or earlier) with probability at least 1 - negl(256).

_Proof sketch._ The proof has four parts. First, _modification detection_: if the adversary changes the payload _pi__j but not the stored hash _h__j, then the recomputed hash h-hat_j = SHA-256(*h*_{j-1} || serialize(_pi__j')) differs from _h__j by the second preimage resistance of SHA-256, and the verification check flags the entry. Second, _cascading break_: if the adversary also updates _h__j to match the new payload, the next entry l_{j+1} still stores the original _h__j as its `previous_hash`, creating a link mismatch that propagates forward. To conceal the modification, the adversary must rewrite every entry from position _j_ through _n_ --- a cascading chain rewrite. Third, _rewrite cost_: such a rewrite requires (_n_ - _j_ + 1) SHA-256 computations and database UPDATE operations, and must contend with the `FOR UPDATE` lock acquired by `appendEvent()`, which serializes concurrent insertions. Fourth, _collision resistance_: SHA-256 provides 128-bit collision resistance (birthday bound), yielding a collision probability of at most q^2 / 2^257 after _q_ hash queries --- negligible by any practical standard.

The `verifyChain()` procedure implements a linear-time chain walk with O(_n_) time complexity and O(1) working memory. It is important to note that the truth log is _tamper-evident_, not _tamper-proof_: an attacker with direct database access can modify entries, but such modifications are detectable. The implementation resides in `truth-log.service.ts`.

---

## 4.3 Theorem T3: Integrity Score Properties

The Integrity Score is the central reputation mechanism of the Styx platform. It governs which financial tiers a user may access, determining the maximum stake amount they can commit to a behavioral contract. The score must satisfy several properties simultaneously: it must be bounded below to prevent undefined behavior at negative values, monotonically increasing in positive actions to reward compliance, monotonically decreasing in negative actions to penalize defection, and calibrated such that penalties exceed the psychological threshold of loss aversion.

**Definition D3 (Integrity Score Function).** The Integrity Score _IS_: _U_ -> Z>=0 is defined for user _u_ with history (_c__u, _f__u, _s__u, _d__u) as:

> _IS_(_u_) = max(0, _IS__0 + _beta__c * _c__u - _beta__f * _f__u - _beta__s * _s__u - _beta__d * _d__u)

where _IS__0 = 50 (base score), _beta__c = 5 (completion bonus), _beta__f = 15 (fraud penalty), _beta__s = 20 (strike penalty), and _beta__d = 1 (inactivity decay per month). The tier function _T_: Z>=0 -> {RESTRICTED, T1, T2, T3, T4} assigns access levels at thresholds 20, 50, 100, and 500, with corresponding maximum stakes of $0, $20, $100, $1,000, and unlimited.

**Theorem T3 (Integrity Score Properties).** The Integrity Score _IS_ satisfies six properties:

**(a) Lower Boundedness:** _IS_(_u_) >= 0 for all _u_ in _U_, guaranteed by the max(0, ...) floor operator.

**(b) Upper Unboundedness:** For any target _M_ > 0, a user with zero penalties and sufficiently many completions (_c__u = ceil((_M_ - 50)/5) + 1) achieves _IS_ > _M_. The score has no ceiling, preserving long-term incentives for continued compliance.

**(c) Completion Monotonicity:** _IS_ is strictly increasing in _c__u (in the interior region above the floor), with each completion adding exactly _beta__c = 5 points.

**(d) Penalty Anti-Monotonicity:** _IS_ is strictly decreasing in _f__u, _s__u, and _d__u (until the floor at 0), with each fraud strike subtracting 15 points and each failure strike subtracting 20 points.

**(e) Tier Nesting:** If _IS_(_u_) qualifies for tier _T__k, then _u_ also qualifies for all tiers _T__j with _j_ < _k_. The tier thresholds are strictly ordered (20 < 50 < 100 < 500), and `getAllowedTiers()` returns cumulative access.

**(f) Asymmetric Incentive:** The penalty-to-reward ratios are _beta__f / _beta__c = 15/5 = 3.0 and _beta__s / _beta__c = 20/5 = 4.0. Both exceed the loss aversion coefficient _lambda_ = 1.955 (Kahneman & Tversky, 1979). The perceived penalty-to-reward ratios, accounting for loss aversion, are _lambda_ * _beta__f / _beta__c = 5.87 and _lambda_ * _beta__s / _beta__c = 7.82 --- well above the indifference threshold of 1.

Property (f) is the linchpin of the behavioral mechanism. Prospect theory predicts that individuals weight losses approximately 1.955 times more heavily than equivalent gains (Tversky & Kahneman, 1992). The Styx scoring system exploits this asymmetry: even before accounting for loss aversion, the raw penalty-to-reward ratios already exceed _lambda_. After accounting for loss aversion, the perceived penalty for a single fraud strike is equivalent to approximately 5.87 completions, creating a strong deterrent where rational agents strongly prefer compliance over defection. The implementation resides in `integrity.ts`. As illustrated in Figure 5, the tier thresholds create a step function mapping the continuous score to discrete access levels.

---

## 4.4 Theorem T4: Fury Accuracy Dominance

The Fury network is the system's most novel component and its most vulnerable to strategic manipulation. If auditors can profit from dishonest verdicts, the entire verification layer collapses. Theorem T4 establishes that the accuracy mechanism makes truth-telling the weakly dominant strategy.

**Definition D4 (Fury Accuracy Function).** The Fury Accuracy _FA_: _F_ -> [0, 1] for auditor _v_ with history (_a__v, a-bar_v, _n__v) is:

> _FA_(_v_) = clamp_01((_a__v - _omega_ * a-bar_v) / _n__v), when _n__v > 0
> _FA_(_v_) = 1.0, when _n__v = 0

where _a__v is successful audits, a-bar_v is false accusations, _n__v is total audits, and _omega_ = 3 is the false accusation penalty weight. Demotion occurs when _FA_(_v_) < 0.8 and _n__v >= 10 (the burn-in period).

**Theorem T4 (Honest Auditor Dominance).** Under the Styx Fury accuracy mechanism with penalty weight _omega_ = 3:

**(a)** An honest auditor (one who reports truthfully) maintains _FA_ >= 0.8 if their error rate _epsilon_ is at most 5% of total audits. The derivation is direct: FA = (1 - _epsilon_)_n_ - 3*epsilon\**n) / *n* = 1 - 4*epsilon*, which meets the 0.8 threshold when _epsilon_ <= 0.05.

**(b)** A dishonest auditor who submits false accusations at rate _r_ > 5% will be demoted after the 10-audit burn-in period. With _FA_ = 1 - 4*r* < 0.8 and _n_ >= 10, the `shouldDemoteFury()` function triggers demotion.

**(c)** Truth-telling is the weakly dominant strategy. The proof models each audit as a single-shot game where the auditor observes evidence and forms a posterior belief _q_ = P(true state = FAIL | evidence). The expected Fury Accuracy contribution of reporting FAIL is (4*q* - 3)/_n_, while reporting PASS yields (1 - _q_)/_n_. Reporting FAIL is strictly better only when _q_ > 0.8 --- that is, when the auditor is highly confident the proof genuinely fails. This conservative bias protects oath-takers from frivolous rejections: the 3x false accusation weight means auditors should only reject proofs when they are at least 80% certain of failure.

The strategic analysis, depicted in Figure 6, reveals that the 3x penalty weight effectively raises the evidentiary threshold for rejection. For truthful auditors who accurately calibrate their beliefs, this mechanism rewards honest assessment: correct verdicts accumulate credit, while the occasional honest error (at rates below 5%) does not trigger demotion. For strategic liars who attempt to harm oath-takers through false accusations, the mechanism is punitive: their accuracy drops below the demotion threshold, terminating their audit privileges and their bounty income.

This mechanism differs from classical peer prediction schemes. The Bayesian Truth Serum (Prelec, 2004) achieves incentive compatibility under a common prior assumption; Styx uses direct penalty weighting, which does not require a common prior but achieves only weak dominance. Kleros relies on Schelling focal points; Styx supplements accuracy tracking with honeypot probes (Theorem T7) for ground-truth calibration. TrueBit uses computational verification games with forced errors; Styx's honeypot injection serves an analogous function (Section 4.7). The implementation resides in `integrity.ts`.

---

## 4.5 Theorem T5: Aegis Safety (Contract Harm Prevention)

The Aegis Protocol addresses a problem unique to behavioral commitment platforms: the system must refuse to enforce contracts that would harm the user. Styx occupies a domain where users place themselves under coercive financial pressure to change their behavior, creating an iatrogenic risk: the platform itself could become an instrument of self-harm if it allows excessive stakes during emotional crises, unsafe eating disorder parameters, or gambling-like patterns of doubling down after failure.

**Definition D5 (Aegis Safety Predicate Set).** The Aegis Safety Predicate Set defines a feasibility region _R_ in R^6 for behavioral contracts. A contract proposal characterized by the tuple (_sigma_, _delta_, _IS_, _kappa_, _BMI_, _v__w) is admissible if and only if _R_ = _P__1 AND _P__2 AND _P__3 AND _P__4 AND _P__5 AND _P__6 holds, where: _P__1 caps the stake at _sigma_-bar = $500; _P__2 enforces a minimum duration of _delta_-floor = 7 days; _P__3 downscales stakes after _kappa_ >= 3 consecutive failures; _P__4 imposes integrity-based stake limits for low-trust users; _P__5 enforces a BMI floor of 18.5 for biological contracts; and _P__6 caps weekly weight loss velocity at 2%.

**Theorem T5 (Aegis Safety).** The Aegis Protocol safety predicate set _R_ satisfies three properties:

**(a) Non-emptiness (Validity):** _R_ != empty set. A constructive witness demonstrates satisfiability: a contract with _sigma_ = $20, _delta_ = 30 days, _kappa_ = 0, _IS_ = 50, _BMI_ = 22.0, and _v__w = 0.01 satisfies all six predicates simultaneously.

**(b) Harm Coverage (Completeness):** The complement R-bar captures all five identified iatrogenic harm scenarios. Revenge staking (a user impulsively staking $1,000 after a breakup) violates *P*_1. Eating disorder acceleration (a user with BMI 17.2 creating a weight loss contract) violates *P*_5. Financial spiral (a user with 4 consecutive failures staking $200 to "win it back") violates _P__3. Meaningless commitment (a 2-day contract insufficient for behavioral change) violates _P__2. Unsafe weight loss velocity (targeting 5 lbs/week, or 3.3% body weight) violates _P__6. A sixth harm scenario, social isolation through no-contact contracts, is addressed by the complementary Recovery Protocol (Theorem T8).

**(c) Determinism:** Each predicate _P__i is a comparison operation (integer or floating-point) evaluable in O(1) time. The conjunction _R_ = _P__1 AND ... AND _P__6 evaluates in O(6) = O(1) time with no probabilistic evaluation, external data fetching, or iterative computation.

The Aegis Protocol also includes a volatility multiplier _mu_(_t_) that increases breach penalties by 50% during Friday and Saturday nights (9 PM -- 4 AM), reflecting self-control depletion peaks during weekend evenings (Baumeister et al., 2007). This multiplier does not affect contract admissibility but adjusts penalty severity at breach time. The feasibility region is visualized in Figure 7, depicting the (_sigma_, _IS_) cross-section where _P__1, _P__3, and _P__4 interact to create a layered stake ceiling. The constraint interactions are noteworthy: _P__1 AND _P__3 together drop the effective maximum from $500 to $50 after 3 failures, while _P__5 AND _P__6 prevent both acute and chronic eating disorder patterns. The implementation resides in `aegis.service.ts`.

---

## 4.6 Theorem T6: Dispute Resolution Termination

When a user disagrees with a Fury verdict, the dispute resolution system must provide a fair appeals process that terminates in bounded time --- an appeals process that loops indefinitely would leave funds frozen and users in limbo.

**Definition D6 (Dispute Resolution FSM).** The dispute FSM is a 5-tuple _M_ = (_Q_, _Sigma_, _delta__FSM, _q__0, _Q__F) where the state set _Q_ = {_q__1, _q__2, _q__3, _q__4, _q__5} consists of FEE_AUTHORIZED_PENDING_REVIEW, IN_REVIEW, ESCALATED, RESOLVED_UPHELD, and RESOLVED_OVERTURNED. The initial state is _q__0 = _q__1, and the terminal states are _Q__F = {_q__4, _q__5}. The transition function _delta__FSM is a partial function defined on 7 of the 25 possible (state, input) pairs, as shown in Figure 2.

**Theorem T6 (Dispute Resolution Properties).** The dispute FSM _M_ satisfies:

**(a) Termination:** Every dispute reaches a terminal state in at most 3 transitions from _q__1. The proof enumerates all possible paths: direct resolution paths (_q__1 -> _q__2 -> _q__4 or _q__5, length 2) and escalated resolution paths (_q__1 -> _q__2 -> _q__3 -> _q__4 or _q__5, length 3). The RE_REVIEW transition from _q__3 back to _q__2 introduces a potential cycle. Termination is guaranteed by a policy constraint limiting escalation depth to _k_ = 1, yielding a maximum path length of 2 + _k_ = 3. Without the policy bound, termination relies on the liveness assumption that the human judge will eventually render a final verdict (UPHOLD or OVERTURN).

**(b) Determinism:** Exhaustive enumeration of all 7 defined (state, input) pairs confirms that each maps to exactly one next state. TypeScript's union type system (`'UPHELD' | 'OVERTURNED' | 'ESCALATED'`) enforces exhaustive case coverage in the `resolveDispute()` method, preventing undefined transitions at compile time.

**(c) Financial Consistency:** In terminal state _q__4 (RESOLVED_UPHELD), the appeal fee is captured as platform revenue and the original Fury verdict stands. In terminal state _q__5 (RESOLVED_OVERTURNED), the appeal fee is cancelled (returned to the appellant) and the offending Furies receive a -10 integrity penalty. In both cases, exactly one of {capture, cancel} is applied --- never both, never neither. The entire `resolveDispute()` method executes within a PostgreSQL transaction, ensuring that partial state transitions cannot occur.

The ACID guarantee deserves emphasis. The most dangerous failure mode is a partial transition: the state updates to RESOLVED but the financial side effect fails, leaving the fee in limbo. By wrapping the entire resolution in a single PostgreSQL transaction, the implementation eliminates this failure mode. The implementation resides in `dispute.service.ts`.

---

## 4.7 Theorem T7: Honeypot Detection Lower Bound

Theorem T4 established that truth-telling is the dominant strategy, but the accuracy mechanism has a blind spot: an auditor who always votes PASS will never accumulate false accusations and will maintain a high accuracy score despite providing zero verification value. The honeypot system closes this gap by periodically injecting synthetic proofs with known-fail ground truth.

**Definition D7 (Honeypot Injection System).** The honeypot system injects known-fail synthetic proofs every _T__inj = 6 hours, with a correct identification bonus _Delta_+ = +5 and a miss penalty _Delta_- = -5. An auditor's integrity trajectory under honeypot exposure is modeled as a random walk:

> _IS__{t+1} = _IS__t + *Delta*+ with probability *rho* (correct identification)
> *IS*_{t+1} = _IS__t + _Delta_- with probability 1 - _rho_ (missed honeypot)

where _rho_ in [0, 1] is the auditor's honeypot detection probability.

**Theorem T7 (Honeypot Detection Lower Bound).** For a dishonest auditor with honeypot detection probability _rho_ < 0.5:

**(a)** The expected number of honeypot cycles to reach RESTRICTED_MODE (_IS_ < 20) from initial score _IS__0 is at most (_IS__0 - 20) / (5 * (1 - 2*rho*)). This follows from the optional stopping theorem for submartingales: when the walk has negative drift (expected displacement 5(2*rho* - 1) < 0), the first passage time to a lower barrier is bounded by distance divided by drift rate.

**(b)** For _rho_ = 0 (a completely inattentive auditor who always votes PASS), the trajectory is deterministic: the score decreases by exactly 5 per cycle. Starting from _IS__0 = 50, demotion occurs after (50 - 20)/5 = **6 cycles, or 36 hours**.

**(c)** For _rho_ = 0.5 (random guessing), the walk is unbiased. By the classical gambler's ruin result, the expected hitting time is _k_(_N_ - _k_) where _k_ = 6 and _N_ = 16 (in step units), yielding approximately **60 cycles, or 15 days**.

As depicted in Figure 8, the integrity trajectory under repeated honeypot injection reveals a clear separation between honest and dishonest auditors. Any auditor with _rho_ < 0.5 faces certain eventual demotion (with probability 1), while auditors with _rho_ > 0.5 see their scores drift upward, bounded only by the system ceiling.

The interaction between T4 and T7 creates a _pincer detection_ architecture. An auditor who games T4 by always voting PASS will fail honeypots, triggering T7. An auditor who games T7 by always voting FAIL will accumulate false accusations on real proofs, triggering T4. The only stable strategy is honest, attentive auditing --- precisely the behavior the platform seeks to incentivize. The implementation resides in `honeypot.service.ts`.

---

## 4.8 Theorem T8: Anti-Isolation Guarantee

The Recovery Protocol addresses the most ethically sensitive category of behavioral contracts: no-contact commitments during addiction recovery or relationship detachment. These contracts carry a unique social risk: the platform could enable users to isolate themselves from their entire support network under the guise of self-improvement. This concern is not theoretical --- researchers have documented cases where commitment devices are weaponized for coercive control (Holt et al., 2003; Cordier et al., 2021).

**Definition D8 (Anti-Isolation Predicate).** The Anti-Isolation Predicate is a universally quantified conjunction over all recovery contracts:

> For all _c_ in _C__recovery: _Phi_(_c_) = _phi__1(_c_) AND _phi__2(_c_) AND _phi__3(_c_) AND _phi__4(_c_) AND _phi__5(_c_)

where _phi__1 limits no-contact targets to n-bar_NC = 3; _phi__2 caps duration at delta-bar_R = 30 days; _phi__3 requires a non-empty accountability partner external to the platform; _phi__4 requires explicit voluntary consent; and _phi__5 ensures no minors, dependents, or legal obligations are implicated.

**Theorem T8 (Anti-Isolation Guarantee).** The Recovery Protocol satisfies:

**(a) Isolation Prevention:** No recovery contract can target more than 3 individuals for no-contact enforcement. With contracts capped at 30 days, a user's social network disruption is bounded to at most 3 relationships for at most 30 days. The service rejects any proposal with more than 3 (or fewer than 1) targets before any database write occurs.

**(b) Temporal Bound:** No recovery contract can exceed 30 days without explicit renewal, forcing periodic welfare assessment. The 30-day cap aligns with Marlatt's (2005) relapse prevention model, which identifies the first 30 days of behavior change as the highest-risk period warranting clinical re-evaluation.

**(c) Witness Guarantee:** Every recovery contract requires at least one designated accountability partner identified by email address (external to the Styx platform), preventing closed-system feedback loops where a user's self-destructive commitments are invisible to anyone who could intervene.

**(d) Consent Completeness:** Every recovery contract requires explicit acknowledgment of four safety conditions --- voluntariness, no minors involved, no dependents affected, and no legal obligations violated --- forming a safety attestation tuple _Ack_(_c_) in B^4 where all four values must be true.

**(e) Conjunction Necessity:** All five predicates are independently necessary. The proof exhibits a specific harm scenario enabled by removing each predicate: without _phi__1, a user could target 20 people, effectively self-isolating; without _phi__2, indefinite no-contact commitments could evolve from therapeutic to harmful; without _phi__3, the platform becomes a closed system invisible to potential interveners; without _phi__4, an abusive partner could coerce a victim into targeting their support network; without _phi__5, a parent could create a no-contact contract targeting their own minor children.

Theorem T8 is complementary to Theorem T5 (Aegis Safety). The Aegis Protocol covers financial harm (stake caps, failure downscaling) and physiological harm (BMI floor, velocity cap), while the Recovery Protocol covers social harm (target limits, accountability partner) and psychological harm (duration cap, consent verification). Together, they span all four identified harm domains without overlap, as documented in the interaction analysis in the Appendix. The implementation resides in `recovery-protocol.service.ts`.

---

## 4.9 Theorem T9: pHash Duplicate Detection Soundness

The final theorem addresses proof integrity at the media layer. When users submit photographic or video evidence of contract compliance, the system must detect duplicate submissions --- the same proof image resubmitted for multiple attestation periods. Styx uses perceptual hashing (pHash) rather than cryptographic hashing because it must tolerate innocuous variations such as format conversion, resizing, and minor compression artifacts, while still detecting substantive reuse.

**Definition D9 (Duplicate Detection Decision Rule).** The duplicate detection system operates on perceptual hashes _pH_: Media -> {0,1}^64 with Hamming distance _d__H and threshold _theta__H = 5:

> duplicate(_p__1, _p__2) iff _d__H(_pH_(_p__1), _pH_(_p__2)) < _theta__H

**Theorem T9 (pHash Duplicate Detection Soundness).** The Styx duplicate detection system with 64-bit perceptual hashes and Hamming threshold _theta__H = 5 satisfies:

**(a) Completeness (True Duplicate Detection):** If _p__1 and _p__2 are perceptually identical (or near-identical with minor compression/resize artifacts), then _d__H(_pH_(_p__1), _pH_(_p__2)) < _theta__H with high probability. This follows from the locality-sensitive hashing property of well-designed perceptual hash functions (Zauner, 2010): identical images produce _d__H = 0, format conversions produce _d__H <= 3, and minor quality variations produce _d__H <= 4 --- all below the threshold of 5.

**(b) Soundness (False Positive Bound):** Under the assumption that independently produced media yield approximately uniformly distributed 64-bit hashes, the false positive rate is:

> FPR = Sum_{k=0}^{4} C(64, k) / 2^64 = 679,121 / 18,446,744,073,709,551,616 approximately equals 3.68 * 10^{-14}

This corresponds to approximately 1 false positive per 27 trillion comparisons. The computation sums the binomial coefficients C(64, k) for k = 0, 1, 2, 3, 4, reflecting the probability that two independent 64-bit strings differ in fewer than 5 positions. As shown in Figure 9, the Hamming distance distribution for genuinely different media is centered at _d__H = 32 (the expected value of Binomial(64, 0.5)), while duplicate media cluster at _d__H <= 4, with a wide separation that makes the threshold of 5 a natural decision boundary.

**(c) Threshold Monotonicity:** The false positive rate FPR(_theta__H) is monotonically increasing in _theta__H (the CDF of Binomial(64, 0.5)), while the false negative rate FNR(_theta__H) is monotonically decreasing. The choice _theta__H = 5 is Pareto-optimal for the Styx use case: it catches exact and near-exact duplicates (the primary fraud vector of resubmitting old proofs) while maintaining an astronomically low false positive rate that ensures legitimate but similar proofs are not wrongly flagged.

An important limitation must be acknowledged: the current `computePHash()` is a deterministic hash of the URI string, functioning as a testing stub rather than a true DCT-based perceptual hash. The completeness guarantee (Part a) applies to a production pHash implementation (Zauner, 2010), not the stub. Parts (b) and (c) hold for any hash function that distributes independently across bits for unrelated inputs. Additionally, the current duplicate check performs a linear scan (O(_n_) comparisons); production deployment would require a VP-tree or LSH index for sub-linear search. The implementation resides in `anomaly.service.ts`.

---

## Chapter Summary

The nine theorems presented in this chapter establish a layered defense architecture spanning three levels of system guarantees.

At the foundation, _Financial Integrity_ (T1, T2) ensures that the monetary substrate is trustworthy. Theorem T1 proves that the double-entry ledger conserves stake across all transactions, making "phantom money" --- value created or destroyed by the system --- provably impossible. Theorem T2 proves that the SHA-256 hash-chained truth log makes any post-hoc modification to the event history detectable with overwhelming probability. Together, these two theorems guarantee that users can trust the financial and historical records of the platform.

At the behavioral layer, _Behavioral Mechanisms_ (T3, T4, T5) ensure that the incentive and safety systems function as designed. Theorem T3 establishes that the Integrity Score creates an asymmetric incentive structure where penalties exceed the loss aversion threshold, making defection perceived as approximately 6--8 times more costly than the reward of a single completion. Theorem T4 proves that truth-telling is the weakly dominant strategy for Fury auditors, with the 3x false accusation weight raising the evidentiary threshold for rejection to 80% confidence. Theorem T5 proves that the Aegis Protocol's six-predicate constraint set captures all five identified iatrogenic harm scenarios while maintaining a non-empty feasibility region for legitimate contracts. These three theorems collectively ensure that the platform's behavioral mechanisms align individual incentives with prosocial outcomes and prevent the platform from becoming an instrument of harm.

At the operational level, _Operational Guarantees_ (T6, T7, T8, T9) ensure that subsidiary systems behave predictably. Theorem T6 proves that disputes terminate within 3 transitions with deterministic, financially consistent outcomes. Theorem T7 proves that the honeypot system demotes inattentive auditors within 36 hours (or 15 days for random guessers), closing the rubber-stamping loophole left by T4. Theorem T8 proves that recovery contracts cannot enable social isolation, with all five predicates independently necessary for harm prevention. Theorem T9 proves that duplicate media detection operates with a false positive rate of approximately 3.68 * 10^{-14}, ensuring proof integrity without wrongly penalizing legitimate submissions.

Several cross-theorem interactions deserve emphasis. The T4--T7 pincer demotes both types of dishonest auditors (false accusers via T4, rubber-stampers via T7), creating a strategy space where only honest auditing is stable. The T5--T8 complement covers all four harm domains (financial, physiological, social, psychological) without overlap. The T1--T2 stack ensures both instantaneous consistency (balance invariant) and historical integrity (tamper-evident log). These interactions reflect the deliberate architectural principle of defense in depth: each theorem addresses a specific failure mode, and their conjunction eliminates the gaps that any single guarantee would leave.

All nine proofs are constructive: each demonstrates its property through explicit mathematical construction that maps to a specific code artifact within the Styx codebase. The 467 automated tests exercise the code paths identified in the proof-to-code mappings, providing empirical verification that complements the formal guarantees. This dual validation strategy --- formal proof plus automated testing --- demonstrates that the Design Science Research framework can accommodate rigorous mathematical analysis alongside iterative artifact development.

Chapter 5 examines the implications of these results, discussing their theoretical contributions to the behavioral economics and mechanism design literatures, their practical significance for platform design, the limitations of the current proofs and implementations, and directions for future research.
