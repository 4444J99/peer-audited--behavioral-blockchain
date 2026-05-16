# Evaluation-to-Growth — `docs/architecture/` Corpus

> **Framework**: Evaluation-to-Growth (Critique → Reinforcement → Risk Analysis → Growth)
> **Subject**: 10 files / 2,688 lines under `docs/architecture/`
> **Date**: 2026-05-16
> **Mode**: Autonomous, markdown report
> **Reviewer**: Claude Code (Opus 4.7) per `/evaluation-to-growth` skill
> **Prior reviews on file** (do not duplicate): `docs/doc--evaluation-to-growth-review.md` (2026-02-28, full codebase); `docs/planning/2026-03-05-evaluation-to-growth-final-report.md`; `docs/planning/evaluation-to-growth--full-breath-audit--2026-03-06.md`

---

## Executive Summary

The `docs/architecture/` corpus has **strong substance and weak curation**. The technical content is competent — in places excellent — but the directory is a sediment layer of past research drops rather than an authored architectural record. Three of the ten files (`feasibility-stack.md`, `truth-blockchain.md`, `truth-blockchain-v2.md`) answer the same question from three different LLM authors, and two of those three are content-equivalent renders of the same source material. Engineering docs (`test-strategy.md`, `load-test-report.md`) contain *verifiable filesystem drift* — they reference paths (`apps/api`, `packages/shared`, `scripts/gates/`) that don't exist in the current repo and gate names that don't match the actual `scripts/validation/` files. Compounding the curation gap: a separate `docs/adr/` directory holds 5 substantive ADRs that answer questions the architecture corpus leaves implicit (dual-layer pattern, Stripe FBO escrow design, Fury consensus parameters) — but no file under `docs/architecture/` links to or references them.

Six concrete issues, ranked:

1. **Triplicate content on the core architectural question.** `feasibility-stack.md` (525 lines), `truth-blockchain.md` (290 lines), `truth-blockchain-v2.md` (1,002 lines) cover the same scope: wearable APIs, Plaid, video pipeline, leaderboard stack. Word-vocabulary diff between v1 and v2 is zero (verified this session via `grep -oE '[A-Za-z]{4,}' | sort -u`) — same source content, different rendering (LaTeX-style footnotes in v1 vs Markdown links in v2). Maintenance cost on a triplicated source is N×; drift cost is also N×.
2. **Filesystem drift in `test-strategy.md`.** Doc lists `apps/api`/`packages/shared` workspaces (`src/api`/`src/shared` exist), `scripts/gates/` (doesn't exist; actual is `scripts/validation/`), and 8 gate names where only 2 ("Phantom Money", "Fury Crucible") match real files. The `07-claim-drift-check.js` gate would fail on this file if scanned.
3. **No README/index in the directory.** A reader landing in `docs/architecture/` cannot tell which file is canonical, which is research, which is forward-looking spec, or which is generated artifact.
4. **Author/source provenance missing on the LLM-generated docs.** `feasibility-stack.md` opens with a Perplexity logo; `truth-blockchain.md` and `-v2.md` appear to be Gemini/other-LLM output. Neither states authorship, model, prompt, or date-of-generation. The corpus reads as "the team's architecture" but is partly third-party AI research artifacts.
5. **Misclassified files.** `architecture--alpha-to-omega-plan.md` is a 5-phase product roadmap (planning artifact), not architecture. `spec--digital-exhaust-intake.md` and `spec--fury-router.md` are forward-looking module specs (Stage IV Backcasting) — they belong in `docs/specs/` or as `prd/` adjuncts, not under "architecture" alongside as-built docs.

6. **`docs/architecture/` and `docs/adr/` are orphaned from each other.** The repo has 5 substantive ADRs (`adr--001-dual-layer-services-modules.md`, `adr--002-fbo-escrow-model.md`, `adr--003-linguistic-cloaker.md`, `adr--004-fury-consensus-engine.md`, `adr--005-dual-rate-limiting.md`) that directly answer questions the architecture corpus leaves implicit (the dual-layer pattern, Stripe FBO design, Fury consensus parameters). No file in `docs/architecture/` links to or acknowledges them. The architectural record exists; the index doesn't.

The good news: every issue is reversible without losing content. Most are curation moves (rename, move, dedupe, add an index) plus three targeted edits to bring drifted docs back in line with disk reality.

---

## Phase 1: Evaluation

### 1.1 Critique — Strengths and Weaknesses

**Strengths**

- `architecture--aegis-tier-reconciliation.md` (83 lines) is the model document in this set: clean scope, explicit gate ordering, named principle ("Aegis always wins"), no drift against current code. This is what every architecture file should look like.
- `load-test-report.md` is well-structured: objectives, 5 named scenarios, target metrics by load profile, infrastructure constraints with actual Render/PostgreSQL/Redis limits, and a result template waiting to be filled. It also correctly admits empirical absence (`No load tests have been executed yet`) — rare honesty.
- `spec--digital-exhaust-intake.md` and `spec--fury-router.md` apply a consistent "Backcasting" template (Omega → 18mo → 12mo → 6mo → Present Sprint) with concrete acceptance criteria. The structural discipline is high; these are well-formed module specs.
- The technical depth on biometric integration (HealthKit predicate logic, Health Connect migration, Whoop v2 webhook pattern) is real and current — these were sharper than typical "feasibility report" content in February 2026.
- pHash/perceptual-hash anti-duplication argument is well-supported and matches what the repo actually implements (`services/anomaly/` per root `CLAUDE.md`).

**Weaknesses**

- **Triplicate coverage of one question** (issue #1 above). `truth-blockchain.md` v1 and v2 are content-equivalent (same source material rendered with different footnote styles — LaTeX-ish numerical refs vs Markdown links). `feasibility-stack.md` covers the same topic from a different LLM. Reader cannot tell which is current or canonical.
- **Generated artifacts treated as authored documents.** No frontmatter on the long research files indicating generator, prompt, date, intended use, or replacement plan. By contrast, `load-test-report.md` and `test-strategy.md` *do* have `generated: true` frontmatter — a partial convention that hasn't been applied to the research docs.
- **Filesystem drift in two engineering docs** (issue #2 above). Specifically:
  - `test-strategy.md:24-28` (workspaces table): `apps/api`, `apps/web`, `apps/mobile`, `packages/shared` — none exist. Actual: `src/api`, `src/web`, `src/mobile`, `src/shared`.
  - `test-strategy.md:86-95` (validation gates table): 8 gates with mismatched names. Actual `scripts/validation/` holds 9 files (01-phantom-money, 02-simulator-spoof, 03-the-full-loop, 04-redacted-build, 05-behavioral-physics, 06-security-invariant, 07-claim-drift, 08-fury-crucible, 09-realm-sync).
  - `test-strategy.md:99-106` Turbo pipeline JSON references `@styx/*` correctly but the dependency layout assumes a `packages/` workspace that doesn't exist (root `package.json` globs are `src/*` and `packages/*`, with `packages/` currently empty).
  - `test-strategy.md:136-140` references `scripts/` smoke scripts that don't all exist in the documented form (the actual repo uses `scripts/smoke/beta-readiness.sh`, etc., per root `CLAUDE.md`).
- **`architecture--technical-feasibility.md` is a 14-line stub** that summarizes the larger feasibility docs but has no obvious role (not an index, not a charter, not a decision record).
- **`alpha-to-omega-plan.md` is planning, not architecture.** The 5-phase month-by-month plan (Iron Core → Shield → Panopticon → Arena → Empire) is a roadmap. Roadmaps belong in `docs/planning/`; the directory already has `planning--roadmap--alpha-to-omega--definitive--2026-03-04.md` which likely supersedes this.
- **Two `spec--*` files are forward-looking specifications**, not architecture of the as-built system. They describe a 36-month omega state and a "Present Sprint" foundation. Belong in `docs/specs/` (which doesn't exist yet) or `docs/architecture/specs/`.
- **No diagram in the directory.** Twelve thousand words of architecture, zero ASCII or image diagrams of the dual-layer API structure, the Fury Router pipeline, or the data-flow between sensor → ledger → leaderboard. The root `CLAUDE.md` even calls the dual-layer (`services/` + `src/modules/`) pattern "the most important structural detail" — and the architecture corpus does not depict it.

**Priority improvement areas (ranked)**

1. Resolve the triplicate (delete v1, mark v2 as research-input, write a thin canonical `architecture--core.md` that points at the as-built code).
2. Fix `test-strategy.md` drift against disk (workspace paths, gate file/name list, smoke scripts).
3. Add `docs/architecture/README.md` (or `index.md`) explaining which file is what.
4. Move planning + spec docs out of `architecture/`.
5. Add a diagram of the dual-layer API.

### 1.2 Logic Check — Internal Consistency

**Contradictions found**

- `truth-blockchain.md` and `truth-blockchain-v2.md` both recommend **Supabase Realtime** for the WebSocket layer as the "superior architectural choice" over AWS. The root `CLAUDE.md` and `render.yaml` show the actual stack is **Render + Cloudflare R2 + native NestJS SSE/WebSocket helpers** (`services/realtime/`). The corpus recommendation contradicts the as-built decision — and neither file acknowledges the choice was made the other way.
- The same docs recommend **Hetzner unmetered servers** for FFmpeg transcoding. The repo deploys on Render. Either the recommendation was rejected (and should be noted), or it represents a future plan, but the corpus presents it as the architecture.
- `feasibility-stack.md` recommends **Plaid** in the body but also points to **Quiltt / Open Bank Project** as cost-effective alternatives — without indicating which the project chose. Repo evidence (`render.yaml`, env vars in CLAUDE.md) suggests neither is wired in production yet; the financial layer appears to be Stripe FBO only. The doc creates the impression of an integration that isn't there.
- **Fury consensus is contradicted three ways across the corpora.** `test-strategy.md` (§7.2) claims **3-of-5 quorum**. `spec--fury-router.md` (§5) says **2-of-3 consensus** for contracts > $1000. `adr--004-fury-consensus-engine.md` (the canonical ADR) says **3 auditors, 2/3 or 3/3 agreement, 3-way split escalates to senior pool** with no $1000 threshold mentioned. Root `CLAUDE.md` doesn't pin the number. The ADR is the most recent and most authoritative of the three; the other two are stale.
- `architecture--feasibility-stack.md` repeatedly cites Google Fit (steps integration patterns). `architecture--truth-blockchain-v2.md` correctly notes Google Fit is being deprecated in 2026 and the migration target is Health Connect. The feasibility doc was not updated to reflect this.

**Reasoning gaps**

- No doc explains *why* the project chose Render over the recommended cost-optimized stacks (Hetzner+Cloudflare R2 alone would, per the corpus's own analysis, reduce video TCO 60×). The decision was clearly made; the rationale is absent.
- No doc explains how the **Aegis Protocol** and **Recovery Protocol** map onto the dual-layer (`services/` + `src/modules/`) implementation. The reconciliation doc names the gates but doesn't tie them to code locations. (ADR-001 documents the pattern itself; the mapping from safety gates to dual-layer placement is what's missing.)
- Stripe FBO escrow gets one line in `alpha-to-omega-plan.md`. The actual design lives in `adr--002-fbo-escrow-model.md` (alternatives considered, hold/capture/cancel lifecycle, code locations). The gap is that `docs/architecture/` does not reference ADR-002 — a reader of the architecture corpus alone would conclude the highest-risk subsystem is undocumented when it isn't.

**Unsupported claims**

- `truth-blockchain-v2.md` paragraph on Whoop: "twenty minutes post-workout for the user's heart rate to return to baseline" — cited but the cite is to Whoop support, not a primary clinical source. The architectural conclusion (use webhooks not synchronous POST) is sound; the supporting figure is presented as fact.
- "Cloudflare R2 reduces this exact same workload to a flat $150 storage cost" — true for the 10TB scenario but the calculation excludes Cloudflare's per-operation costs and any compute for signed-URL issuance. Order-of-magnitude correct but presented as an exact number.
- `architecture--technical-feasibility.md` (14 lines) makes claims like "Node.js event loop for high I/O throughput" — true but unsupported in this doc; the supporting analysis lives elsewhere.

**Coherence recommendations**

- Pin a single number for Fury consensus across the corpus (the codebase will have one answer; the docs should match).
- Whenever the corpus recommends a vendor (Supabase, Hetzner, Plaid), add a one-line "Decision: ADOPTED / REJECTED / DEFERRED" tag with linkback to the ADR that resolved it.
- Quarantine Google Fit references behind a "legacy — see Health Connect" header until they can be removed.

### 1.3 Logos — Rational Appeal

**Argument clarity**: High in the well-formed docs (`aegis-tier-reconciliation.md`, the two `spec--*` files, `load-test-report.md`). Medium in the long research docs (good per-section, weak at the *integration* layer — they don't argue *why* this stack vs others except by feature comparison).

**Evidence quality**: Mixed. The biometric API claims are well-anchored to vendor docs. The cost claims are arithmetic from current vendor pricing pages. The leaderboard argument (Redis Sorted Sets, O(log N)) is well-supported by standard distributed-systems sources. The Supabase argument relies more on vendor-comparison blog posts (Leanware, UI Bakery — content-marketing tier sources) than primary engineering evidence.

**Persuasive strength**: The corpus is persuasive in the "feasibility study" mode — does the platform technically exist? Yes, with these primitives, here are the costs. It is weaker as architectural advocacy — *why* this stack, *why* these tradeoffs, *what* would have to change for an alternative to win. An ADR (Architecture Decision Record) directory adjacent would carry the persuasive load that the long research docs over-extend into.

**Enhancement recommendations**

- For each major external dependency adopted (Stripe, R2, Render, BullMQ, Redis), write a 1-page ADR in `docs/adr/` (the directory exists) explaining: alternatives considered, why chosen, when to revisit.
- Strip "we recommend X" framing from the research docs — they are research inputs to past decisions, not advocacy artifacts going forward. Reframe as "options analyzed in 2026-02".

### 1.4 Pathos — Emotional Resonance

This is a technical corpus; pathos is intentionally low and that is correct for the genre. The exception is `alpha-to-omega-plan.md`, which uses **mythic naming** (Phase Alpha: The Iron Core; Phase Beta: The Shield; Phase Gamma: The Panopticon; Phase Delta: The Arena; Phase Omega: The Empire). This connects to the Styx universe's vocabulary (Fury, Vault, Oath, Aegis) and reinforces the "blockchain of truth" narrative. The connection is effective for a founder/contributor audience.

The two `spec--*` files use a more clinical voice ("Per METADOC Section 4.C — working backward from the desired future state") that suits formal specification but is jarring in the same directory as the Olympian roadmap. The corpus has two voices and doesn't acknowledge the switch.

**Audience connection**: Architecture docs are read by (a) future maintainers, (b) onboarding contributors, (c) external auditors during security/compliance review, (d) investors during diligence. The current corpus serves (a) and (b) imperfectly (drift, no index) and serves (c) poorly (a security auditor cannot quickly answer "what's the data flow for a money-stake operation?" from these files). It is unclear whether (d) is intended.

**Engagement level**: A new contributor opening `docs/architecture/` first will likely open `truth-blockchain-v2.md` (largest file) and spend 30 minutes reading research-style prose before realizing the as-built system uses none of the recommended vendors named there (Supabase, Hetzner, Quiltt). This is corrosive to early engagement.

**Recommendations**

- Decide who the docs are *for* and pin it in a README header.
- If they're for internal maintenance: split research-as-input from architecture-as-record and label each.
- If they're (also) for external review: add a 1-page "system at a glance" diagram at the directory root.

### 1.5 Ethos — Credibility & Authority

**Perceived expertise**: High at the per-doc level. The technical content reflects real understanding of the domains (iOS HealthKit predicate logic, Stripe FBO, BullMQ patterns, Redis sorted sets, perceptual hashing).

**Trustworthiness signals present**: Citation-heavy in the research docs (56+ footnotes each). Generated-frontmatter on the test/load docs. Explicit "No load tests have been executed yet" admission in `load-test-report.md`. These all build trust.

**Trustworthiness signals missing**:

- No authorship/source statement on `feasibility-stack.md`, `truth-blockchain.md`, `truth-blockchain-v2.md`. They are clearly LLM-generated (Perplexity for the first, likely Gemini for the others based on phrasing and footnote style). Treating LLM research output as architecture-of-record without disclosure is an ethos risk during external review.
- No "last verified against code" date on any doc. All headers say "March 6, 2026"; nothing says "claims in this doc were checked against `src/` on 2026-03-06 and have not been re-verified."
- Filesystem drift in `test-strategy.md` is a credibility hit — a reviewer who tests one fact and finds it wrong starts discounting the rest.

**Authority markers**: The `governing_sop: "SOP--testing-standards.md"` frontmatter on `test-strategy.md` claims governance authority but the SOP file path is not present in the docs directory and not obviously linked. The "Governing Standard: `meta-organvm/METADOC--research-standards.md`" reference in the spec files points outside the repo (to ORGAN-IV) with no link or version pin.

**Credibility recommendations**

- Add an authorship header to every LLM-generated doc: who/what generated it, when, what model, and what role it plays now (research input vs current architecture).
- Add a "Last verified against code: YYYY-MM-DD" field next to the date.
- Fix `test-strategy.md` drift before it discounts the corpus further.
- Either link out to the `meta-organvm/METADOC` files or inline the relevant sections.

---

## Phase 2: Reinforcement

Consolidating Phase 1 findings into resolvable actions.

**Resolve contradictions**

| Contradiction | Resolution |
|---|---|
| Triplicate truth-blockchain coverage | Delete `truth-blockchain.md` (v1). Mark `truth-blockchain-v2.md` and `feasibility-stack.md` with `kind: research-input, status: archived` frontmatter. Write a new ~150-line `architecture--core.md` that describes the **as-built** stack with code-location links. |
| Supabase/Hetzner/Plaid recommendations vs as-built stack | In the new `architecture--core.md`, state the actual decisions (Render, R2, Stripe FBO, BullMQ, native PG/Redis). Cross-reference an ADR for each choice. |
| Fury consensus: 3-of-5 vs 2-of-3 | Pick one (per `fury-router.md` v2 spec, 2-of-3 with escalation to "High Trust" for $1000+). Update `test-strategy.md` to match, or update the spec to match the codebase — whichever is currently true in `services/fury-router/`. |
| Google Fit references in `feasibility-stack.md` | Quarantine behind a "legacy — Health Connect is the path forward" note OR remove section if Health Connect content now lives in `truth-blockchain-v2.md`. |

**Fill reasoning gaps**

- Write a 1-page ADR for each: choice of Render, choice of R2, choice of Stripe FBO, choice of BullMQ over RabbitMQ, choice of pg+native over Supabase.
- Add a sub-section to `aegis-tier-reconciliation.md` (or a new doc) mapping each gate to its code location (e.g., "BMI floor enforced at `src/api/services/health/aegis.service.ts:<line>`").
- Write an explicit Stripe FBO design doc — escrow hold/capture/cancel flow, dispute handling, webhook idempotency strategy. This is currently missing and is the highest-risk financial component.

**Support unsupported claims**

- Replace the "twenty-minute baseline" Whoop claim with the actual constraint we're enforcing (timeout configuration, webhook acceptance window).
- Add caveat to R2 cost numbers ("storage only; per-operation and signed-URL issuance costs additional").

**Strengthen transitional logic**

- The new `architecture--core.md` should be the *entry point* — every other doc in the directory should be linked from it with a one-line description.
- The README should answer: which doc do I read first? which docs are research inputs? which describe future work?

---

## Phase 3: Risk Analysis

### 3.1 Blind Spots — Hidden Assumptions

- **Assumes the LLM-research docs reflect the team's current thinking.** They are dated 2026-03-06; the codebase has moved (per CLAUDE.md commits, gates 04–07 were implemented in CI, Stripe FBO landed, Sentry integration appeared). The architecture corpus has not been refreshed. A contributor reading it today will form an outdated mental model.
- **Assumes Google Fit deprecation is "Health Connect migration"** as if migration is binary. In practice, supporting both is required during transition (devices on Android < 13 cannot use Health Connect). No doc addresses the dual-stack support window.
- **Assumes Stripe FBO is sufficient for high-risk merchant underwriting.** `alpha-to-omega-plan.md` flags Corepay/Allied Wallet as the actual high-risk processor, but no architecture doc covers what changes when Stripe says no and a high-risk processor is needed. The architectural blast radius of swapping the payment processor is not analyzed.
- **Assumes the Fury Router is decentralized in a meaningful sense.** All routing logic, anti-collusion guards, honeypot generation, and reputation accounting run on Styx's own infrastructure. The system is more accurately "anonymized peer audit" than "decentralized." No doc owns this nuance, which is a marketing-vs-engineering ethos risk.
- **No threat model.** The architecture corpus describes anti-cheating (honeypots, pHash, double-anonymization) but does not enumerate adversary classes (lone cheater, colluding pair, sybil ring, internal threat, hostile auditor pool). `docs/architecture/` is the natural home for an STRIDE-style threat model and it isn't here.
- **No data-retention or right-to-deletion architecture.** GDPR/CCPA implications of a hash-chained ledger that cannot be edited are unaddressed. "Truth log" + "right to deletion" is a real tension; no doc owns it.
- **No multi-region or DR architecture.** Render single-region (Oregon) is a single point of failure for a financial system. No doc addresses RPO/RTO or what happens if Render Oregon goes down for hours.

**Potential biases**

- LLM-research docs over-recommend their respective vendors (Perplexity-stack leans into Plaid; Gemini-stack leans into Supabase). The corpus inherits each model's vendor bias.
- The corpus over-weights consumer-app concerns (video pHash, peer review) relative to financial-system concerns (escrow reconciliation, accounting integrity, regulatory reporting). A reader would not guess from the architecture docs that the highest-stakes failure mode is financial, not behavioral.

**Mitigation strategies**

- Re-verification cadence: pin a date (quarterly?) for "verify architecture docs against `src/`" with a CHECKLIST.
- Add a threat-model doc (`architecture--threat-model.md`) with adversary classes and per-adversary defenses.
- Add a data-lifecycle doc covering retention, deletion, ledger immutability, and regulatory carve-outs.
- Add an DR/multi-region posture doc.

### 3.2 Shatter Points — Critical Vulnerabilities

**1. `test-strategy.md` drift would fail external audit** (Severity: HIGH)
- A SOC 2 / ISO 27001 auditor opening `test-strategy.md` and finding workspace paths (`apps/api`) that don't exist would conclude the documentation is unreliable. This contaminates trust in adjacent compliance-relevant docs (Aegis, Recovery Protocol).
- *Preventive measure*: fix this week; add `07-claim-drift-check.js` coverage for `test-strategy.md` so this can't recur.

**2. LLM-research docs presented as architecture-of-record** (Severity: MEDIUM-HIGH)
- A diligence reviewer who recognizes the Perplexity logo / Gemini phrasing without an authorship statement will downgrade their confidence in the team's authorship of the design. The technical content is sound; the framing is the risk.
- *Preventive measure*: add `kind: research-input, generated-by: <model>, generated-on: <date>, current-role: archived-or-reference` frontmatter to all three large research docs.

**3. Stripe FBO architecture orphaned from `docs/architecture/`** (Severity: MEDIUM)
- The design exists in `adr--002-fbo-escrow-model.md` (hold/capture/cancel lifecycle, alternatives, code locations). The 2026-02-28 review's "no Stripe idempotency keys" finding is *not* addressed in ADR-002 — that specific failure mode (network-retry duplicate PaymentIntents) is still uncovered.
- *Preventive measure*: cross-reference ADR-002 from the new `architecture/README.md` and `architecture--core.md`. Extend ADR-002 (or write ADR-006) covering the idempotency strategy specifically. Do not duplicate ADR-002's content in `docs/architecture/`.

**4. Fury consensus parameter contradicted three ways** (Severity: MEDIUM-HIGH)
- `test-strategy.md` says 3-of-5; `spec--fury-router.md` says 2-of-3-conditional-on-$1000; `adr--004-fury-consensus-engine.md` (canonical) says 3-auditor with 2/3 or 3/3 agreement and 3-way-split escalation, no $1000 threshold. The ADR points at `src/api/services/fury-router/fury-router.service.ts` as the implementation; that file is the codebase truth. The architecture corpus is internally inconsistent and additionally inconsistent with the ADR.
- *Preventive measure*: pull the consensus parameter into `src/shared/libs/integrity.ts` (or behavioral-logic.ts) as an exported constant referenced by both the code and the doc. Update `test-strategy.md` and `spec--fury-router.md` to match ADR-004 verbatim, or supersede them.

**5. Dual-layer API pattern documented in ADR-001 but invisible from `docs/architecture/`** (Severity: LOW)
- `adr--001-dual-layer-services-modules.md` describes the pattern (directory tree, rules, positive/negative consequences, alternatives rejected). The architecture corpus does not link to it. A contributor reading `docs/architecture/` first would miss the canonical record.
- *Preventive measure*: link ADR-001 from `architecture/README.md` and surface the directory-tree diagram in `architecture--core.md` (with the ADR as the authoritative source).

**6. No diagram, anywhere** (Severity: LOW but persistent)
- Architecture without diagrams is testimonial architecture. Every reader has to construct the picture from prose. This compounds with the other shatter points.
- *Preventive measure*: one canonical block diagram of the data flow (sensor → API → ledger → Fury → settlement → leaderboard) at the root. Mermaid or ASCII is fine.

**Attack vectors a hostile reviewer would use**

- "You claim X test coverage but the workspaces in your test-strategy doc don't exist in your repo — what else doesn't match?"
- "These three research docs read like AI output and have no authorship — is the team actually doing original architecture work, or is it derivative?"
- "Your highest-risk subsystem (money escrow) has no architecture doc — how do you reason about correctness?"
- "Your consensus protocol parameter differs across your own docs — which is shipped?"

**Contingency preparations**

- The 2026-02-28 review at `docs/doc--evaluation-to-growth-review.md` is the most credible artifact in the directory because it openly flagged broken things. Continue that tradition: name what's broken explicitly. A reviewer trusts a doc that names problems more than a doc that doesn't.

---

## Phase 4: Growth

### 4.1 Bloom — Emergent Insights

Three patterns the corpus reveals that go beyond any single fix:

**Pattern 1: The corpus is a sediment layer, not a curated record.**
What's here is what landed when, never re-curated. The fix isn't to delete things — it's to *acknowledge sediment layers* and label them. Add a `kind:` frontmatter taxonomy: `as-built` (describes current code), `research-input` (informed past decisions, archived), `forward-spec` (proposes future state), `roadmap` (planning, belongs elsewhere). The triplicate-truth-blockchain problem dissolves once two of the three are explicitly `research-input` and not competing for "canonical."

**Pattern 2: There is no separation between "what we built," "what we considered," and "what we plan."**
This is the root cause of the contradiction set. An as-built doc and a forward-spec for the same module can coexist without contradiction *if labeled*. The fix is taxonomic, not editorial.

**Pattern 3: The team voice and the LLM voice are interleaved.**
`aegis-tier-reconciliation.md` and the smaller engineering docs sound like the team. The big research docs sound like Perplexity/Gemini. The interleaving is silent. Labeling the source is honest and frees the team to use LLM research without ethos cost.

**Expansion opportunities**

- An `architecture--threat-model.md` with adversary classes (this corpus has the foundation — the Fury anti-collusion analysis, the pHash anti-duplication argument — but no integrated threat model).
- An `architecture--data-lifecycle.md` covering retention, deletion, ledger immutability vs GDPR right-to-erasure, B2B anonymization (`AnonymizeService` per CLAUDE.md is built but its design isn't documented here).
- An ADR series (the `docs/adr/` directory exists per the file listing — populate it: 10 ADRs for the 10 most consequential decisions).

**Novel angles**

- The `kind:` taxonomy + a `last-verified-against-code:` date field would, with one CI check, make docs verifiable artifacts the way `07-claim-drift-check.js` makes claims verifiable.
- The triplicate situation is an opportunity to *show the work*: instead of deleting the duplicates, archive them under `docs/architecture/research-inputs/` as a record of "here is the LLM research that informed our decisions" — useful for future diligence as evidence of due process.

**Cross-domain connections**

- This corpus's curation problem maps directly onto the larger four-registry problem documented in the home-scope `CLAUDE.md` (atoms / plans / IRF / pipeline have no shared identity scheme). Same shape: artifacts of different types living together without taxonomic distinction. Solution shape is the same: label first, then re-organize.

### 4.2 Evolve — Iterative Refinement (Recommended Action Queue)

A two-tier action queue. Tier 1 is a half-day of work and closes the credibility shatter points. Tier 2 is the directory reorganization.

**Tier 1 — Drift Fixes & Labels (close shatter points #1, #2, #4 within a half-day)**

1. Edit `test-strategy.md`:
   - Workspaces table: `apps/api` → `src/api`, `apps/web` → `src/web`, `apps/mobile` → `src/mobile`, `packages/shared` → `src/shared`.
   - Validation gates table: rewrite to match `scripts/validation/*` (9 gates including realm-sync; drop the fictional gates Orphan Contracts, Aegis Floor, Velocity Cap, Escrow Integrity, Recovery Guardrails, OR if those gates are intended-but-not-yet-built, mark them `STATUS: planned`).
   - Smoke scripts table: align with `scripts/smoke/` actual contents.
   - Resolve Fury consensus number (`§7.2` 3-of-5 vs `spec--fury-router.md §5` 2-of-3) — pick the codebase-truth one and update the other.
2. Add provenance frontmatter to the three LLM-research docs:
   ```yaml
   ---
   kind: research-input
   generated-by: <Perplexity Pro | Gemini | other>
   generated-on: 2026-03-06
   current-role: archived reference; not the as-built architecture
   superseded-by: architecture--core.md
   ---
   ```
3. Delete `architecture--truth-blockchain.md` (v1) — content-equivalent to v2 with a stale footnote style. Keep v2 with the new frontmatter above. (Vocabulary-diff equivalent, not byte-equivalent; full text comparison recommended before destructive delete. User authorization required.)

**Tier 2 — Curation & New Authored Docs (1–2 days)**

4. Add `docs/architecture/README.md` (the index): one paragraph per file, ordered "read this first" → "as-built docs" → "research inputs (archived)" → "forward specs" → "planning artifacts (will move)."
5. Author `architecture--core.md` (~150–200 lines): as-built description of the actual stack (Render + PostgreSQL 15 + Redis 7 + R2 + Stripe FBO + BullMQ + NestJS dual-layer). One block diagram. Code-location links throughout. This becomes the canonical entry point.
6. Move `architecture--alpha-to-omega-plan.md` → `docs/planning/` (it's a roadmap; the planning directory already has the canonical version).
7. Move `spec--digital-exhaust-intake.md` and `spec--fury-router.md` → `docs/specs/` (create directory) — they are forward-looking module specs, not architecture.
8. Cross-reference the **existing** 5 ADRs from the new `architecture/README.md`. Surface ADR-001's directory tree in `architecture--core.md`, ADR-002's lifecycle diagram in the escrow section, ADR-004's consensus rules in any Fury discussion. *Do not duplicate ADR content into `docs/architecture/`* — the ADR is the canonical source; architecture/ links to it.
9. Author the **missing** ADRs for decisions not yet captured: ADR-006 Render vs alternatives (hosting); ADR-007 Cloudflare R2 + native FFmpeg vs Cloudflare Stream / Mux; ADR-008 BullMQ over RabbitMQ; ADR-009 Native PG/Redis over Supabase; ADR-010 Stripe idempotency strategy (extends ADR-002, addresses the 2026-02-28 review finding). Verify before authoring each whether the decision is already captured in ADR-001–005.

**Tier 3 — Verification Hardening (longer horizon)**

10. Extend `scripts/validation/07-claim-drift-check.js` to scan `docs/architecture/*.md` for inline code-paths and verify they exist on disk. This prevents drift recurrence.
11. Add a "Last verified against code" CI hook (PreCommit on docs/) or quarterly manual cadence.
12. Add `architecture--threat-model.md` and `architecture--data-lifecycle.md` to close the blind spots from §3.1.

---

## Final-State Snapshot

If Tier 1 + Tier 2 land:

```
docs/architecture/
├── README.md                              # NEW — index/entry point
├── architecture--core.md                   # NEW — as-built canonical
├── architecture--aegis-tier-reconciliation.md   # KEEP (model doc)
                                            # (NOTE: escrow design already lives in adr--002-fbo-escrow-model.md;
                                            #  architecture/README.md links there rather than duplicating)
├── architecture--feasibility-stack.md      # KEEP w/ research-input frontmatter
├── architecture--truth-blockchain-v2.md    # KEEP w/ research-input frontmatter
├── architecture--technical-feasibility.md  # CONSIDER MERGE into README
├── load-test-report.md                     # KEEP (well-formed)
└── test-strategy.md                        # KEEP, drift fixed

docs/specs/                                 # NEW DIR
├── spec--digital-exhaust-intake.md         # MOVED
└── spec--fury-router.md                    # MOVED

docs/planning/
└── alpha-to-omega-plan.md                  # MOVED from architecture/

docs/adr/                                   # EXISTING (5 ADRs, was not surfaced in earlier draft)
├── adr--001-dual-layer-services-modules.md
├── adr--002-fbo-escrow-model.md
├── adr--003-linguistic-cloaker.md
├── adr--004-fury-consensus-engine.md
├── adr--005-dual-rate-limiting.md
├── adr--006-render-vs-alternatives.md      # NEW
├── adr--007-r2-native-vs-stream-mux.md     # NEW
├── adr--008-bullmq-over-rabbitmq.md        # NEW
├── adr--009-native-pg-redis-vs-supabase.md # NEW
└── adr--010-stripe-idempotency.md          # NEW (extends ADR-002)
```

**Net change**: 10 files → 12 files under `docs/architecture/` (one removed, two added; two existing moved out to `specs/` and `planning/`); `docs/adr/` extended from 5 to 10. Maintenance burden lower (no triplicates). Reader confusion much lower (taxonomic clarity + cross-references to existing ADRs). Credibility risk much lower (drift fixed, provenance disclosed). The architectural record was already substantially present in `docs/adr/`; this curation work makes it discoverable.

---

## Summary & Next Step

| Phase | Verdict |
|---|---|
| Critique | Strong content, weak curation; specific drift in 1 doc; triplication of 3 docs. |
| Logic | 5 contradictions found, all resolvable; 3 reasoning gaps named. |
| Logos | Argument depth high per-doc, persuasive structure weak at corpus level. |
| Pathos | Two voices interleaved; no acknowledgment of the switch. |
| Ethos | Authorship gaps + filesystem drift compound into credibility risk. |
| Risk | 1 HIGH-severity shatter point (drift), 1 MEDIUM-HIGH (3-way Fury consensus contradiction), 3 MEDIUM, 1 LOW. |
| Growth | Taxonomy + ADR series + drift CI = durable structural improvement. |

**Recommended next step**: Tier 1 (3 mechanical fixes, ~½ day). Tier 2 (curation + new authored docs, 1–2 days) closes the rest. Tier 3 is the recurrence-prevention investment.

*— end of report.*
