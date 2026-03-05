# Chapter 3: Methodology

This chapter presents the research paradigm, system architecture, formal definitions, verification methodology, and ethical considerations that constitute the methodological foundation of this dissertation. The objective is to establish both the epistemological positioning of the research --- why Design Science Research (DSR) is the appropriate paradigm for a contribution that takes the form of a designed and evaluated IT artifact --- and the technical substance of the artifact itself: the Styx platform's architecture, the mathematical formalisms that specify its invariants, the validation infrastructure that enforces those invariants in executable code, and the ethical safeguards that prevent the artifact from causing harm.

The chapter is organized as follows. Section 3.1 presents the DSR paradigm and maps this dissertation's contributions onto the Peffers et al. (2007) DSRM process model. Section 3.2 describes the system architecture in sufficient detail to support the formal definitions that follow. Section 3.3 presents the nine formal definitions (D1--D9) that specify the mathematical objects underlying the Styx system. Section 3.4 articulates the verification methodology, including the test architecture, validation gates, and the code-proof correspondence principle. Section 3.5 addresses ethical considerations, including iatrogenic harm prevention, informed consent, data privacy, and the absence of human subjects in this prototype-stage evaluation.

---

## 3.1 Research Paradigm: Design Science Research

### 3.1.1 Epistemological Positioning

This dissertation does not advance a hypothesis about a naturally occurring phenomenon and test it against empirical data. It designs, builds, and evaluates an artifact --- a software system grounded in behavioral economics, mechanism design, and control theory --- that addresses an identified practical problem: the structural absence of consequence density in digital behavioral technology. This distinction is fundamental, because it determines the appropriate research paradigm, the valid forms of evidence, and the criteria by which the contribution should be judged.

The dominant research paradigms in information systems scholarship are the behavioral-science paradigm and the design-science paradigm (Hevner et al., 2004). The behavioral-science paradigm, rooted in natural-science methods, seeks to develop and verify theories that explain or predict phenomena related to information systems. It produces descriptive knowledge: models of what is and why. The design-science paradigm, by contrast, seeks to create innovative artifacts that extend human and organizational capabilities. It produces prescriptive knowledge: specifications of what can be built and how it should function to achieve defined objectives (Gregor & Hevner, 2013). The two paradigms are complementary: behavioral science provides the theoretical grounding (in this case, prospect theory, mechanism design, and cybernetics), while design science applies that grounding to construct artifacts that solve problems the theories illuminate.

The Styx platform is a design-science contribution. Its primary output is not a statistical finding but a working system: a Turborepo monorepo comprising six workspaces, a PostgreSQL double-entry ledger, a SHA-256 hash-chained truth log, a BullMQ-powered peer-audit routing engine, a Stripe FBO escrow integration, and a formal safety protocol. The system embodies theoretical claims --- that loss aversion can be operationalized as a calibrated penalty coefficient, that truthful peer auditing can be made incentive-compatible through financial stakes and honeypot injection, that formal safety predicates can prevent iatrogenic harm --- and the validation of those claims takes the form of formal proofs, automated tests, and validation gates rather than randomized controlled trials.

This epistemological positioning does not diminish the rigor of the contribution. Hevner et al. (2004) argue explicitly that design-science artifacts must be rigorously evaluated: "the utility, quality, and efficacy of a design artifact must be rigorously demonstrated via well-executed evaluation methods" (p. 85). The rigor in this dissertation takes the form of mathematical proof (Theorems T1--T9), automated verification (467+ tests across six workspaces), and structural validation (8 validation gates enforcing invariants at the continuous integration layer). These methods are appropriate to the artifact type. A randomized controlled trial would evaluate whether the system produces superior behavioral outcomes in a live population --- a question this dissertation explicitly defers to future work. The present contribution evaluates whether the system satisfies its formal specifications and safety constraints, which is the appropriate evaluation criterion for a prototype-stage DSR artifact.

### 3.1.2 The DSR Guidelines

Hevner et al. (2004) articulate seven guidelines for design-science research. Each guideline is addressed in turn, with explicit mapping to this dissertation's contributions.

**Guideline 1: Design as an Artifact.** DSR must produce a viable artifact in the form of a construct, a model, a method, or an instantiation. This dissertation produces all four: constructs (the formal definitions D1--D9), models (the Human Vice Control System, the Fury incentive structure), methods (the code-to-proof mapping protocol, the validation gate methodology), and an instantiation (the Styx Turborepo monorepo with 467+ automated tests). The instantiation is the most tangible output: a running system that can be deployed, tested, and independently evaluated.

**Guideline 2: Problem Relevance.** DSR must address an important and relevant problem. Chapter 1 established the problem: digital behavioral technology platforms exhibit a median 15-day retention rate of 3.9% (Adjust, 2024), representing a structural failure mode rooted in the absence of consequential feedback. The problem is commercially significant (TAM exceeding $7 billion) and socially consequential (millions of users abandon platforms that could meaningfully improve their health and behavior).

**Guideline 3: Design Evaluation.** The artifact must be rigorously evaluated. The evaluation strategy in this dissertation is multi-layered: formal proofs establish that the system's mathematical properties hold in theory; automated tests verify that the code faithfully implements those properties; validation gates enforce invariants at the CI layer; and the code-to-proof mapping protocol (Section 3.4.3) provides traceable correspondence between each theorem and its implementing code. This evaluation is appropriate for a prototype-stage artifact. Live user evaluation, which would assess efficacy rather than correctness, is identified as future work.

**Guideline 4: Research Contributions.** DSR must provide clear contributions to the knowledge base. This dissertation's contributions span four categories: theoretical (the HVCS cybernetic model, consequence density as a design primitive), methodological (the Aegis safety predicate formalization, the code-to-proof mapping protocol), artifact-based (the Styx platform itself), and analytical (the legal positioning of financially-staked behavioral contracts on the skill-chance spectrum). Each contribution addresses a specific gap identified in the literature review (Chapter 2).

**Guideline 5: Research Rigor.** DSR must apply rigorous methods in both artifact construction and evaluation. The formal methods employed in this dissertation --- mathematical induction, game-theoretic analysis, automata theory, and predicate logic --- are standard techniques in computer science and mechanism design. The implementation follows software engineering best practices: strict TypeScript compilation, dependency injection, comprehensive test coverage (70% line coverage threshold enforced for the API workspace), and continuous integration with automated quality gates.

**Guideline 6: Design as a Search Process.** DSR is inherently iterative: the design space is explored through successive refinements. The Styx system has evolved through multiple design iterations documented in the project's commit history and architecture decision records (`docs/adr/`). Key design pivots include the transition from a Supabase real-time architecture to a Redis/BullMQ queue-based architecture for Fury proof routing, the adoption of Cloudflare R2 over AWS S3 for zero-egress media storage, and the introduction of the Aegis Protocol after the initial design was found to lack systematic safety constraints.

**Guideline 7: Communication of Research.** DSR must be presented effectively to both technology-oriented and management-oriented audiences. This dissertation communicates to both audiences: the formal definitions and proofs address the technical community, while the market analysis, legal positioning, and system overview address practitioners and policymakers.

### 3.1.3 Mapping to the DSRM Process Model

Peffers et al. (2007) propose a six-phase Design Science Research Methodology (DSRM) process model. Table 7 maps each phase to this dissertation's specific activities (see Figure 18 for a visual representation of this mapping).

*Phase 1: Problem Identification and Motivation.* The retention crisis in digital behavioral health, quantified through industry benchmarks (Adjust, 2024), establishes the practical problem. The HVCS cybernetic analysis provides the theoretical diagnosis: feedback loop interruption. Chapter 1 presents both.

*Phase 2: Objectives of a Solution.* The solution must provide consequence density --- the reliable coupling of behavioral output to meaningful, timely, and personally costly outcomes. Specific objectives include: (a) operationalize loss aversion as a calibrated penalty parameter, (b) achieve incentive-compatible truthful auditing through a peer network, (c) enforce formal safety invariants that prevent iatrogenic harm, and (d) position the system legally as a skill-based contest rather than gambling. These objectives correspond directly to the five research questions (RQ1--RQ5).

*Phase 3: Design and Development.* The Styx platform is designed and implemented as a Turborepo monorepo comprising six workspaces (Section 3.2). Nine formal definitions (Section 3.3) specify the mathematical objects. Nine theorems (Chapter 4) prove properties of those objects. The implementation is verified by 467+ automated tests and 8 validation gates (Section 3.4).

*Phase 4: Demonstration.* The working prototype demonstrates that the designed artifact is technically feasible. The prototype processes contract creation, stake escrow, proof submission, Fury routing, consensus evaluation, and dispute resolution across its full lifecycle. Validation gates demonstrate that the system's invariants hold under automated testing.

*Phase 5: Evaluation.* Formal proofs (Chapter 4) evaluate the mathematical correctness of the artifact's core algorithms. Automated tests evaluate implementation fidelity. The code-to-proof mapping protocol (Section 3.4.3) enables independent verification of correspondence between formal claims and executable code.

*Phase 6: Communication.* This dissertation constitutes the communication phase, presenting the artifact, its theoretical grounding, its formal properties, and its evaluation to the scholarly community.

### 3.1.4 Contrast with Empirical Approaches

It is important to clarify what this dissertation does not do. It does not conduct a randomized controlled trial (RCT) comparing Styx users against a control group. It does not recruit human subjects, collect behavioral data from live users, or make claims about clinical efficacy. Such an evaluation would be appropriate and necessary before the platform is deployed at scale, and it is identified as the primary direction for future work (Chapter 5).

The absence of an RCT is not a limitation of the methodology but a consequence of the research stage. The DSR paradigm recognizes that artifact development precedes empirical evaluation: one must first design and verify a system before testing it on users (Hevner et al., 2004). A premature RCT --- conducted on a system whose formal properties have not been established --- would risk exposing users to an artifact that might violate its own safety invariants. The sequence adopted in this dissertation --- formalize, implement, verify, then evaluate empirically --- is the responsible order of operations for a system that involves financial stakes and behavioral intervention.

Furthermore, the contribution of formal verification is independent of empirical outcomes. Even if a subsequent RCT were to find that Styx produces no superior behavioral outcomes compared to existing platforms, the formal contributions would retain their value: the double-entry ledger invariant (T1), the tamper evidence of the truth log (T2), the safety predicates of the Aegis Protocol (T5), and the anti-isolation guarantee (T8) would remain valid specifications for any system that implements financially-staked behavioral contracts. The formal framework is reusable; the empirical evaluation is system-specific.

---

## 3.2 System Architecture

### 3.2.1 Monorepo Workspace Structure

The Styx platform is implemented as a Turborepo monorepo managed by npm workspaces. The monorepo pattern was selected for three reasons: first, it enables atomic cross-workspace refactoring (a change to the shared type library is immediately visible to all consuming workspaces); second, it enforces a single dependency tree, eliminating version drift between workspaces; third, it supports Turborepo's incremental build caching, which reduces CI pipeline duration by skipping unchanged workspaces.

The monorepo comprises six workspaces, each published under the `@styx` npm scope:

| Workspace | Package Name | Stack | Responsibility |
|-----------|-------------|-------|---------------|
| `src/api` | `@styx/api` | NestJS 11, BullMQ, Stripe, pg, pino | Backend: ledger, escrow, Fury routing, oracles, health guards |
| `src/web` | `@styx/web` | Next.js 16, React 18, Tailwind CSS, Zustand | Dashboard, Fury workbench, contract management |
| `src/mobile` | `@styx/mobile` | Expo 54, React Native 0.81, React Navigation 7 | Sensor bridge, camera proof capture, biometrics |
| `src/shared` | `@styx/shared` | TypeScript (pure library) | Constants, types, core algorithms |
| `src/desktop` | `@styx/desktop` | Tauri 2.0 beta, Vite, React | "The Judge" administrative dashboard |
| `src/pitch` | `@styx/pitch` | Vite, React 18, p5.js, Tailwind CSS | Interactive pitch deck (GitHub Pages) |

The Turborepo pipeline enforces build ordering: `@styx/shared` must build before any workspace that imports it (`@styx/api`, `@styx/web`, `@styx/mobile`, `@styx/desktop`). The test pipeline inherits this dependency: `"test": { "dependsOn": ["build"] }`, ensuring that all workspaces test against freshly compiled shared types.

The shared library (`src/shared/libs/`) contains the pure-function implementations of the core algorithms formalized in Section 3.3: the integrity score calculation (`integrity.ts`), the Fury accuracy calculation (`integrity.ts`), the behavioral logic constants and oath taxonomy (`behavioral-logic.ts`), and the currency utilities (`money.ts`). By isolating these algorithms in a dependency-free TypeScript library, the system ensures that the same code that is formally verified in Chapter 4 is the code that executes in production across all workspaces (see Figure 11 for a visual representation of the workspace topology).

### 3.2.2 API: The Dual-Layer Architecture

The API workspace (`src/api`) exhibits a dual-layer architecture that separates domain logic from HTTP transport. This separation is the most important structural decision in the backend design, because it enables formal verification of business logic independently of NestJS framework concerns.

**Domain Services Layer** (`src/api/services/`). Each service is an `@Injectable()` class with constructor-injected dependencies (typically a PostgreSQL `Pool` or a BullMQ `Queue`). Services contain pure business logic with no HTTP awareness --- no request objects, no response objects, no status codes. They throw domain exceptions that the HTTP layer translates into appropriate responses. The domain services include:

- `LedgerService` (`services/ledger/ledger.service.ts`): Double-entry transaction recording, account balance computation, and ledger integrity verification. Implements Definitions D1 and the balance invariant proven in Theorem T1.
- `TruthLogService` (`services/ledger/truth-log.service.ts`): SHA-256 hash-chained append-only event log with chain verification. Implements Definition D2 and the tamper evidence property proven in Theorem T2.
- `FuryRouterService` (`services/fury-router/fury-router.service.ts`): BullMQ-based proof routing to anonymous peer auditors. Implements the proof routing mechanism analyzed in Theorem T4.
- `AegisProtocolService` (`services/health/aegis.service.ts`): Safety predicate evaluation for contract creation. Implements Definition D5 and the safety properties proven in Theorem T5.
- `RecoveryProtocolService` (`services/health/recovery-protocol.service.ts`): Anti-isolation constraints for recovery-stream contracts. Implements Definition D8 and the anti-isolation guarantee proven in Theorem T8.
- `AnomalyService` (`services/anomaly/anomaly.service.ts`): Perceptual hash computation, Hamming distance comparison, and EXIF timestamp validation. Implements Definition D9 and the duplicate detection bounds proven in Theorem T9.
- `HoneypotService` (`services/intelligence/honeypot.service.ts`): Cron-based synthetic proof injection for Fury accuracy calibration. Implements Definition D7 and the detection rate bounds proven in Theorem T7.
- `DisputeService` (`services/escrow/dispute.service.ts`): Dispute initiation, resolution, and audit trail generation. Implements Definition D6 and the FSM termination property proven in Theorem T6.
- `StripeFboService` (`services/escrow/stripe.service.ts`): Stripe For Benefit Of escrow operations --- hold, capture, and cancel.

**NestJS Application Layer** (`src/api/src/modules/`). Each module wires domain services into NestJS controllers, guards, and dependency injection containers. Modules handle HTTP request parsing, JWT authentication, response serialization, and error translation. They import domain services and expose HTTP endpoints. The module structure mirrors the domain service structure: `modules/contracts/`, `modules/fury/`, `modules/wallet/`, `modules/auth/`, `modules/admin/`, `modules/payments/`, `modules/notifications/`, and so on.

This dual-layer separation yields a critical methodological benefit: the formal definitions and theorems in this dissertation reference domain service methods directly, without needing to reason about HTTP transport, authentication middleware, or serialization. When Theorem T1 proves that the ledger balance invariant holds, it references `LedgerService.recordTransaction()` and `LedgerService.verifyLedgerIntegrity()` --- pure methods whose behavior can be analyzed independently of the web framework that hosts them.

### 3.2.3 Database Architecture

The PostgreSQL 15 schema (`src/api/database/schema.sql`) implements three structural patterns that support the formal properties proven in Chapter 4.

**Double-Entry Ledger.** The financial data model comprises two core tables: `accounts` (typed by `account_type` enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) and `entries` (with `debit_account_id`, `credit_account_id`, `amount`, `contract_id`, and `metadata`). The `amount` column carries a `CHECK (amount > 0)` constraint, enforcing the strict positivity required by Definition D1. Foreign keys use `ON DELETE RESTRICT` to prevent deletion of accounts with outstanding ledger entries, preserving the integrity of the historical record. Every financial movement --- stake deposit, escrow capture, Fury bounty distribution, refund, fee deduction --- is recorded as a double-entry transaction, maintaining the system-wide balance invariant $\Sigma B(a) = 0$ for all accounts $a \in A$ (see Figure 12 for a visual representation of double-entry transaction flow).

**Hash-Chained Event Log.** The `event_log` table stores event type, JSON payload, `previous_hash`, and `current_hash`. A database trigger (`trg_event_log_immutable`) prevents `UPDATE` and `DELETE` operations on the table, enforcing append-only semantics at the database level. The trigger raises an exception on any mutation attempt: the event log is structurally immutable within the trust boundary of the database. The hash chain construction follows Definition D2: $h_j = H(h_{j-1} \| \text{serialize}(\pi_j))$, with the genesis hash set to the string literal `"GENESIS_HASH"`.

**Domain Tables.** The `users` table stores authentication credentials, Stripe customer references, integrity scores (initialized to 50 per Definition D3), account references, roles, and enterprise associations. The `contracts` table stores oath category, verification method, stake amount, duration, status, grace days used, and strike count. The `proofs` table records submitted evidence with media URIs, proof types, honeypot flags, and review status. The `fury_assignments` table links proofs to assigned auditors with verdict and review timestamp. The `disputes` table tracks appeal status, judge assignments, and resolution outcomes. The `accountability_partners` and `attestations` tables support the Recovery Protocol (Definition D8). Supporting tables include `notifications`, `stripe_events` (idempotency tracking), `contract_resolution_side_effects` (asynchronous side-effect processing), `consumption_logs` (B2B billing), and `refresh_tokens` (JWT rotation).

### 3.2.4 Infrastructure Components

**Queue: Redis 7 + BullMQ.** The Fury proof routing system uses BullMQ, a Redis-backed job queue for Node.js, to asynchronously dispatch proof review assignments. When a proof is submitted, `FuryRouterService.routeProof()` enqueues a `route-fury-review` job with the proof ID, submitter ID, and required reviewer count (default: 3). The BullMQ worker (`fury-router.worker.ts`) processes the job by querying the database for eligible Furies (excluding the submitter), creating `fury_assignments` records, and dispatching notifications. The queue is configured with exponential backoff retry (3 attempts, 2-second initial delay), ensuring that transient failures do not silently drop proof assignments (see Figure 14 for the BullMQ Fury Router queue architecture).

**Storage: Cloudflare R2.** Media proofs (photographs, time-lapse videos) are stored in Cloudflare R2 object storage. R2 was selected over AWS S3 for a single decisive reason: zero data egress fees. In a peer-audit system where multiple Furies must view each submitted proof, egress costs scale multiplicatively with the number of auditors per proof. At 100 TB of streaming bandwidth, AWS S3 would cost approximately $9,230 per month in egress fees alone; Cloudflare R2 reduces this to $150 in flat storage costs (Cloudflare, 2025). All media access is gated through time-limited signed URLs generated by `R2Service` (`services/storage/r2.service.ts`), ensuring that proof media is never publicly accessible and that access can be revoked after the review period expires.

**Payments: Stripe FBO Escrow.** User stakes are held in Stripe For Benefit Of (FBO) escrow accounts via `StripeFboService` (`services/escrow/stripe.service.ts`). The escrow lifecycle comprises three operations: `holdStake()` creates a PaymentIntent with `capture_method: 'manual'`, authorizing the charge without capturing funds; `captureStake()` captures the held amount upon verified contract failure (stake forfeiture); and `cancelHold()` releases the authorization upon verified contract success (stake return). This FBO structure ensures that Styx never holds user funds in corporate accounts --- a critical regulatory distinction that positions the platform as a payment facilitator rather than a money transmitter (see Figure 13 for a visual representation of the escrow lifecycle).

**AI Services.** The API integrates two AI services. The Gemini 2.5 Flash model (`services/intelligence/GeminiClient.ts`) powers the "Grill Me" pre-commitment interrogation and the "ELI5" plain-language contract explanation. The Groq free tier with Llama 3.3 70B (`src/web/app/api/chat/route.ts`) powers a stakeholder chat interface with codebase knowledge retrieval. These AI integrations are supplementary: no formal theorem depends on AI service behavior.

---

## 3.3 Formal Definitions

This section presents the nine formal definitions (D1--D9) that specify the mathematical objects underlying the Styx system. Each definition states the formal notation, explains the conceptual role of the defined object, references the code location where the definition is implemented, and explains why the formalization matters --- that is, what property or invariant the definition enables proving. The notation conventions follow Appendix A; the proof of properties for each definition appears in Chapter 4.

### 3.3.1 Definition D1: Ledger Balance

**Definition D1 (Net Account Balance).** Let $A$ be the set of all ledger accounts, let $E$ be the set of all ledger entries, and let each entry $e_i = (d_i, c_i, m_i)$ specify a debit account $d_i \in A$, a credit account $c_i \in A$, and a strictly positive integer amount $m_i \in \mathbb{Z}_{>0}$ (denominated in cents). The net balance of account $a \in A$ is:

$$B(a) = \sum_{\{i : e_i.d = a\}} m_i - \sum_{\{i : e_i.c = a\}} m_i$$

This definition formalizes the double-entry bookkeeping principle: each entry simultaneously debits one account and credits another by the same amount. The balance function $B(a)$ computes the net position of any account by aggregating all entries in which that account appears as a debit party (increasing the balance) or a credit party (decreasing the balance).

The definition is implemented in `LedgerService.getAccountBalance()` (`src/api/services/ledger/ledger.service.ts`), which executes a SQL aggregation over the `entries` table:

```sql
SELECT COALESCE(SUM(CASE WHEN debit_account_id = $1 THEN amount ELSE 0 END), 0)
     - COALESCE(SUM(CASE WHEN credit_account_id = $1 THEN amount ELSE 0 END), 0)
     AS balance
FROM entries WHERE debit_account_id = $1 OR credit_account_id = $1
```

The `entries` table enforces `CHECK (amount > 0)` at the schema level, guaranteeing the strict positivity constraint on $m_i$. The `ON DELETE RESTRICT` constraint on account foreign keys prevents deletion of accounts with outstanding entries, preserving the domain of $B$.

**Why this formalization matters.** Definition D1 enables Theorem T1 (Ledger Balance Invariant), which proves that the sum of all account balances across the system is identically zero: $\sum_{a \in A} B(a) = 0$. This invariant guarantees that the system cannot create or destroy money --- every cent that enters one account must exit another. The invariant is verified at runtime by `LedgerService.verifyLedgerIntegrity()` and enforced in CI by Validation Gate 01 (Phantom Money Check).

### 3.3.2 Definition D2: Truth Log Hash Chain

**Definition D2 (Hash Chain Construction).** Let $L = \langle \ell_1, \ell_2, \ldots, \ell_n \rangle$ be the ordered sequence of events in the truth log. Let $H: \{0,1\}^* \to \{0,1\}^{256}$ be the SHA-256 cryptographic hash function. Let $\pi_j$ denote the JSON payload of event $\ell_j$. The current hash of event $\ell_j$ is defined recursively:

$$h_j = H(h_{j-1} \| \text{serialize}(\pi_j)) \quad \text{for } j \geq 1$$
$$h_0 = \texttt{"GENESIS\_HASH"} \quad \text{(sentinel value)}$$

where $\|$ denotes string concatenation and $\text{serialize}(\cdot)$ is the deterministic JSON serialization function `JSON.stringify()`.

This definition formalizes the tamper-evident audit trail. Each event's hash incorporates the previous event's hash and the current event's payload, producing a chain in which modifying any historical event invalidates all subsequent hashes. The construction is analogous to the block header chaining in blockchain systems, but operates within a centralized PostgreSQL database rather than a distributed peer-to-peer network.

The definition is implemented in `TruthLogService.appendEvent()` (`src/api/services/ledger/truth-log.service.ts`). The implementation retrieves the latest `current_hash` from the `event_log` table using `SELECT ... FOR UPDATE` (to prevent race conditions during concurrent insertions), computes the new hash via Node.js `createHash('sha256')`, and inserts the new event with both `previous_hash` and `current_hash` fields. Chain verification is implemented in `TruthLogService.verifyChain()`, which walks the log from oldest to newest, recomputing each hash and comparing it against the stored value.

**Why this formalization matters.** Definition D2 enables Theorem T2 (Truth Log Tamper Evidence), which proves that modifying any historical event $\ell_k$ produces a detectable hash discrepancy at position $k$ and all subsequent positions. This provides audit integrity independent of the double-entry ledger's accounting integrity: even if the ledger's balance invariant is satisfied, a tampered truth log reveals that the sequence of events leading to that state has been altered.

### 3.3.3 Definition D3: Integrity Score

**Definition D3 (Integrity Score Function).** Let $u \in U$ be a registered user with behavioral history $(c_u, f_u, s_u, d_u)$, where $c_u \geq 0$ is the count of completed oaths, $f_u \geq 0$ is the count of fraud strikes, $s_u \geq 0$ is the count of failed oaths, and $d_u \geq 0$ is the count of months inactive. The Integrity Score of user $u$ is:

$$IS(u) = \max\!\big(0,\; IS_0 + \beta_c \cdot c_u - \beta_f \cdot f_u - \beta_s \cdot s_u - \beta_d \cdot d_u\big)$$

where the constants are:

| Parameter | Symbol | Value | Code Reference |
|-----------|--------|-------|---------------|
| Base score | $IS_0$ | 50 | `BASE_INTEGRITY` |
| Completion bonus | $\beta_c$ | 5 | `COMPLETION_BONUS` |
| Fraud penalty | $\beta_f$ | 15 | `FRAUD_PENALTY` |
| Strike penalty | $\beta_s$ | 20 | `STRIKE_PENALTY` |
| Inactivity decay | $\beta_d$ | 1 | Implicit (1 point per month) |

The Integrity Score maps to a tier function $T: \mathbb{Z}_{\geq 0} \to \text{Tier}$ that determines access to financial stake levels:

| Tier | Score Threshold | Maximum Stake |
|------|----------------|--------------|
| `RESTRICTED_MODE` | $IS < 20$ | $0 (no staking) |
| `TIER_1_MICRO_STAKES` | $20 \leq IS < 50$ | $20 |
| `TIER_2_STANDARD` | $50 \leq IS < 100$ | $100 |
| `TIER_3_HIGH_ROLLER` | $100 \leq IS < 500$ | $1,000 |
| `TIER_4_WHALE_VAULTS` | $IS \geq 500$ | Unlimited |

The definition is implemented in `calculateIntegrity()` and `getAllowedTiers()` in `src/shared/libs/integrity.ts`. The `max(0, ...)` floor ensures that the Integrity Score is always non-negative, regardless of the magnitude of penalties accumulated. The tier thresholds are implemented as conditional branches in `getAllowedTiers()`, with `getTierMaxStake()` returning the corresponding maximum stake amount in cents.

**Why this formalization matters.** Definition D3 enables Theorem T3 (Integrity Score Boundedness and Tier Monotonicity), which proves two properties: (1) $IS(u) \geq 0$ for all users $u$ (non-negativity), and (2) the tier function $T$ is monotonically non-decreasing with respect to $IS$ (a user who improves their integrity score never loses access to previously available tiers). The Integrity Score also appears in Definition D5 (Aegis Safety Predicate P4), where it gates access to higher stake amounts.

### 3.3.4 Definition D4: Fury Accuracy

**Definition D4 (Fury Accuracy Function).** Let $v \in F \subset U$ be an auditor (Fury) with audit history $(a_v, \bar{a}_v, n_v)$, where $a_v \geq 0$ is the count of successful audits, $\bar{a}_v \geq 0$ is the count of false accusations, and $n_v \geq 0$ is the total audit count. The Fury Accuracy of auditor $v$ is:

$$FA(v) = \begin{cases} \text{clamp}_0^1\!\left(\dfrac{a_v - \omega \cdot \bar{a}_v}{n_v}\right) & \text{if } n_v > 0 \\[6pt] 1.0 & \text{if } n_v = 0 \end{cases}$$

where $\omega = 3$ is the false accusation penalty weight, and $\text{clamp}_0^1(x) = \max(0, \min(1, x))$.

The function assigns new auditors (with no audit history) a perfect accuracy score of 1.0, reflecting a benefit-of-the-doubt policy. As auditors accumulate history, their accuracy is computed as a weighted ratio in which false accusations are penalized at $\omega = 3$ times the weight of successful audits. This asymmetric weighting encodes the design principle that incorrectly rejecting a user's genuine proof (a false accusation) is substantially more harmful than incorrectly approving a fraudulent proof: the former inflicts unjust financial loss on a compliant user, while the latter merely delays detection of fraud.

A Fury is demoted from the audit network when two conditions are jointly satisfied: $n_v \geq \underline{n}$ (the auditor has completed at least $\underline{n} = 10$ audits, the burn-in period) and $FA(v) < \underline{FA}$ (accuracy has fallen below $\underline{FA} = 0.8$). The burn-in period prevents premature demotion of new auditors whose accuracy statistics are unstable due to small sample sizes.

The definition is implemented in `calculateAccuracy()` and `shouldDemoteFury()` in `src/shared/libs/integrity.ts`. The `FALSE_ACCUSATION_WEIGHT` constant is exported as 3. The auditor stake amount (`AUDITOR_STAKE_AMOUNT = 200` cents, i.e., $2.00) is also defined in this module.

**Why this formalization matters.** Definition D4 enables Theorem T4 (Honest Auditor Dominance), which proves that truthful auditing is a weakly dominant strategy: an auditor who reports honestly achieves a (weakly) higher accuracy score than one who reports dishonestly, regardless of the behavior of other auditors. The $3\times$ false-accusation penalty creates an asymmetric payoff structure in which the expected cost of a false accusation exceeds the expected benefit of any strategic deviation from truthful reporting.

### 3.3.5 Definition D5: Aegis Safety Predicate Set

**Definition D5 (Safety Predicate Set).** Let $\sigma$ denote the proposed stake amount in cents, $\delta$ the proposed contract duration in days, $IS(u)$ the user's Integrity Score, and $\kappa$ the count of past consecutive failures. The Aegis safety region $R$ is defined as the conjunction of six predicates:

$$R = P_1 \wedge P_2 \wedge P_3 \wedge P_4 \wedge P_5 \wedge P_6$$

where:

- $P_1$: $\sigma \leq \bar{\sigma}$ where $\bar{\sigma} = 50000$ cents ($500). Absolute stake cap prevents emotional "revenge staking."
- $P_2$: $\delta \geq \underline{\delta}$ where $\underline{\delta} = 7$ days. Minimum duration ensures contracts are long enough to be behaviorally meaningful.
- $P_3$: $\kappa < \bar{\kappa} \lor \sigma \leq 5000$ where $\bar{\kappa} = 3$. After three consecutive failures, the maximum stake is reduced to $50 to prevent financial spirals.
- $P_4$: $IS(u) \geq 40 \lor \sigma \leq 10000$. Low-integrity users are restricted to lower stakes until they rebuild their behavioral record.
- $P_5$: $BMI(u) \geq \underline{BMI}$ where $\underline{BMI} = 18.5$. For biological-stream oaths involving weight management, the system enforces the WHO underweight threshold to prevent acceleration of eating disorders.
- $P_6$: $v_w \leq \bar{v}_w$ where $\bar{v}_w = 0.02$ (2% per week). Maximum weekly weight-loss velocity prevents dangerously rapid weight reduction.

The predicate set is partitioned into two implementation units. Predicates $P_1$ through $P_4$ (financial and behavioral guards) are implemented in `AegisProtocolService.validatePsychologicalGuardrails()` (`src/api/services/health/aegis.service.ts`). Predicates $P_5$ and $P_6$ (medical guards) are implemented in `AegisProtocolService.validateHealthMetrics()`. Both methods throw HTTP 406 (Not Acceptable) when any predicate is violated, preventing contract creation.

Additionally, the Aegis Protocol includes a volatility multiplier $\mu(t)$ implemented in `AegisProtocolService.getVolatilityMultiplier()`. This multiplier returns 1.5 during high-risk temporal windows (Friday and Saturday nights between 9 PM and 4 AM) and 1.0 otherwise, reflecting the behavioral observation that impulsive financial decisions are disproportionately concentrated during weekend evening hours.

**Why this formalization matters.** Definition D5 enables Theorem T5 (Aegis Safety CSP), which proves that the conjunction of all six predicates prevents each identified category of iatrogenic harm. The predicate set is, to the author's knowledge, the first formal specification of safety invariants for a commitment device platform. Existing platforms implement ad hoc safety measures, but none provide formal definitions or proofs of invariant satisfaction.

### 3.3.6 Definition D6: Dispute Resolution FSM

**Definition D6 (Dispute Resolution Finite State Machine).** The dispute resolution process is modeled as a deterministic finite automaton $(Q, \Sigma, \delta_{\text{FSM}}, q_0, Q_F)$ where:

- $Q = \{q_1, q_2, q_3, q_4, q_5\}$ is the state set:
  - $q_1$: `FEE_AUTHORIZED_PENDING_REVIEW` (initial)
  - $q_2$: `IN_REVIEW`
  - $q_3$: `ESCALATED`
  - $q_4$: `RESOLVED_UPHELD` (terminal)
  - $q_5$: `RESOLVED_OVERTURNED` (terminal)
- $\Sigma = \{\text{UPHELD}, \text{OVERTURNED}, \text{ESCALATED}\}$ is the input alphabet (judge decisions).
- $\delta_{\text{FSM}}: Q \times \Sigma \to Q$ is the transition function.
- $q_0 = q_1$ is the initial state.
- $Q_F = \{q_4, q_5\}$ is the set of accepting (terminal) states.

The transition function is defined by the following table:

| Current State | Input | Next State |
|---------------|-------|------------|
| $q_1$ (`FEE_AUTHORIZED_PENDING_REVIEW`) | UPHELD | $q_4$ (`RESOLVED_UPHELD`) |
| $q_1$ | OVERTURNED | $q_5$ (`RESOLVED_OVERTURNED`) |
| $q_1$ | ESCALATED | $q_3$ (`ESCALATED`) |
| $q_2$ (`IN_REVIEW`) | UPHELD | $q_4$ |
| $q_2$ | OVERTURNED | $q_5$ |
| $q_2$ | ESCALATED | $q_3$ |
| $q_3$ (`ESCALATED`) | UPHELD | $q_4$ |
| $q_3$ | OVERTURNED | $q_5$ |

The FSM is implemented in `DisputeService.resolveDispute()` (`src/api/services/escrow/dispute.service.ts`). The method accepts a dispute ID, judge user ID, outcome (from $\Sigma$), and judge notes. It queries disputes in states $q_1$ or $q_2$, applies the transition function via a `switch` statement, updates the dispute and proof records within a PostgreSQL transaction, and appends a `DISPUTE_RESOLVED` event to the truth log.

**Why this formalization matters.** Definition D6 enables Theorem T6 (Dispute Resolution FSM Termination and Determinism), which proves two properties: (1) from any non-terminal state, there exists a finite sequence of inputs that reaches a terminal state (termination guarantee), and (2) the transition function is deterministic --- for any state-input pair, there is exactly one next state. These properties ensure that no dispute can become permanently stuck in a non-terminal state, and that the resolution outcome is unambiguously determined by the judge's decision.

### 3.3.7 Definition D7: Honeypot Detection

**Definition D7 (Honeypot Injection System).** Let $\Delta^+ = +5$ denote the integrity bonus awarded to a Fury who correctly identifies a honeypot proof, and let $\Delta^- = -5$ denote the integrity penalty assessed against a Fury who fails to identify a honeypot. Let $\rho \in [0,1]$ denote the probability that a given Fury correctly identifies a honeypot on any single exposure. Let $N_F \geq 3$ be the minimum number of active Furies required before honeypot injection is activated, and let $T_{\text{inj}} = 6$ hours be the injection cadence.

The honeypot system operates as follows: every $T_{\text{inj}}$ hours, if $|F_{\text{active}}| \geq N_F$, a synthetic proof with a known correct verdict (currently: known-fail) is injected into the Fury routing queue and dispatched to auditors as a normal proof. When consensus is reached on the honeypot, each Fury's verdict is compared against the known ground truth, and the appropriate integrity adjustment ($\Delta^+$ or $\Delta^-$) is applied.

The injection mechanism is implemented in `HoneypotService.injectHoneypot()` (`src/api/services/intelligence/honeypot.service.ts`), which is annotated with `@Cron(CronExpression.EVERY_6_HOURS)` for automatic scheduling. The grading mechanism is implemented in `HoneypotService.gradeHoneypotPerformance()`, which iterates over Fury assignments for the honeypot proof and adjusts integrity scores within a database transaction.

**Why this formalization matters.** Definition D7 enables Theorem T7 (Honeypot Detection Rate Lower Bound), which proves that a dishonest Fury (one whose true detection probability $\rho$ is below a critical threshold) will, with probability approaching 1 as the number of honeypot exposures increases, accumulate sufficient integrity penalties to trigger demotion from the Fury network. This provides a convergence guarantee: the system will eventually detect and remove unreliable auditors.

### 3.3.8 Definition D8: Anti-Isolation Predicate

**Definition D8 (Anti-Isolation Predicate).** Let $C_{\text{recovery}} \subset C$ be the set of recovery-stream contracts. For each contract $c \in C_{\text{recovery}}$:

$$\forall c \in C_{\text{recovery}}:\; |targets(c)| \leq \bar{n}_{\text{NC}} \;\wedge\; duration(c) \leq \bar{\delta}_R \;\wedge\; AP(c) \neq \emptyset \;\wedge\; \bigwedge Ack(c)$$

where:

| Parameter | Symbol | Value | Code Reference |
|-----------|--------|-------|---------------|
| Max no-contact targets | $\bar{n}_{\text{NC}}$ | 3 | `MAX_NOCONTACT_TARGETS` |
| Max recovery duration | $\bar{\delta}_R$ | 30 days | `MAX_NOCONTACT_DURATION_DAYS` |
| Accountability partner | $AP(c)$ | Non-empty email | `accountabilityPartnerEmail` |
| Safety acknowledgments | $Ack(c)$ | 4-tuple of booleans, all true | `acknowledgments` |

The safety acknowledgment tuple $Ack(c) = (\text{voluntary}, \text{noMinors}, \text{noDependents}, \text{noLegalObligations})$ requires the user to affirm four conditions: (1) participation is voluntary and not coerced, (2) the no-contact targets do not include minors, (3) the targets are not dependents of the user, and (4) no legal obligations (e.g., custody arrangements, court orders) prohibit the no-contact commitment.

The predicate is implemented in `RecoveryProtocolService.validateRecoveryContract()` (`src/api/services/health/recovery-protocol.service.ts`). The method validates each conjunct sequentially and throws HTTP 406 on violation, preventing the creation of recovery contracts that could serve as instruments of social isolation or coercive control.

**Why this formalization matters.** Definition D8 enables Theorem T8 (Anti-Isolation Guarantee), which proves that no recovery contract can be created that would isolate a user from more than 3 contacts, persist for more than 30 days without renewal, or lack an external accountability witness. This is a unique ethical constraint that has no analogue in existing commitment device platforms: Styx is, to the author's knowledge, the first platform to formally specify and enforce anti-isolation invariants for behavioral contracts.

### 3.3.9 Definition D9: Duplicate Detection

**Definition D9 (Duplicate Detection Decision Rule).** Let $pH: \text{Media} \to \{0,1\}^{64}$ denote the perceptual hash function, let $d_H: \{0,1\}^{64} \times \{0,1\}^{64} \to \mathbb{Z}_{\geq 0}$ denote the Hamming distance function, and let $\theta_H = 5$ be the Hamming distance threshold. Two proofs $p_1, p_2 \in P$ are classified as duplicates if and only if:

$$\text{duplicate}(p_1, p_2) \iff d_H(pH(p_1), pH(p_2)) < \theta_H$$

The perceptual hash function evaluates the spatial distribution of luminance in media frames, producing a compact 64-bit signature that is robust to minor transformations (cropping, compression, brightness adjustment, frame rate changes) but sensitive to substantive content differences. Unlike cryptographic hashes (SHA-256, MD5), which produce entirely different outputs for bit-level changes, perceptual hashes produce similar outputs for visually similar media, enabling detection of recycled or lightly modified proof submissions.

The Hamming distance function counts the number of bit positions at which two hash values differ. A distance of 0 indicates identical perceptual content; a distance below $\theta_H = 5$ indicates content that is perceptually indistinguishable; a distance above $\theta_H$ indicates distinct content.

The definition is implemented across two service files. The primary implementation resides in `AnomalyService` (`src/api/services/anomaly/anomaly.service.ts`), which exports `computePHash()` and `hammingDistance()` methods. The `computePHash()` method produces a deterministic 64-bit hash from the media URI. The `hammingDistance()` method uses BigInt XOR and bit-counting to compute the Hamming distance between two hex-encoded hashes. The `checkDuplicate()` method iterates over stored hashes (in Redis or in-memory fallback) and returns a match if any stored hash has a Hamming distance below `PHASH_HAMMING_THRESHOLD = 5`.

**Why this formalization matters.** Definition D9 enables Theorem T9 (pHash Duplicate Detection Soundness), which establishes upper bounds on the false positive rate (genuine proofs incorrectly classified as duplicates) and provides a lower bound on the true positive rate (recycled proofs correctly detected). The theorem demonstrates that the chosen threshold $\theta_H = 5$ achieves a favorable trade-off between sensitivity and specificity under the combinatorial properties of 64-bit Hamming space.

---

## 3.4 Verification Methodology

### 3.4.1 Test Architecture

The Styx codebase employs Jest as its testing framework across all workspaces, configured with ts-jest for TypeScript compilation. Test files are co-located with their source files: API and shared workspace tests use the `*.spec.ts` suffix (following NestJS conventions), while web workspace tests use the `*.test.ts` and `*.test.tsx` suffixes (following Next.js conventions).

As of the most recent test run, the system contains 467+ automated tests distributed across all active workspaces. The API workspace, which contains the majority of domain logic, enforces coverage thresholds via `jest.config.cjs`:

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Branches | 60% |
| Functions | 60% |
| Statements | 70% |

These thresholds are enforced in the CI pipeline: if any metric falls below its threshold, the build fails and the merge is blocked. The thresholds were calibrated to balance rigor with pragmatism --- higher thresholds would incentivize the creation of trivial tests that inflate coverage without testing meaningful behavior, while lower thresholds would permit untested code paths in critical financial logic.

The Turborepo pipeline configuration enforces build-before-test ordering: `"test": { "dependsOn": ["build"] }`. This ensures that when `@styx/shared` is modified, it is rebuilt before any workspace that imports it runs its tests. This dependency ordering is critical because the shared library contains the formal algorithm implementations (integrity score, Fury accuracy, behavioral constants) that are tested both within the shared workspace and indirectly by workspaces that consume them.

### 3.4.2 Validation Gates

Beyond unit and integration tests, the Styx system enforces eight validation gates (`scripts/validation/`) that verify system-level invariants. Each gate is an executable script that can be run locally or in CI. Gates 04--07 are enforced in the GitHub Actions CI pipeline (`ci.yml`); the remaining gates are available for manual and pre-deployment verification.

**Gate 01: Phantom Money Check** (`01-phantom-money-check.ts`). Instantiates the `LedgerService`, executes a series of double-entry transactions, and verifies that `verifyLedgerIntegrity()` returns `balanced: true` after each transaction. This gate directly validates the balance invariant of Theorem T1. A failure indicates that the ledger implementation has introduced a code path capable of creating or destroying money.

**Gate 02: Simulator Spoof Check** (`02-simulator-spoof-check.ts`). Verifies that the hardware oracle integration rejects manually entered biometric data. This gate ensures that the system distinguishes between hardware-generated sensor data (HealthKit/Health Connect with appropriate metadata flags) and user-entered data, validating the zero-trust principle that underlies the biological oath stream.

**Gate 03: Full Loop** (`03-the-full-loop.ts`). Executes the complete contract lifecycle from creation through stake escrow, proof submission, Fury routing, consensus evaluation, and settlement. This end-to-end gate verifies that the system's subsystems interoperate correctly and that a contract can traverse its full state machine without entering a deadlock or inconsistent state.

**Gate 04: Redacted Build Check** (`04-redacted-build-check.sh`). Scans the production build output for gambling-adjacent terminology (stake, bet, wager, gamble, and related terms) that could trigger rejection by app store review processes or payment processor compliance teams. This gate validates the linguistic cloaker's effectiveness: all internal Stygian terminology should be replaced by compliance-safe alternatives in the production build. A companion script, `scripts/gatekeeper-scan.sh`, performs a more comprehensive vocabulary audit.

**Gate 05: Behavioral Physics Check** (`05-behavioral-physics-check.ts`). Verifies that the runtime values of behavioral constants ($\lambda = 1.955$, $\beta_c = 5$, $\beta_f = 15$, $\beta_s = 20$, $IS_0 = 50$, $\bar{\sigma} = 50000$, $\underline{\delta} = 7$, etc.) match the values specified in the formal definitions. This gate detects "constant drift" --- accidental modification of calibrated parameters during refactoring. In live deployment mode (enabled by the `CI_GATE05_API_URL` environment variable), the gate queries the running API to verify that deployed constants match specification.

**Gate 06: Security Invariant Check** (`06-security-invariant-check.ts`). Scans the production build output for hardcoded secrets, API keys, debug backdoors, and other security violations. This gate prevents accidental exposure of credentials in client-side bundles.

**Gate 07: Claim Drift Check** (`07-claim-drift-check.js`). Parses `docs/planning/implementation-status.md`, extracts all file paths referenced in the Claim-to-Control Matrix, and verifies that each referenced file still exists on disk. This gate detects documentation drift --- claims about implementation that have become invalid due to file renames, deletions, or directory restructuring.

**Gate 08: Fury Crucible Simulation** (`08-fury-crucible-simulation.ts`). Simulates a Fury network under load, dispatching multiple concurrent proof evaluations to test consensus convergence, honeypot detection, and accuracy degradation under adversarial conditions. This gate stress-tests the mechanism design properties formalized in Theorems T4 and T7.

### 3.4.3 End-to-End Testing

The Styx web application is tested end-to-end using Playwright (`playwright.config.ts`), which executes browser-based test suites across four engines: Chromium, Firefox, WebKit, and Mobile Chrome. The E2E test suites cover critical user journeys:

- **Authentication**: registration, login, session persistence, and logout flows.
- **Auth Guards**: verification that protected routes redirect unauthenticated users.
- **Contract Lifecycle**: creation, stake authorization, proof submission, and settlement.
- **Dashboard**: rendering of contract status, integrity score, and wallet balance.
- **Fury Workbench**: proof review queue, verdict submission, and accuracy display.
- **Recovery Contracts**: accountability partner assignment, attestation submission, and safety acknowledgment enforcement.
- **Wallet**: balance display, transaction history, and withdrawal flow.

The Playwright configuration includes a `webServer` directive that automatically starts the Next.js development server before test execution, ensuring that E2E tests run against a live application instance. The base URL defaults to `http://localhost:3001`.

### 3.4.4 The Code-Proof Correspondence Principle

A methodological contribution of this dissertation is the code-proof correspondence principle: every formal theorem (T1--T9) is accompanied by an explicit mapping between its mathematical definitions and the TypeScript source code that implements those definitions. This mapping serves two purposes.

First, it enables independent verification. A reviewer who reads Theorem T1 (Ledger Balance Invariant) can follow the code references to `LedgerService.recordTransaction()` and `LedgerService.verifyLedgerIntegrity()`, inspect the implementation, and confirm that the code faithfully implements the operations described in the proof. The mapping is not a claim that the code is formally verified in the sense of machine-checked proof (e.g., Coq, Lean, or Isabelle/HOL); rather, it provides sufficient traceability for manual expert review.

Second, it grounds the formal contribution in executable reality. Many formal analyses in information systems research exist in a purely theoretical plane, disconnected from any implementation. The code-proof mapping ensures that the properties proven in Chapter 4 are not aspirational specifications but descriptions of implemented, tested, and deployable behavior. This grounding is consistent with the DSR paradigm's emphasis on instantiation as a valid contribution type (Hevner et al., 2004).

Each theorem in Chapter 4 includes a code-to-proof mapping table of the following form:

| Formal Object | Code Location | Test File |
|---------------|---------------|-----------|
| $B(a)$ | `LedgerService.getAccountBalance()` | `ledger.service.spec.ts` |
| $h_j$ | `TruthLogService.appendEvent()` | `truth-log.service.spec.ts` |
| $IS(u)$ | `calculateIntegrity()` | `integrity.spec.ts` |

This protocol is applied uniformly across all nine theorems, providing a complete bidirectional traceability matrix between formal mathematics and executable TypeScript.

### 3.4.5 Continuous Integration and Deployment

The CI/CD pipeline is implemented in GitHub Actions. The primary CI workflow (`ci.yml`) executes on every push and pull request against the main branch. The pipeline stages are:

1. **Environment Setup**: Node.js 20, dependency installation via `npm ci`.
2. **Security Audit**: `npm audit` for known vulnerability scanning.
3. **Build**: `turbo run build` (incremental, cached).
4. **Lint**: `turbo run lint` (strict TypeScript compilation via `tsc --noEmit` per workspace).
5. **Test**: `turbo run test` (Jest across all workspaces, with coverage enforcement).
6. **Validation Gates 04--07**: Redacted build check, behavioral physics check, security invariant check, claim drift check.
7. **Beta Readiness**: `scripts/smoke/beta-readiness.sh` (comprehensive deployment readiness suite).
8. **Terraform Validate**: Infrastructure-as-code validation for Render services, Cloudflare R2, and WAF rules.
9. **E2E Tests**: Playwright across Chromium and Firefox engines.
10. **CodeQL Analysis**: Automated security scanning for code quality vulnerabilities.

The deployment workflow (`deploy.yml`) triggers on semantic version tags, deploying the API and web application to Render with post-deployment smoke tests. Additional workflows handle beta promotion (`beta-promotion.yml`) and staging promotion (`staging-promotion.yml`).

Infrastructure-as-code is managed via Terraform (`infra/terraform/`), defining Render services, Cloudflare R2 buckets, and WAF rules. The Render Blueprint (`render.yaml`) specifies four services: API (NestJS), Web (Next.js), PostgreSQL, and Redis, all deployed in the Oregon region on the starter plan. A root `Dockerfile` provides an API-only container image for alternative deployment targets.

---

## 3.5 Ethical Considerations

### 3.5.1 Iatrogenic Harm and the Aegis Safety Protocol

A platform that uses financial penalties to drive behavioral change introduces risks absent from conventional wellness applications. The system's core mechanism --- loss aversion amplified by real financial stakes --- is precisely what makes it potentially effective, but it is also what makes it potentially dangerous. The same psychological force that motivates a user to maintain their exercise commitment can, if poorly calibrated, accelerate an eating disorder, trigger a financial spiral, or weaponize a no-contact boundary as an instrument of social isolation.

The Aegis Protocol (Definition D5, Theorem T5) addresses these risks through formal safety predicates. The six predicates were derived from a systematic analysis of iatrogenic harm categories:

**Financial harm.** Predicate $P_1$ (absolute stake cap at $500) prevents users from placing economically devastating stakes in moments of emotional intensity. Predicate $P_3$ (failure-triggered downscaling) prevents a pattern in which repeated failures lead to progressively larger revenge stakes, each intended to "win back" previous losses --- a pattern well documented in gambling addiction research (Clark et al., 2019). Predicate $P_4$ (integrity-based access control) restricts users with low behavioral track records to lower stakes, preventing newcomers from immediately accessing high-risk financial exposures.

**Physical harm.** Predicate $P_5$ (BMI floor at 18.5) prevents users whose Body Mass Index is at or below the WHO underweight threshold from creating weight-loss contracts, which would accelerate an already dangerous physiological state. Predicate $P_6$ (weekly weight-loss velocity cap at 2%) prevents contracts that demand weight-loss rates exceeding medical safety guidelines, regardless of the user's current BMI.

**Psychological harm.** Predicate $P_2$ (minimum contract duration of 7 days) prevents "flash contracts" that are too short to produce meaningful behavioral change and that encourage impulsive, high-frequency staking behavior. The Recovery Protocol (Definition D8, Theorem T8) addresses the unique psychological risks of no-contact boundary enforcement contracts through the anti-isolation predicate.

### 3.5.2 The Anti-Isolation Guarantee

Recovery-stream contracts --- particularly the `RECOVERY_NOCONTACT` oath category --- present a risk that is distinct from financial or physical harm: social isolation. A platform that enables users to stake money on avoiding contact with specific individuals could, in principle, be used to enforce coercive isolation patterns. An abusive partner could pressure a victim into creating a no-contact contract targeting supportive friends or family members. A user in a mental health crisis could impulsively isolate themselves from their entire support network.

The Recovery Protocol addresses these risks through four formal constraints (Definition D8): (1) a maximum of 3 no-contact targets per contract, preventing blanket social isolation; (2) a maximum duration of 30 days, forcing periodic re-evaluation of the commitment; (3) a mandatory accountability partner whose email address must be provided at contract creation, ensuring that at least one external witness is aware of the commitment; and (4) mandatory safety acknowledgments confirming that participation is voluntary, no minors are involved, no dependents are affected, and no legal obligations are violated.

The accountability partner requirement is particularly significant. It introduces an external observer who can intervene if the contract appears to be serving a coercive rather than therapeutic function. The partner receives notification of the contract's existence (though not of specific no-contact targets, preserving the user's privacy regarding whom they are avoiding), and their awareness creates a social check on potential misuse.

### 3.5.3 Informed Consent and Voluntary Participation

The Styx platform incorporates multiple informed consent mechanisms. Before creating any contract, users complete a structured intake flow that explains the financial mechanics, the loss aversion principle, the conditions under which their stake will be forfeited, and the dispute resolution process. The "Grill Me" pre-commitment interrogation (powered by Gemini 2.5 Flash) poses probing questions designed to surface ambivalence, unrealistic expectations, or coerced participation. The "ELI5" function provides plain-language explanations of contract terms, ensuring that users who are unfamiliar with behavioral economics or escrow mechanics can understand their commitments.

Two temporal safeguards provide additional protection against impulsive decisions. A 7-day cool-off period (`FAILURE_COOL_OFF_DAYS = 7`) is enforced after any contract failure, preventing immediate re-engagement while emotional distress is elevated. Grace days (2 per month, `MAX_GRACE_DAYS_PER_MONTH = 2`) allow users to extend their proof submission deadline by 24 hours without penalty, accommodating genuine scheduling conflicts without eliminating accountability.

### 3.5.4 Data Privacy and Minimization

The platform adheres to data minimization principles throughout its architecture. Health data (BMI, weight, biometric measurements) is validated at contract creation by the Aegis Protocol and then discarded --- the system stores the boolean outcome of the safety check (contract accepted or rejected) but does not persist raw health metrics beyond the validation step. Proof media is stored in Cloudflare R2 with time-limited signed URLs; proofs are not publicly accessible and can be purged after the review period and any applicable dispute window have closed.

No-contact target identifiers in recovery contracts are stored as one-way hashes, never as plaintext. The `RecoveryMetadata` interface specifies `noContactIdentifiers` as an array of hashed values, ensuring that even a database compromise would not reveal whom the user is avoiding. Accountability partner emails are stored in plaintext (necessary for notification delivery) but are subject to the platform's standard data retention and deletion policies.

The truth log presents a specific tension with data minimization. The append-only, hash-chained architecture ensures tamper evidence but complicates the right to erasure: deleting or modifying a historical event would break the hash chain and invalidate all subsequent entries. This tension is acknowledged as a limitation. A future implementation could adopt a Merkle tree structure with redactable commitments, enabling selective event redaction while preserving chain integrity for non-redacted events. For the current prototype, the truth log stores event metadata and references (proof IDs, contract IDs, user IDs) rather than raw personal data, minimizing the privacy impact of its immutability.

### 3.5.5 Human Subjects and IRB Considerations

This dissertation does not involve human subjects. The prototype has not been deployed to live users, no behavioral data has been collected from real participants, and no randomized controlled trial has been conducted. All tests are executed against synthetic data, mock services, and simulated user interactions. The validation gates use programmatically generated test fixtures rather than real user records.

A future empirical evaluation of the Styx platform --- specifically, a randomized controlled trial comparing behavioral outcomes between Styx users and a control group using a conventional wellness application --- would require Institutional Review Board (IRB) approval. Such a study would need to address several specific concerns: the financial risk inherent in stake-based participation, the psychological risk of repeated failure penalties, the vulnerability of recovery-stream participants (who may be dealing with substance abuse, relationship difficulties, or mental health challenges), and the requirement for informed consent that fully discloses the loss aversion mechanism and its intended psychological effect. The study protocol would need to include a data safety monitoring board empowered to halt the trial if iatrogenic harm signals emerge.

These considerations are identified as critical prerequisites for the next phase of research. The present dissertation establishes the formal and technical foundation; the empirical phase requires separate ethical review and approval.
