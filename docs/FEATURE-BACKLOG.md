# Styx Feature Backlog: Documentation → Implementation

**Version**: 1.4.0
**Generated**: 2026-02-28
**Codebase Baseline**: v0.8.0 (1,107 tests, 6 workspaces)
**Source Documents Ingested**: 37 markdown files across research, architecture, legal, planning, and brainstorm categories

---

## Executive Summary

### Status Breakdown

| Status | Count | Description |
|--------|-------|-------------|
| IMPLEMENTED | 23 | Working code with tests |
| PARTIAL | 7 | Code exists but incomplete or conditional |
| STUB | 4 | Files/endpoints exist but placeholder logic |
| NOT_STARTED | 44 | Described in docs, no code |
| **Total** | **78** | |

### P0: Beta Blockers (Must-Build for Phase 1 Private Beta)

| ID | Feature | Status | Blocker Reason |
|----|---------|--------|----------------|
| F-MOBILE-01 | Native iOS Camera Module | STUB | Cannot verify proofs without native capture |
| F-CORE-04 | Real-Money Stripe FBO Settlement | PARTIAL | Test-money only; need FBO routing for beta |
| F-AEGIS-03 | Age Gate (18+ Runtime) | IMPLEMENTED | Legal requirement for financial stakes |
| F-VERIFY-06 | Attestation Daily Flow (No-Contact) | IMPLEMENTED | Primary Phase 1 journey depends on this |
| F-WEB-01 | HttpOnly Cookie Auth Migration | IMPLEMENTED | Security requirement before public beta |
| F-LEGAL-01 | Contest Official Rules Engine | IMPLEMENTED | Every contest needs official rules per law |

### P1: Beta Enhancers (Should-Build for Phase 1)

| ID | Feature | Status |
|----|---------|--------|
| F-VERIFY-02 | HealthKit Native Bridge (iOS) | NOT_STARTED |
| F-UX-01 | Identity-Based Onboarding | NOT_STARTED |
| F-UX-03 | Dynamic Downscale Intervention | PARTIAL |
| F-FURY-03 | Cross-Lobby Auditing | NOT_STARTED |
| F-AEGIS-04 | Recovery Protocol Guardrails | PARTIAL |
| F-MOBILE-03 | Push Notifications | PARTIAL |
| F-SOCIAL-07 | Pod-Based Cohorts (Max 5) | NOT_STARTED | New for March 6 Launch |
| F-SOCIAL-08 | Pod-Level Visibility (Active/Out) | NOT_STARTED | Real-time failure broadcast within pod |
| F-SOCIAL-09 | Anonymous Peer Disclosure (First Name) | NOT_STARTED | Pod-only identity for accountability |
| F-FIN-05 | $39 Entry Model ($9 Fee + $30 Stake) | NOT_STARTED | Standardized MVP pricing |
| F-VERIFY-17 | Binary Daily Check-in (Self-Report) | NOT_STARTED | Initial verification fallback for MVP |
| F-VERIFY-15 | Whoop SCORED State Webhooks | NOT_STARTED | Part of Blockchain of Truth v2 |
| F-VERIFY-16 | HealthKit Metadata WasUserEntered | NOT_STARTED | Part of Blockchain of Truth v2 |

### P2: Post-Beta (Phase 2+)

Features that enhance but don't block: PvP lobbies, spectator markets, Plaid integration, B2B therapist dashboard, prediction markets, maintenance pools, referral system, and more (~30 features).

### P3: Future / Research-Only

Advanced features requiring external dependencies or significant R&D: EVM smart contracts, ZKP privacy layer, DECO oracles, brain-computer interfaces, hardware partnerships (~15 features).

### Critical Path: Phase 1 Private Beta

```
[Aegis Protocol] ──→ [Age Gate 18+] ──→ [Contest Rules] ──→ [Real-Money FBO]
        │                                                          │
        ↓                                                          ↓
[Native Camera] ──→ [Attestation Flow] ──→ [HttpOnly Auth] ──→ [TestFlight]
```

---

## Part I: Full Feature Catalog by Domain

---

### Domain 1: CORE — Ledger, Escrow, Financial Infrastructure

#### F-CORE-01: Double-Entry Ledger Engine

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0 (foundation)
- **Source**: `architecture--feasibility-stack.md` §S5, `architecture--truth-blockchain.md` §Financial Database, `planning--roadmap.md` §Alpha
- **Existing Code**: `src/api/services/ledger/ledger.service.ts`, `src/api/database/schema.sql` (accounts, entries tables)
- **Spec**: PostgreSQL double-entry accounting. Every financial transaction requires equal debit + credit entries. Money is never created or deleted. Core tables: `accounts` (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE), `entries` (debit/credit FKs, `CHECK(amount > 0)`), `event_log`. Zero-balance invariant enforced at SQL level, not application. `ON DELETE RESTRICT` prevents deletion of historical data.
- **Dependencies**: PostgreSQL
- **Legal/Compliance**: Required for financial audit trail and regulator defensibility.

#### F-CORE-02: Truth Log (Hash-Chained Audit Trail)

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0 (foundation)
- **Source**: `architecture--feasibility-stack.md` §S2.4, `architecture--truth-blockchain.md`, `planning--roadmap.md` §Alpha (checked)
- **Existing Code**: `src/api/services/ledger/truth-log.service.ts`, `src/api/database/schema.sql` (event_log table)
- **Spec**: Append-only `event_log` table. Each row's `current_hash` = hash(previous_hash || payload || timestamp). SHA-256 chain creates tamper-evident log. Optional future: anchor head hash to public blockchain.
- **Dependencies**: F-CORE-01

#### F-CORE-03: Integrity Score Algorithm

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0 (foundation)
- **Source**: `research--differentiation-competitor.md` §Gap 3, `research--evaluation-to-growth--strategic-review.md` §1.1
- **Existing Code**: `src/shared/libs/integrity.ts`, `src/shared/libs/integrity.spec.ts`
- **Spec**: `Base(50) + 5*completions - 15*frauds - 20*strikes - 1*inactive_months`. Floor 0. Tiers: RESTRICTED_MODE (<20, $0 max), TIER_1 (<50, $20), TIER_2 (<100, $100), TIER_3 (<500, $1K), TIER_4 (>=500, unlimited).
- **Dependencies**: None (pure algorithm)

#### F-CORE-04: Stripe FBO Escrow (Hold/Capture/Cancel)

- **Status**: PARTIAL
- **Phase**: Alpha
- **Priority**: P0 (beta-blocker)
- **Source**: `legal--aegis-protocol.md` §3, `legal--gatekeeper-compliance.md` §1, `legal--performance-wagering.md` §Variant 1, `planning--roadmap.md` §Alpha
- **Existing Code**: `src/api/services/escrow/stripe.service.ts`, `src/api/services/escrow/dispute.service.ts`, `src/api/src/modules/payments/`
- **Spec**: Stripe Connect FBO routing. User stakes $X → Stripe holds in FBO. On resolution: refund to user, platform fee to house, bounty to Furies. Currently test-money only; real-money settlement path needs activation.
- **Dependencies**: High-risk merchant account (F-INFRA-01)
- **Legal/Compliance**: Mandatory to avoid Money Transmitter classification. Zero custody model.

#### F-CORE-05: Behavioral Logic Engine (7 Oath Categories)

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0 (foundation)
- **Source**: `research--behavioral-engineering-masters.md` §Synthesis, `research--behavioral-economics.md` §Introduction
- **Existing Code**: `src/shared/libs/behavioral-logic.ts`, `src/shared/libs/behavioral-logic.spec.ts`
- **Spec**: 7 categories: Biological, Cognitive, Professional, Creative, Environmental, Character, Recovery. Constants: grace days 2/month, onboarding bonus $5, λ=1.955, downscale after 3 strikes, 7-day cool-off, BMI floor 18.5, 2% weekly velocity cap, recovery max 30 days, max 3 no-contact targets, 3 missed attestations = auto-fail.
- **Dependencies**: None (pure algorithm)

#### F-CORE-06: Billing & Pricing Constants

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P1
- **Source**: `research--market-analysis.md` §Revenue Structuring
- **Existing Code**: `src/api/services/billing.ts`, `src/api/services/billing.spec.ts`
- **Spec**: Centralized pricing constants. IAP single-contract ticket at $4.99.
- **Dependencies**: F-CORE-04

#### F-CORE-07: Contract Lifecycle State Machine

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0
- **Source**: `research--smart-contracts-behavioral-wagers.md` §State Machine, `api/spec.md`
- **Existing Code**: `src/api/src/modules/contracts/contracts.service.ts`, `src/api/src/modules/contracts/contracts.scheduler.ts`, `src/api/database/schema.sql` (contracts table: PENDING_STAKE → ACTIVE → COMPLETED/FAILED)
- **Spec**: Full CRUD: create contract, submit proof, use grace day, scheduler for deadline enforcement. Attestation scheduler for daily check-ins.
- **Dependencies**: F-CORE-01, F-CORE-04

#### F-CORE-08: Seasonal Goal Cycles

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P2
- **Source**: `research--psychology-behavior.md` §5.2
- **Existing Code**: None
- **Spec**: 4-8 week "seasons" instead of open-ended contracts. At end of each season, roll forward endowed progress (better starting multipliers, badges, lower required stake). 6-8 weeks optimal per stickK data.
- **Dependencies**: F-CORE-07

#### F-CORE-09: Finish Line Spike (Double Stake)

- **Status**: NOT_STARTED
- **Phase**: Gamma
- **Priority**: P2
- **Source**: `research--behavioral-engineering-masters.md` §1. The Finish Line Spike
- **Existing Code**: None
- **Spec**: System automatically doubles the penalty in the final 10% of a contract period. Counteracts Pressfield's "Odysseus's Bag of Wind" sabotage phase where resistance peaks near completion.
- **Dependencies**: F-CORE-07

#### F-CORE-10: Weekend Multiplier (Dynamic Staking)

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P1 (for Recovery contracts)
- **Source**: `research--breakup-psychology-loss-aversion.md` §1
- **Existing Code**: None
- **Spec**: Friday 5PM to Sunday 9AM: penalties automatically double. Addresses heightened emotional vulnerability, DMN activation, and social isolation on weekends. Critical for No-Contact recovery contracts.
- **Dependencies**: F-CORE-07, F-CORE-05

#### F-CORE-11: 24-Hour Time-Lock (Friction Engineering)

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P1 (for Recovery contracts)
- **Source**: `research--breakup-psychology-loss-aversion.md` §2
- **Existing Code**: None
- **Spec**: If user decides to break No Contact, mandatory 24-hour delay before communication block is released. ~95% cancellation rate after cooling period. Forces prefrontal cortex re-engagement.
- **Dependencies**: F-CORE-07

#### F-CORE-12: Shared-Pot / PvP Challenges

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `legal--compliance-guardrails.md` §Variant 2, `legal--performance-wagering.md`, `research--gamified-behavior-change-app-design.md` §C
- **Existing Code**: None
- **Spec**: Time-boxed public/private challenges. Fixed entry fee ($20-50). Winners split pool pro rata minus platform fee (15-25%). "Challenge Flag" system where opponents can audit each other.
- **Dependencies**: F-CORE-07, F-FURY-01, F-LEGAL-03
- **Legal/Compliance**: Highest regulatory risk. Must geofence "Any Chance" states.

#### F-CORE-13: Charity-on-Failure / Anti-Charity Model

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P2
- **Source**: `research--smart-contracts-behavioral-wagers.md` §Capital Destruction, `research--behavioral-economics.md` §Anti-Charity
- **Existing Code**: None
- **Spec**: Three forfeiture destinations: (1) charity user supports, (2) anti-charity (organization user opposes — maximizes loss aversion by compounding financial + ideological distress), (3) platform fee. User selects at contract creation.
- **Dependencies**: F-CORE-04
- **Legal/Compliance**: Anti-charity maximally de-risks gambling classification. Framed as "conditional charitable pledge."

#### F-CORE-14: Maintenance Pools (Post-Challenge Retention)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--differentiation-competitor.md` §Maintenance pools
- **Existing Code**: None
- **Spec**: After successful challenge, users enter maintenance pool staking smaller monthly amount lost only if they cross an agreed regain threshold. Furies earn bounties for flagging unreported regains. Multi-year commitment architecture.
- **Dependencies**: F-CORE-07, F-FURY-01

#### F-CORE-15: Dynamic Gamification Decay Algorithm

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--behavior-change-app-design.md` §Dynamic Gamification Algorithms
- **Existing Code**: None
- **Spec**: Variable point system where rewards decay as habit strength increases. Points = P_max * decay_function(r, H_target). Transitions user from extrinsic to intrinsic motivation as P(H) approaches 1.0.
- **Dependencies**: F-CORE-05

---

### Domain 2: VERIFY — Verification & Anti-Cheat

#### F-VERIFY-01: pHash Duplicate Detection

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `architecture--truth-blockchain.md` §Anti-Fraud, `planning--roadmap.md` §Gamma (checked)
- **Existing Code**: `src/api/services/intelligence/phash.service.ts`, `src/api/services/anomaly/anomaly.service.ts`
- **Spec**: 64-bit perceptual hash via spatial + temporal hashing. Before proof enters review queue, Hamming distance compared against all previous uploads. Below threshold = auto-reject as duplicate.
- **Dependencies**: FFmpeg, R2 storage

#### F-VERIFY-02: HealthKit Native Bridge (iOS)

- **Status**: NOT_STARTED
- **Phase**: Beta (deferred)
- **Priority**: P1
- **Source**: `architecture--feasibility-stack.md` §S2, `architecture--truth-blockchain.md` §Wearable Ecosystems, `research--app-verification-tech-privacy-law.md`
- **Existing Code**: None (explicitly deferred; mobile has placeholder stubs)
- **Spec**: Native Swift read-only integration. Filter manual entries with `HKMetadataKeyWasUserEntered == NO`. Whitelist trusted bundle IDs (Apple Watch, known wearables). Reject `com.apple.Health` source. Must be 100% native Swift per Apple Guideline 4.7/5.3.4.
- **Dependencies**: Xcode, native Swift development
- **Legal/Compliance**: Apple requires native code for HealthKit + real-money gaming.

#### F-VERIFY-03: Google Health Connect Bridge (Android)

- **Status**: NOT_STARTED
- **Phase**: Beta (deferred)
- **Priority**: P2
- **Source**: `architecture--feasibility-stack.md` §S2, `architecture--truth-blockchain.md` §Wearable Ecosystems
- **Existing Code**: None
- **Spec**: Native Kotlin. Use `recordingMethod` metadata to reject manual data. Filter by data source type and stream identifiers. Sensors API for real-time HR/step/GPS in high-stakes challenges.
- **Dependencies**: Android Studio, native Kotlin development

#### F-VERIFY-04: Fitbit/WHOOP API Integration

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `architecture--feasibility-stack.md` §S2, `research--habit-application.md` §Pillar 5
- **Existing Code**: None
- **Spec**: Fitbit: OAuth2 read-only, intraday per-minute data, discount manually logged workouts. WHOOP: OAuth read-only, summarized cycles (cannot be manually edited — higher-trust source).
- **Dependencies**: Fitbit developer approval, WHOOP developer platform access

#### F-VERIFY-05: Server-Side Metadata Filtering (Oracle Solution)

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--evaluation-to-growth--strategic-review.md` §1.1
- **Existing Code**: None
- **Spec**: Server-side filtering: `HKMetadataKeyWasUserEntered == NO`. Only accepts hardware-generated health data. Pragmatic Oracle Problem solution without custom hardware.
- **Dependencies**: F-VERIFY-02 or F-VERIFY-03

#### F-VERIFY-06: Daily Attestation Flow (No-Contact)

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P0 (beta-blocker — primary Phase 1 journey)
- **Source**: `planning--phase1-private-beta-scope.md`, `planning--roadmap.md` §Beta
- **Existing Code**: `src/api/src/modules/contracts/contracts.service.ts` (getAttestationStatus, submitAttestation), `src/api/src/modules/contracts/contracts.controller.ts`, `src/web/app/contracts/[id]/attest/page.tsx`, `src/mobile/screens/AttestationScreen.tsx`, `src/api/database/schema.sql` (attestations table)
- **Spec**: Daily attestation check-in for No-Contact recovery contracts. User attests compliance; accountability partner can cosign. 3 missed attestations = auto-fail. Attestation scheduler generates daily pending rows.
- **Dependencies**: F-CORE-07, F-SOCIAL-01

#### F-VERIFY-07: Video Proof Pipeline

- **Status**: PARTIAL
- **Phase**: Gamma
- **Priority**: P1
- **Source**: `architecture--feasibility-stack.md` §S4.2, `research--habit-application.md` §Pillar 5
- **Existing Code**: `src/api/services/storage/r2.service.ts` (upload/download), `src/api/src/modules/proofs/` (submission endpoints)
- **Spec**: Client requests signed upload URL → uploads to R2 → backend receives webhook → extracts metadata → ties to contract + time window → FFmpeg compress/transcode/strip metadata → serve via signed URL. "Weigh-in word" (random, time-sensitive) must appear in frame to prevent old photo reuse.
- **Dependencies**: F-INFRA-03 (R2), FFmpeg

#### F-VERIFY-08: Hardware-Backed Cryptographic Attestation

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--app-verification-tech-privacy-law.md` §Hardware-Backed Attestation
- **Existing Code**: None
- **Spec**: Android: Hardware Key Attestation + Play Integrity API (StrongBox TEE, X.509 chain). iOS: DeviceCheck + App Attest (Secure Enclave key pair). Verifies unmodified OS, locked bootloader, non-emulator.
- **Dependencies**: Native mobile development

#### F-VERIFY-09: C2PA Content Provenance

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--app-verification-tech-privacy-law.md` §C2PA
- **Existing Code**: None
- **Spec**: Tamper-evident chain of custody for media. SHA-256 hash binding of video data + manifest (origin, location, telemetry). RFC 3161 Time-Stamp Authority for cryptographic time proof.
- **Dependencies**: C2PA SDK, TSA server integration

#### F-VERIFY-10: Active Cryptographic Illumination (Anti-Spoof)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--app-verification-tech-privacy-law.md` §Advanced Detection
- **Existing Code**: None
- **Spec**: Device screen flashes randomized color patterns during capture. Front camera verifies reflections on user's face match the emitted sequence. Pre-recorded video fails. Also detects Moire patterns, temporal inconsistencies.
- **Dependencies**: F-MOBILE-01, native camera access

#### F-VERIFY-11: Continuous Mobile App Attestation

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--commitment-device-market-analysis.md` §5.1
- **Existing Code**: None
- **Spec**: Runtime integrity checks (Approov/Guardsquare) to detect emulators, virtual environments, rooted/jailbroken devices, hooking frameworks (Frida, Magisk, Xposed).
- **Dependencies**: Third-party SDK (Approov or Guardsquare)

#### F-VERIFY-12: Digital Exhaust Inference (Bayesian Framework)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--digital-exhaust-no-contact-contracts.md` §Mathematical Framework
- **Existing Code**: None
- **Spec**: Calculates P(Contact | Evidence) using Bayesian inference from telemetric streams: GPS std dev, screen wake frequency, accelerometer entropy, Wi-Fi BSSID density. Kullback-Leibler divergence between real-time and baseline distributions. Five sub-features: Geofenced Proximity (1mi radius), Nocturnal Rumination Lock (1-5AM), Stalking Velocity Monitor (>20 cycles/3 apps/10min), Wi-Fi Topography, Kinematic Agitation Threshold.
- **Dependencies**: Native mobile sensors, background processing permissions

#### F-VERIFY-13: Randomized Verification Lottery

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--gamified-behavior-change-app-design.md` §B, `research--app-verification-tech-privacy-law.md`
- **Existing Code**: None
- **Spec**: Daily randomized audit at 12:00 PM user local time. Selected users must provide proof by 11:59 PM. 3-Strike Rule: three missed/failed audits = expulsion. Note: screen recording variant deemed legally untenable per app-verification-tech-privacy-law research doc; alternative proof methods required.
- **Dependencies**: F-MOBILE-03 (push notifications)
- **Legal/Compliance**: Screen recording approach rejected due to wiretap/GDPR issues. Must use alternative proof methods.

#### F-VERIFY-14: ZK-Privacy Layer for Digital Exhaust

- **Status**: NOT_STARTED
- **Phase**: Phase3+
- **Priority**: P3
- **Source**: `research--evaluation-to-growth--strategic-review.md` §1.1
- **Spec**: Implement Zero-Knowledge Proofs (ZKPs) for validating SMS/Call logs without transmitting sensitive metadata to the server. Verification happens locally on-device, and only the binary "Breach Detected" proof is transmitted.
- **Dependencies**: F-VERIFY-12, ZK-proving engine.

---

### Domain 3: FURY — Peer Audit Network

#### F-FURY-01: Fury Router (BullMQ Distribution Engine)

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `architecture--feasibility-stack.md` §S4.3, `planning--roadmap.md` §Gamma (checked)
- **Existing Code**: `src/api/services/fury-router/fury-router.service.ts`, `src/api/services/fury-router/fury-router.worker.ts`, `src/api/src/modules/fury/`
- **Spec**: Anonymized BullMQ distribution to 3 random Furies. Double-anonymized: author hidden from reviewers, reviewers hidden from each other. Consensus: 3/3 pass → user passes; 3/3 fail → stake liquidated; split → Judge escalation. All identifying metadata stripped via FFmpeg.
- **Dependencies**: Redis, BullMQ, F-INFRA-03

#### F-FURY-02: Fury Accuracy Score & Demotion

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `research--evaluation-to-growth--strategic-review.md` §1.1
- **Existing Code**: `src/shared/libs/integrity.ts`, `src/api/src/modules/fury/fury.worker.demotion.spec.ts`, `src/api/src/modules/fury/fury.stats.spec.ts`
- **Spec**: Accuracy = (successful - false_accusations*3) / total. Demotion below 0.8 after 10-audit burn-in. Auditor stake: $2.00 per audit. False accusation: stake forfeited, integrity score drops.
- **Dependencies**: F-CORE-03

#### F-FURY-03: Cross-Lobby Auditing (Anti-Collusion)

- **Status**: NOT_STARTED
- **Phase**: Gamma
- **Priority**: P1
- **Source**: `research--evaluation-to-growth--strategic-review.md` §3.2
- **Existing Code**: None
- **Spec**: Furies can never audit users in their same geographic region or social guild. Prevents systemic collusion via external coordination (e.g., Discord groups). Routing algorithm must exclude social graph connections and geographic proximity.
- **Dependencies**: F-FURY-01, geolocation data

#### F-FURY-04: Audit Masks (Identity Redaction)

- **Status**: NOT_STARTED
- **Phase**: Gamma
- **Priority**: P1
- **Source**: `research--evaluation-to-growth--behavioral-physics.md` §Risk Mitigations
- **Existing Code**: None
- **Spec**: Automated face-blurring and avatar-masking during peer review. User's avatar and name replaced with generic "Target_UUID." Prevents dominance over-amplification and biometric privacy risks.
- **Dependencies**: F-INFRA-03, edge processing (Cloudflare Workers or FFmpeg)

#### F-FURY-05: Honeypot Injection System

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `planning--roadmap.md` §Gamma (checked), `research--evaluation-to-growth--strategic-review.md` §Sprint 3
- **Existing Code**: `src/api/services/intelligence/honeypot.service.ts`, admin endpoint `POST /admin/honeypot`
- **Spec**: Cron-injected "known-fail" and "known-pass" proofs into Fury queue. Furies who consistently misjudge honeypots get Trust Score reduction, voting weight zeroed, potential ban.
- **Dependencies**: F-FURY-01

#### F-FURY-06: Consensus Engine

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `architecture--feasibility-stack.md` §S4.3
- **Existing Code**: `src/api/src/modules/fury/consensus.engine.ts`, `src/api/src/modules/fury/consensus.engine.spec.ts`
- **Spec**: Aggregates verdicts from 3 Furies. 3/3 pass → user passes. 3/3 fail → liquidation (house 15%, Furies 85%). Split → Judge escalation.
- **Dependencies**: F-FURY-01

#### F-FURY-07: Master Fury Career Path / Economy

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §4.1 Bloom
- **Existing Code**: None
- **Spec**: Career progression from Novice → Journeyman → Master Fury. Master Furies' votes count more in split decisions. Could earn living wage via auditing ("Work-from-Home" micro-economy). Bounty percentages modeled on DOJ whistleblower rewards (15-30%).
- **Dependencies**: F-FURY-02, F-CORE-03

#### F-FURY-08: Reviewer Quality Weights

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §1.1
- **Existing Code**: None
- **Spec**: Weighted voting where high-accuracy Furies' verdicts count more. In split decisions, Master Furies break ties. Prevents low-quality reviewers from swaying outcomes.
- **Dependencies**: F-FURY-02, F-FURY-07

#### F-FURY-09: Collusion Slashing & Honey-Traps

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P1
- **Source**: `research--evaluation-to-growth--strategic-review.md` §3.2
- **Spec**: Advanced honey-trap logic where "Bad Actors" are identified via intentional failure-injection. Reviewers identified as colluding or "rubber-stamping" face immediate stake slashing and permanent exile.
- **Dependencies**: F-FURY-05.

---

### Domain 4: AEGIS — Safety & Compliance

#### F-AEGIS-01: Aegis Protocol (BMI Floor + Velocity Cap)

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P0
- **Source**: `legal--aegis-protocol.md` §2, `legal--compliance-guardrails.md`, `planning--roadmap.md` §Beta (checked)
- **Existing Code**: `src/api/services/health/aegis.service.ts`, `src/api/services/health/aegis.service.spec.ts`
- **Spec**: BMI floor 18.5 (prevents underweight goals). Weight loss velocity cap 2%/week (prevents starvation). Prevents incentivizing eating disorders.
- **Dependencies**: None

#### F-AEGIS-02: Geofencing by Jurisdiction Tier

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P0
- **Source**: `legal--compliance-guardrails.md` §50-State, `legal--gatekeeper-compliance.md` §2, `planning--roadmap.md` §Beta (checked)
- **Existing Code**: `src/api/services/geofencing.ts`, `src/api/src/common/guards/geofence.guard.ts`, `src/api/src/modules/compliance/compliance-policy.service.ts`
- **Spec**: Three tiers: TIER_1 (full access, predominance-test states), TIER_2 (refund-only, material-element states), TIER_3 (hard-blocked, any-chance states: AZ, AR, DE, etc.). IP-based + address verification. TIER_2 refund-only restrictions implemented. Missing geolocation defaults fail-open (configurable).
- **Dependencies**: IP geolocation service
- **Legal/Compliance**: Mandatory for multi-state operation.

#### F-AEGIS-03: Age Gate (18+ Runtime Enforcement)

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P0 (beta-blocker)
- **Source**: `legal--aegis-protocol.md`, `legal--compliance-guardrails.md` §4.D, `planning--implementation-status.md`
- **Existing Code**: `src/api/src/modules/auth/auth.service.ts` (register validation requires `ageConfirmation: true`), `src/api/database/migrations/008_age_gate_terms_acceptance.sql`, `src/web/app/register/page.tsx`, `src/mobile/screens/RegisterScreen.tsx`
- **Spec**: Enforce 18+ age verification at registration. Collect date of birth, validate against threshold. Phase 1 scope explicitly defers but this is a legal requirement before any real-money operation.
- **Dependencies**: None
- **Legal/Compliance**: Legal requirement for financial stakes in all jurisdictions.

#### F-AEGIS-04: Recovery Protocol Guardrails

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--breakup-psychology-loss-aversion.md`, `planning--phase1-private-beta-scope.md`
- **Existing Code**: `src/api/services/health/recovery-protocol.service.ts`, behavioral-logic constants (max 30 days, max 3 targets)
- **Spec**: No-contact specific guardrails: max 30 days duration, max 3 no-contact targets, 3 missed attestations = auto-fail. Day 3 & Day 21 lockdown (prevent modification during danger zones). Five rationalization countermeasures (closure trap, apology guise, logistical loophole, special occasions, "I'm healed" illusion).
- **Dependencies**: F-CORE-07, F-CORE-05

#### F-AEGIS-05: KYC / Identity Verification

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `legal--aegis-protocol.md`, `legal--compliance-guardrails.md` §4.D, `planning--implementation-status.md` (Planned)
- **Existing Code**: `src/api/src/modules/compliance/identity-verification.service.ts`, `src/api/src/modules/compliance/identity-provider.service.ts` (spec files exist, implementation status unclear)
- **Spec**: Collect legal name, DOB, address. Full ID verification for higher stakes. Enforces age limits. Reduces fraud/money-laundering risk.
- **Dependencies**: Third-party KYC provider (Stripe Identity, Jumio, etc.)
- **Legal/Compliance**: Required for AML compliance. Even without MSB status, reduces regulatory risk.

#### F-AEGIS-06: Self-Exclusion & Responsible Use

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P1
- **Source**: `legal--compliance-guardrails.md` §4.E
- **Existing Code**: 7-day cool-off exists in behavioral-logic constants
- **Spec**: Allow users to self-exclude for set periods. Personalized weekly/monthly caps. Links to NCPG, eating-disorder, and mental-health resources. Prominent disclosures: "You can lose money; not an investment product."
- **Dependencies**: None
- **Legal/Compliance**: Required for responsible-use optics even if avoiding gambling label.

#### F-AEGIS-07: Medical Exemption Service ("Compassionate Audit")

- **Status**: NOT_STARTED
- **Phase**: Delta
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §2.1
- **Existing Code**: None
- **Spec**: Handles verified medical emergencies via Judge panel. Prevents "Ostrich" abandonment where users with genuine emergencies leave rather than lose their stake. Medical documentation review by trusted admin.
- **Dependencies**: F-CORE-07, Judge system (F-DESKTOP-01)

#### F-AEGIS-08: RAIN Mindfulness Notifications

- **Status**: NOT_STARTED
- **Phase**: Delta
- **Priority**: P2
- **Source**: `research--behavioral-engineering-masters.md` §3. Judson Brewer
- **Existing Code**: None
- **Spec**: When Anomaly Service detects lapse or "Vice Location" trigger, initiate RAIN protocol push notification: Recognize, Allow, Investigate, Note. Breaks addiction reward-based learning loop. Inspired by Brewer's "The Craving Mind."
- **Dependencies**: F-MOBILE-03, anomaly detection

#### F-AEGIS-09: Ostrich Effect Detection

- **Status**: NOT_STARTED
- **Phase**: Delta
- **Priority**: P2
- **Source**: `research--behavioral-economics.md` §Pathology of Progress Anxiety
- **Existing Code**: None
- **Spec**: Monitor for "motivated avoidance": reduced app opens, unread notifications, unlogged days. When detected, trigger de-escalation (not punitive feedback). Prevent catastrophic app deletion by intervening before ego depletion paradox.
- **Dependencies**: Analytics/telemetry pipeline

#### F-AEGIS-10: AML / Transaction Monitoring

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `legal--compliance-guardrails.md` §4.D
- **Existing Code**: None
- **Spec**: Limits on deposit/withdrawal frequency and amounts. Monitor for unusual patterns (rapid in-and-out transfers with no real participation). Written policy for suspicious activity handling.
- **Dependencies**: F-CORE-04
- **Legal/Compliance**: Recommended even without MSB classification.

#### F-AEGIS-11: Sobriety/Addiction Track Expansion

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §4.1
- **Spec**: Expand the Aegis Protocol to support sobriety tracks (alcohol, nicotine, etc.) with specialized verification (IoT breathalyzers, geofencing for vice locations).
- **Dependencies**: F-AEGIS-08.

---

### Domain 5: UX — User Experience & Engagement

#### F-UX-01: Identity-Based Onboarding ("Sign an Oath")

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--behavioral-engineering-masters.md` §2. James Clear
- **Existing Code**: None
- **Spec**: User doesn't "Join a challenge" — they "Sign an Oath" to become a type of person ("The Morning Runner"). Identity-based habits are more durable than outcome-based. Onboarding flows identity selection → oath category → specific commitment.
- **Dependencies**: F-CORE-05

#### F-UX-02: Endowed Progress ($5 Onboarding Bonus)

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P0
- **Source**: `research--behavioral-economics.md` §Endowed Progress, `planning--roadmap.md` §Beta (checked)
- **Existing Code**: Constant defined in `behavioral-logic.ts` ($5 onboarding bonus), grace day endpoint exists
- **Spec**: Pre-credit 20% progress on sign-up. Lock a portion of stake as "protected" upon completing initial tasks. Manufacture psychological momentum to combat Day 3 churn.
- **Dependencies**: F-CORE-04, F-CORE-07

#### F-UX-03: Dynamic Downscale Intervention

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--behavioral-economics.md` §Mitigating Progress Anxiety, `research--behavioral-engineering-masters.md` §4. BJ Fogg
- **Existing Code**: Constants in `behavioral-logic.ts` (3 strikes → downscale, 7-day cool-off)
- **Spec**: After 3 consecutive misses, system auto-suggests downscaling (e.g., 5x/week → 3x/week). Protected vault stays locked. Active vault redistributed. Framed as "recalibration" not "giving up." Maps to Fogg's B = MAP formula.
- **Dependencies**: F-CORE-07

#### F-UX-04: Habit Stacking Syntax ("Styx Stack")

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P2
- **Source**: `research--behavioral-engineering-masters.md` §4. BJ Fogg
- **Existing Code**: None
- **Spec**: Oath Creation UI enforces syntax: "After I [Anchor Habit], I will [Stygian Oath]." Anchors new habits to existing behaviors for maximum formation success.
- **Dependencies**: Contract creation UI

#### F-UX-05: Daily Dashboard with Goal-Gradient Visualization

- **Status**: STUB
- **Phase**: Delta
- **Priority**: P1
- **Source**: `research--psychology-behavior.md` §Flow 2
- **Existing Code**: `src/web/app/dashboard/` exists but basic implementation
- **Spec**: Large progress circle (weekly completion). Vault status (protected vs active split). One-tap logging. Multiple nested progress bars: daily, weekly streak, seasonal. Effort increases as users approach goal (goal-gradient effect).
- **Dependencies**: F-CORE-07

#### F-UX-06: Bounded Stake Selection UI

- **Status**: STUB
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--psychology-behavior.md` §Flow 1
- **Existing Code**: `src/web/app/contracts/new/` exists, `src/mobile/screens/CreateContractScreen.tsx` exists
- **Spec**: Slider with three suggested amounts: $20 (Light nudge), $50 (Meaningful — default), $100 (Serious). Custom allowed. Cap $200 max, $10 min. Transparent loss math shown upfront: vault amount, cost per missed day, weekly loss cap, grace days.
- **Dependencies**: F-CORE-04

#### F-UX-07: Weekly Vault Lock-In Milestone

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P2
- **Source**: `research--psychology-behavior.md` §Flow 3
- **Existing Code**: None
- **Spec**: When users hit weekly targets, lock portion of vault as permanently safe. Visual padlock animation. Each week locks more vault, increasing "what they have to lose." Badge layer for non-monetary reward.
- **Dependencies**: F-CORE-07, F-UX-02

#### F-UX-08: Geofence Cue Triggers

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--behavioral-engineering-masters.md` §2. Environment Design
- **Existing Code**: None
- **Spec**: When user enters their "Vault Location" (e.g., gym), app triggers "Vault Unlocking" animation making the habit cue impossible to ignore.
- **Dependencies**: F-MOBILE-01, native geofencing

#### F-UX-09: Behavior Change Library

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--gamified-behavior-change-app-design.md` §A
- **Existing Code**: None
- **Spec**: Categorized directory of habits. Users select behavior track on onboarding (No Contact, Sobriety, Binge Eating, Social Media Fasting, etc.). Each track has customized milestones and verification methods.
- **Dependencies**: F-CORE-05

#### F-UX-10: Linguistic Cloaker (Runtime Vocabulary Swap)

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0
- **Source**: `legal--gatekeeper-compliance.md` §2, `planning--roadmap.md` §Alpha (checked)
- **Existing Code**: `src/web/utils/linguistic-cloak.ts`, `src/web/utils/linguistic-cloak.test.ts`, `src/mobile/services/LinguisticMiddleware.ts`
- **Spec**: Runtime vocabulary swap: stake→vault, bet→commitment, fury→peer review, wager→pledge, pot→pool, odds→likelihood, casino→platform. Validation Gate 04 scans production build for forbidden strings.
- **Dependencies**: None
- **Legal/Compliance**: Required for Apple App Store "Health & Fitness" and Stripe compliance.

#### F-UX-11: Styx Mythology Branding

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P1
- **Source**: `research--commitment-device-market-analysis.md` §6.3
- **Existing Code**: Throughout codebase (Fury, Oath, Vault, Styx terminology)
- **Spec**: River/Goddess of Oaths from Greek mythology. "Modern digital Unbreakable Oath" / "Ulysses Contract." Elite framing: "Ironman for your brain."
- **Dependencies**: None

#### F-UX-12: The Mirror Mirror (Sentiment Visualization)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §4.1
- **Spec**: Use sentiment analysis on "Digital Exhaust" artifacts (strictly local processing) to provide users with a "Mirror" of their emotional recovery progress over the 30-day contract.
- **Dependencies**: F-VERIFY-12.

---

### Domain 6: SOCIAL — Community & Social Features

#### F-SOCIAL-01: Accountability Partner Protocol

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--breakup-psychology-loss-aversion.md` §3, `research--psychology-behavior.md` §Flow 5
- **Existing Code**: `src/api/database/schema.sql` (accountability_partners table), attestation cosigning logic
- **Spec**: After Week 1, offer opt-in partner who sees progress (not vault amount). Partners can cosign attestations, veto No-Contact breaks, and receive weekly updates. 30% higher completion with accountability partner (stickK data). For high-stakes contracts ($500+), partners become financially incentivized adversaries (30% bounty).
- **Dependencies**: F-CORE-07, F-VERIFY-06

#### F-SOCIAL-02: Whistleblower Bounty (Anonymous Links)

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0
- **Source**: `planning--roadmap.md` §Alpha (checked)
- **Existing Code**: `src/web/app/whistleblower/` route exists
- **Spec**: Anonymous bounty link generation for No-Contact contracts. Third parties can submit evidence of violations via anonymous link. Validated evidence earns bounty from violator's forfeited stake.
- **Dependencies**: F-CORE-04, F-CORE-07

#### F-SOCIAL-03: Tavern Board / Leaderboard

- **Status**: IMPLEMENTED
- **Phase**: Delta
- **Priority**: P1
- **Source**: `planning--roadmap.md` §Delta (checked)
- **Existing Code**: `src/web/app/tavern/`, API endpoint `GET /users/leaderboard`, `src/web/store/useFuryStore.ts`
- **Spec**: Gamified leaderboard with tier badges. Redis Sorted Sets for O(log N) insertions. Anonymized integrity leaderboard. Real-time via SSE.
- **Dependencies**: Redis

#### F-SOCIAL-04: Public Activity Feed

- **Status**: IMPLEMENTED
- **Phase**: Delta
- **Priority**: P1
- **Source**: `planning--roadmap.md` §Delta (checked)
- **Existing Code**: `src/api/src/modules/feed/feed.controller.ts`, API endpoint `GET /feed`
- **Spec**: Anonymized real-time event stream (REST + SSE). Shows platform activity without exposing user identities. `?limit=50` (max 100).
- **Dependencies**: F-CORE-07

#### F-SOCIAL-05: PvP Lobbies & Group Challenges

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §Sprint 4, `research--market-analysis.md`
- **Existing Code**: None
- **Spec**: Social arena with player-vs-player lobbies. Group challenges with shared pots. Cross-party competitive leagues with audited scoring ("esport-like, spectator-friendly layer").
- **Dependencies**: F-CORE-12, F-FURY-01
- **Legal/Compliance**: Highest regulatory risk tier.

#### F-SOCIAL-06: Community Governance (User Voting)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--differentiation-competitor.md` §Gap 3
- **Existing Code**: None
- **Spec**: High-reputation users vote on rule changes (what counts as proof, penalty severity). Creates civic layer. "Honest users + furies vs. cheaters."
- **Dependencies**: F-CORE-03, F-FURY-07

---

### Domain 7: MOBILE — Native Mobile Features

#### F-MOBILE-01: Native Camera Module (Swift/Kotlin)

- **Status**: STUB
- **Phase**: Gamma
- **Priority**: P0 (beta-blocker)
- **Source**: `architecture--feasibility-stack.md` §S4.2, CLAUDE.md §Remaining Limitations
- **Existing Code**: `src/mobile/screens/CameraScreen.tsx` (placeholder), `src/mobile/screens/ProofCaptureScreen.tsx`
- **Spec**: Native Swift (iOS) / Kotlin (Android) camera that disables gallery uploads. Forces real-time proof capture. In-app camera with "weigh-in word" overlay. Upload buffer directly to pre-signed R2 links. Current placeholder allows text proof submission as fallback.
- **Dependencies**: Xcode (iOS), Android Studio (Android)

#### F-MOBILE-02: Wearable Data Aggregation

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `architecture--feasibility-stack.md` §S2
- **Existing Code**: None
- **Spec**: Aggregate data from HealthKit, Google Fit, Fitbit, WHOOP into normalized behavioral telemetry. Backend Health Oracle Service pulls data, applies filtering, computes "proof scores."
- **Dependencies**: F-VERIFY-02, F-VERIFY-03, F-VERIFY-04

#### F-MOBILE-03: Push Notifications

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--behavioral-engineering-masters.md` §RAIN, general UX
- **Existing Code**: `src/mobile/services/NotificationService.ts` (expo-notifications wiring: local scheduling, permission request, Android channel, graceful degradation), `src/mobile/services/ApiClient.ts` (registerPushToken)
- **Spec**: Push notifications for: grace day reminders, Fury review assignments, verdict reports, endowed progress alerts, RAIN intercessions, attestation reminders.
- **Dependencies**: APNs (iOS), FCM (Android)
- **What's done**: Local notifications (grace day, attestation, deadline), permission flow, Expo push token retrieval, device token registration API. **What remains**: Remote push via APNs/FCM (requires Apple/Google credentials), server-side push dispatch.

#### F-MOBILE-04: Biometric Lock (Voice/Face)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--evaluation-to-growth--strategic-review.md` §3.1
- **Existing Code**: None
- **Spec**: Camera verifies person matches account owner. Prevents "Device Sharing" fraud (wearing another user's wearable).
- **Dependencies**: F-MOBILE-01, biometric SDK

#### F-MOBILE-05: Offline Mode (TTL Cache + Mutation Queue)

- **Status**: IMPLEMENTED
- **Phase**: Omega
- **Priority**: P2
- **Source**: `planning--roadmap--ai-workstreams.md` §WS2 Omega
- **Existing Code**: `src/mobile/services/OfflineCache.ts`, `src/mobile/services/OfflineCache.spec.ts`
- **Spec**: TTL-based response caching. Mutation queue replays when connectivity returns. "Dark Device Default": if offline >24 hours, defaults to failure state.
- **Dependencies**: None

#### F-MOBILE-06: Enterprise SSO (Deep Links)

- **Status**: IMPLEMENTED
- **Phase**: Omega
- **Priority**: P2
- **Source**: `api/spec.md`, `planning--roadmap--ai-workstreams.md`
- **Existing Code**: `src/mobile/services/EnterpriseSSO.ts`, `src/mobile/services/EnterpriseSSO.spec.ts`
- **Spec**: Enterprise SSO token exchange via deep links. Corporate employees transition seamlessly from internal portals.
- **Dependencies**: F-B2B-01

---

### Domain 8: WEB — Web Platform

#### F-WEB-01: HttpOnly Cookie Auth Migration

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P0 (beta-blocker — security requirement)
- **Source**: `planning--implementation-status.md`
- **Existing Code**: `src/web/contexts/AuthContext.tsx`, `src/web/services/api-client.ts`, `src/api/src/modules/auth/auth.service.ts`
- **Spec**: Migrate from client-side JWT storage to HttpOnly cookie-based authentication. Current implementation exposes JWT to XSS. Server must set/clear cookies; client reads auth state from API response.
- **Dependencies**: API auth module changes

#### F-WEB-02: Fury Review Workbench

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `planning--roadmap--ai-workstreams.md` §WS3 Gamma
- **Existing Code**: `src/web/app/fury/`, `src/web/store/useFuryStore.ts`
- **Spec**: Anonymous peer-review workbench. HLS video playback. Pass/Fail/Flag with confidence scores. Side-by-side: baseline (Day 1) vs final proof (Day 30). Tools: zoom, contrast filter, clothing comparison.
- **Dependencies**: F-FURY-01, F-INFRA-03

#### F-WEB-03: HR Dashboard

- **Status**: STUB
- **Phase**: Omega
- **Priority**: P2
- **Source**: `planning--roadmap--ai-workstreams.md` §WS3 Omega, `research--b2b-expansion-heartbreak-niche.md`
- **Existing Code**: `src/web/app/hr/` route exists
- **Spec**: Read-only UI for corporate managers showing aggregated, anonymized group habit metrics. No individual identification. ERISA compliance.
- **Dependencies**: F-B2B-01, F-B2B-03

#### F-WEB-04: Real-Time Leaderboard (WebSocket/SSE)

- **Status**: PARTIAL
- **Phase**: Delta
- **Priority**: P1
- **Source**: `planning--roadmap--ai-workstreams.md` §WS3 Delta
- **Existing Code**: `src/api/services/realtime/`, SSE-based notification stream exists
- **Spec**: Real-time updates via SSE/WebSocket. Redis Sorted Sets power the leaderboard. Sub-millisecond latency for rank queries.
- **Dependencies**: Redis, F-SOCIAL-03

#### F-WEB-05: Plaid Link Integration

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `architecture--feasibility-stack.md` §S3, `research--habit-application.md` §Pillar 5
- **Existing Code**: None
- **Spec**: Read-only Plaid integration for "save $X" financial goals. Plaid Link for user auth. `/accounts/balance/get` and `/transactions/sync`. Verify net savings increase. Never enable Plaid Transfer APIs. Behind `BankDataProvider` interface for future swap.
- **Dependencies**: Plaid developer account
- **Legal/Compliance**: Read-only scopes only. Avoids Money Transmitter classification.

---

### Domain 9: DESKTOP — The Judge

#### F-DESKTOP-01: Judge Dispute Resolution Panel

- **Status**: IMPLEMENTED
- **Phase**: Delta
- **Priority**: P0
- **Source**: `planning--roadmap.md` §Delta (checked), `planning--roadmap--ai-workstreams.md` §WS4 Delta
- **Existing Code**: `src/desktop/src/components/MacroReview.tsx`, admin endpoints (`POST /admin/resolve/:contractId`)
- **Spec**: Secure Tauri 2.0 desktop app for dispute resolution. $5 appeal fee. Judge sees baseline photo, final proof, violation code, user plea text. Override Fury verdicts. Handle refunds.
- **Dependencies**: F-FURY-01

#### F-DESKTOP-02: Ledger Inspector

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P1 (internal tool)
- **Source**: `planning--roadmap--ai-workstreams.md` §WS4 Beta
- **Existing Code**: `src/desktop/src/components/LedgerInspector.tsx`
- **Spec**: Raw read-only view into PostgreSQL Truth Log. Instantly identify balance mismatches or transaction failures.
- **Dependencies**: F-CORE-01, F-CORE-02

#### F-DESKTOP-03: Exile Panel (Ban Management)

- **Status**: IMPLEMENTED
- **Phase**: Delta
- **Priority**: P1
- **Source**: `planning--roadmap--ai-workstreams.md` §WS4 Delta
- **Existing Code**: `src/desktop/src/components/ExilePanel.tsx`, `src/api/services/security/moderation.service.ts`
- **Spec**: Permanent system exile management. Admin can ban users with reason. Links to moderation service.
- **Dependencies**: F-CORE-03

#### F-DESKTOP-04: Hash Collider Tool

- **Status**: STUB
- **Phase**: Delta
- **Priority**: P2
- **Source**: `planning--roadmap--ai-workstreams.md` §WS4
- **Existing Code**: `src/desktop/src/components/HashCollider.tsx`
- **Spec**: Tool for comparing pHash values and investigating suspected duplicate proofs.
- **Dependencies**: F-VERIFY-01

#### F-DESKTOP-05: B2B Orchestration Panel

- **Status**: STUB
- **Phase**: Omega
- **Priority**: P2
- **Source**: `planning--roadmap--ai-workstreams.md` §WS4 Omega
- **Existing Code**: `src/desktop/src/components/B2BOrchestration.tsx`
- **Spec**: Controls for generating Enterprise API keys and managing billing parameters.
- **Dependencies**: F-B2B-01

#### F-DESKTOP-06: Medical Exemption Review UI

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §2.1
- **Existing Code**: None
- **Spec**: Judge panel for reviewing medical exemption requests. Display medical documentation, contract details, and recommended action.
- **Dependencies**: F-AEGIS-07, F-DESKTOP-01

---

### Domain 10: B2B — Enterprise & B2B

#### F-B2B-01: Enterprise CRM Connectors (Salesforce/HubSpot)

- **Status**: IMPLEMENTED
- **Phase**: Omega
- **Priority**: P1
- **Source**: `planning--roadmap.md` §Omega (checked), `planning--roadmap--ai-workstreams.md` §WS1 Omega
- **Existing Code**: `src/api/src/modules/b2b/connectors/salesforce.connector.ts`, `src/api/src/modules/b2b/connectors/hubspot.connector.ts`, `src/api/src/modules/b2b/crm.service.ts`
- **Spec**: Enterprise webhook endpoints returning anonymized behavioral velocity stats. Webhook registration, testing, and delivery. CRM interface pattern for swappable connectors.
- **Dependencies**: F-B2B-03

#### F-B2B-02: Consumption Billing

- **Status**: IMPLEMENTED
- **Phase**: Omega
- **Priority**: P1
- **Source**: `planning--roadmap.md` §Omega (checked)
- **Existing Code**: `src/api/src/modules/b2b/billing.service.ts`
- **Spec**: Revenue based on "AI Insights generated." Consumption-based billing for enterprise customers.
- **Dependencies**: F-B2B-01

#### F-B2B-03: Anonymization Layer (PII Stripping)

- **Status**: IMPLEMENTED
- **Phase**: Omega
- **Priority**: P0 (B2B requirement)
- **Source**: `planning--roadmap.md` §Omega (checked)
- **Existing Code**: `src/api/src/modules/b2b/anonymize.service.ts`, `src/api/services/security/anonymization.service.ts`
- **Spec**: One-way hashing of identifiers, date coarsening, anonymized HR exports. Employers see aggregated metrics without individual identification.
- **Dependencies**: None
- **Legal/Compliance**: Required for CCPA/CPRA, HIPAA, ERISA compliance.

#### F-B2B-04: Corporate Integrity Score

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--b2b-expansion-heartbreak-niche.md` §Enterprise Metrics
- **Existing Code**: None
- **Spec**: Aggregate behavioral integrity score at department/org level. HR measures wellness program ROI. $3.27 medical savings per $1 invested, $2.73 absenteeism reduction per $1.
- **Dependencies**: F-B2B-03, F-CORE-03

#### F-B2B-05: Therapist B2B2C Dashboard

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--b2b-expansion-heartbreak-niche.md` §B2B2C Enterprise Tool
- **Existing Code**: None
- **Spec**: Professional dashboard for therapists/coaches to monitor client behavioral contracts, adherence rates, intervention efficacy. EHR integration. Designed for Intensive Outpatient Programs (IOPs).
- **Dependencies**: F-B2B-01, F-B2B-03

#### F-B2B-06: Data Lake Extraction

- **Status**: IMPLEMENTED
- **Phase**: Omega
- **Priority**: P2
- **Source**: `architecture--alpha-to-omega-plan.md` §Infrastructure
- **Existing Code**: `src/api/src/modules/b2b/datalake.service.ts`
- **Spec**: Batch analytics snapshots: contract metrics, behavioral trends, cohort analysis. PostgreSQL logical replication for external analytics.
- **Dependencies**: PostgreSQL

#### F-B2B-07: Team-Based B2B Challenges

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `legal--compliance-guardrails.md` §Variant 3
- **Existing Code**: None
- **Spec**: Employers fund prize pools (employees don't stake own money). Departments compete on health/productivity metrics. Removes "consideration" element entirely — legally classified as performance bonus. SaaS pricing: PEPM or flat contract.
- **Dependencies**: F-B2B-01, F-B2B-03
- **Legal/Compliance**: Cleanest legal model — no employee stakes = no gambling consideration.

#### F-B2B-08: Behavioral Data Monetization Pipeline

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--b2b-expansion-heartbreak-niche.md` §Secondary Data Monetization
- **Existing Code**: None
- **Spec**: Anonymized behavioral data sold to life insurance companies, enterprise wellness programs, research institutions. "Behavioral surplus" from user activity.
- **Dependencies**: F-B2B-03, F-AEGIS-05
- **Legal/Compliance**: Requires robust anonymization and consent framework.

#### F-B2B-09: Insurance Cross-Pollination

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--evaluation-to-growth--strategic-review.md` §4.1 Bloom
- **Existing Code**: None
- **Spec**: Anonymized Styx verification data shared with life insurance companies to lower premiums for "Verified Achievers."
- **Dependencies**: F-B2B-03, insurance partnership

---

### Domain 11: MARKET — Prediction Markets & Advanced Economics

#### F-MARKET-01: Spectator Prediction Markets

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--gamified-behavior-change-app-design.md` §D, `research--prediction-markets-regulation-finance.md`
- **Existing Code**: None
- **Spec**: Non-participants wager on anonymous cohort outcomes. Spectators view pseudonymous groups. Betting lines: who breaks first, group success rate. Auto-payout via smart contracts. Total prediction market volume >$60B in 2025.
- **Dependencies**: F-CORE-12, F-LEGAL-03
- **Legal/Compliance**: CFTC jurisdiction for event contracts. Must implement insider trading prevention per H.R. 7004.

#### F-MARKET-02: Milestone Wagering Tiers

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--gamified-behavior-change-app-design.md` §C
- **Existing Code**: None
- **Spec**: Two tiers: Micro-Wagers (daily check-ins, low stakes) and Macro-Wagers (monthly/6-month milestones, high stakes). Locked in escrow, released on verified completion.
- **Dependencies**: F-CORE-04, F-CORE-07

#### F-MARKET-03: EVM Smart Contract Escrow

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--smart-contracts-behavioral-wagers.md` §Structural Paradigms
- **Existing Code**: None
- **Spec**: CommitmentFactory deploys individual BidCommitment/Escrow contracts per user. Time-locked state machine: AWAITING_DEPOSIT → LOCKED → VERIFICATION → RESOLVED. Pull-over-push withdrawal (CEI pattern). UUPS/Diamond proxy upgradeability. Gas optimization via storage packing.
- **Dependencies**: Solidity development, EVM deployment

#### F-MARKET-04: ZKP Milestone Verification

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--smart-contracts-behavioral-wagers.md` §ZKPs, `research--bounty-shame-protocol-safety-legality.md` §3.3.1
- **Existing Code**: None
- **Spec**: User device generates zero-knowledge proof from HealthKit/Google Fit data via RISC Zero/Bonsai. Binary attestation (e.g., "User X exceeded 50 miles") without exposing GPS, HR, timestamps. Submitted to smart contract via oracle network.
- **Dependencies**: F-MARKET-03, F-VERIFY-02, ZKP proving engine

#### F-MARKET-05: Actuarially Fair Odds Engine

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--differentiation-competitor.md` §HealthyWage gaps
- **Existing Code**: None
- **Spec**: Publish simplified actuarial assumptions and expected win/loss rates by segment (age, BMI, timeframe). "Actuarial furies" audit for statistical anomalies. Transparent, user-audited odds.
- **Dependencies**: F-CORE-03, F-B2B-06

#### F-MARKET-06: Feedback-as-a-Service (FaaS)

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--evaluation-to-growth--behavioral-physics.md` §Growth Opportunities
- **Existing Code**: None
- **Spec**: License Styx audit engine to external social platforms to restore reputational decay loops. White-label verification infrastructure.
- **Dependencies**: F-FURY-01, API gateway

---

### Domain 12: INFRA — Infrastructure & DevOps

#### F-INFRA-01: High-Risk Merchant Account

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0
- **Source**: `legal--gatekeeper-compliance.md` §1, `planning--roadmap.md` §Alpha (checked)
- **Existing Code**: N/A (business/legal process, not code)
- **Spec**: Apply for Corepay/Allied Wallet. Transaction fees: 3-6% + $0.30 + 5-10% rolling reserve. Standard Stripe triggers Risk Review within 48 hours of first $1K volume → permanent freeze.
- **Dependencies**: Legal counsel
- **Legal/Compliance**: Critical gatekeeper compliance. Use "Performance-Based Accountability Escrow" terminology.

#### F-INFRA-02: GitHub Actions CI/CD Pipeline

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0
- **Source**: `architecture--alpha-to-omega-plan.md` §Infrastructure, `planning--ship-baseline-report.md`
- **Existing Code**: `.github/workflows/` (CI: lint/test/build/gates/CodeQL; CD: tag-triggered deploy to Render)
- **Spec**: CI: Node 20, security audit, turbo test + build + lint, Gates 04-06, CodeQL analysis. CD: tag-triggered deploy to Render with smoke test.
- **Dependencies**: GitHub Actions, Render

#### F-INFRA-03: Cloudflare R2 Zero-Egress Storage

- **Status**: IMPLEMENTED
- **Phase**: Gamma
- **Priority**: P0
- **Source**: `architecture--feasibility-stack.md` §S4.1, `planning--roadmap.md` §Gamma (checked)
- **Existing Code**: `src/api/services/storage/r2.service.ts`
- **Spec**: S3-compatible, zero egress fees. At 100TB: AWS ~$10K/mo vs R2 ~$150/mo. Signed URLs only. Pre-signed upload links. 30-day auto-delete lifecycle after review.
- **Dependencies**: Cloudflare account

#### F-INFRA-04: Terraform IaC

- **Status**: IMPLEMENTED
- **Phase**: Added Feb 2026
- **Priority**: P1
- **Source**: `architecture--alpha-to-omega-plan.md` §Infrastructure
- **Existing Code**: `infra/terraform/`
- **Spec**: Terraform configs for Render services + Cloudflare R2. Reproducible infrastructure deployments.
- **Dependencies**: Terraform

#### F-INFRA-05: Cloudflare WAF Configuration

- **Status**: IMPLEMENTED
- **Phase**: Delta
- **Priority**: P1
- **Source**: `architecture--alpha-to-omega-plan.md` §Infrastructure, `planning--roadmap--ai-workstreams.md` §WS5
- **Existing Code**: Terraform-managed
- **Spec**: Rate limits: auth 5/min, financial 10/min, general 120/min. Security headers: HSTS, CSP, XSS protection. Bot management. Edge-level geofencing.
- **Dependencies**: F-INFRA-04

#### F-INFRA-06: Validation Gate Scripts

- **Status**: IMPLEMENTED
- **Phase**: Various
- **Priority**: P0
- **Source**: `planning--roadmap.md` §Validation Gates, `architecture--alpha-to-omega-plan.md`
- **Existing Code**: `scripts/validation/01-07` (7 scripts)
- **Spec**: Gate 01: phantom money check. Gate 02: simulator spoof check. Gate 03: full loop E2E. Gate 04: redacted build check (CI). Gate 05: behavioral physics constants (CI). Gate 06: security invariants (CI). Gate 07: claim drift check.
- **Dependencies**: F-CORE-01, F-CORE-05

#### F-INFRA-07: Video Encoding Pipeline

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `architecture--feasibility-stack.md` §S4, `research--habit-application.md` §Pillar 5
- **Existing Code**: None
- **Spec**: Cloudflare Stream or Mux for video encoding. HLS multi-bitrate streaming. FFmpeg compression + metadata stripping. Cost: ~$0.0075/min HD transcoding.
- **Dependencies**: F-INFRA-03

#### F-INFRA-08: Auto-Redaction at Edge

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--evaluation-to-growth--strategic-review.md` §3.1
- **Existing Code**: None
- **Spec**: Cloudflare Workers process uploaded videos at edge to blur faces. Mitigates biometric privacy risk under GDPR/CCPA.
- **Dependencies**: F-INFRA-03, Cloudflare Workers

#### F-INFRA-09: Web Shop Payment Routing

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P2
- **Source**: `research--prediction-markets-regulation-finance.md` §App Store Financials
- **Existing Code**: None
- **Spec**: External payment via Web Shop (Epic v. Apple injunction). Browser-based checkout (Stripe). 0% Apple commission on external sales in US. Route financial onboarding to web, keep mobile as "Verification Utility."
- **Dependencies**: F-CORE-04
- **Legal/Compliance**: Requires Apple's neutral notice. EU/Japan have different fee structures.

#### F-INFRA-10: "Styx-Certified" Hardware Partnerships

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `research--evaluation-to-growth--strategic-review.md` §4.1 Bloom
- **Existing Code**: None
- **Spec**: Partner with scale/wearable manufacturers for deeper hardware-level cryptographic signing.
- **Dependencies**: Business development

---

### Domain 13: LEGAL — Legal & Regulatory Implementation

#### F-LEGAL-01: Contest Official Rules Engine

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P0 (beta-blocker)
- **Source**: `legal--compliance-guardrails.md` §4.C
- **Existing Code**: `src/web/app/legal/rules/page.tsx`
- **Spec**: Every contest must have official rules stating: eligibility (age, geography, health), start/end dates with timezone, exact performance criteria, verification methods, winner determination, maximum prizes, dispute procedure. Rules must be consistent with product behavior.
- **Dependencies**: F-CORE-07
- **Legal/Compliance**: Required for promotions/contest law compliance across all states.

#### F-LEGAL-02: Responsible Use Warnings & Disclosures

- **Status**: IMPLEMENTED
- **Phase**: Beta
- **Priority**: P1
- **Source**: `legal--compliance-guardrails.md` §4.E
- **Existing Code**: `src/web/app/legal/responsible-use/page.tsx`
- **Spec**: "You can lose money; not an investment product." "Not medical advice; talk to your doctor." Links to NCPG, eating-disorder, mental-health resources. FTC 16 CFR Part 255 compliance for marketing.
- **Dependencies**: None
- **Legal/Compliance**: FTC, state consumer protection laws.

#### F-LEGAL-03: State-by-State Compliance Toggles

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P0
- **Source**: `legal--compliance-guardrails.md` §50-State, `legal--performance-wagering.md`
- **Existing Code**: `src/api/services/geofencing.ts` (tier mapping), `src/api/src/modules/compliance/compliance-policy.service.ts`
- **Spec**: Canonical policy service handles per-state rules. TIER_2 refund-only mode for "material element" states. TIER_3 hard-block for "any chance" states. Must be dynamically configurable as legal landscape changes.
- **Dependencies**: F-AEGIS-02
- **Legal/Compliance**: "The application cannot operate uniformly nationwide."

#### F-LEGAL-04: Refund-Only Mode (Legal Contingency)

- **Status**: PARTIAL
- **Phase**: Beta
- **Priority**: P1
- **Source**: `research--evaluation-to-growth--strategic-review.md` §3.2, `legal--compliance-guardrails.md` §Variant 1
- **Existing Code**: TIER_2 refund-only restrictions implemented in compliance-policy service
- **Spec**: If "Dominant Factor Test" is rejected in a major market, instantly activate per-state "Refund-Only Mode" — stakes returned regardless of outcome. Legal kill switch for gambling prohibition compliance.
- **Dependencies**: F-AEGIS-02, F-LEGAL-03

#### F-LEGAL-05: Skill-Based Contest Whitepaper

- **Status**: NOT_STARTED
- **Phase**: Beta
- **Priority**: P1
- **Source**: `legal--performance-wagering.md`, `research--prediction-markets-regulation-finance.md` §Dominant Factor Test
- **Existing Code**: None
- **Spec**: Formal legal defense document: Styx is "game of skill" not "game of chance." Three differentiators: (1) dynamic entry/exit, (2) price discovery via aggregate supply/demand, (3) utility for behavioral hedging. "Dominant Factor Test" analysis per jurisdiction.
- **Dependencies**: Legal counsel
- **Legal/Compliance**: Defense against state gambling commissions.

#### F-LEGAL-06: Terminology Sanitization Automation

- **Status**: IMPLEMENTED
- **Phase**: Alpha
- **Priority**: P0
- **Source**: `legal--gatekeeper-compliance.md` §2
- **Existing Code**: `scripts/validation/04-redacted-build-check.sh` (runs in CI)
- **Spec**: CI gate scans production build for forbidden gambling terminology. Zero tolerance for: "bet", "gamble", "wager", "odds", "casino", "pot" in built binaries.
- **Dependencies**: F-UX-10, F-INFRA-02

#### F-LEGAL-07: Prize Indemnity Insurance

- **Status**: NOT_STARTED
- **Phase**: Phase2+
- **Priority**: P3
- **Source**: `legal--compliance-guardrails.md` §3.4
- **Existing Code**: None
- **Spec**: Purchase prize indemnity insurance for large-payout contests rather than self-insuring. Structures business more like promotions operation than bookmaker.
- **Dependencies**: Insurance provider

#### F-LEGAL-08: CFTC Sales Target Prohibition

- **Status**: IMPLEMENTED
- **Phase**: All
- **Priority**: P0
- **Source**: `legal--performance-wagering.md`, `brainstorm--motivation-validation.md` §CFTC Nuke
- **Existing Code**: Design constraint enforced by oath category restrictions — Professional category only in B2B context
- **Spec**: Consumer sales/commercial targets are PROHIBITED. Allowing users to bet on sales goals = unregistered derivatives exchange (federal offense). Sales targets ONLY in B2B where employers fund pools exclusively.
- **Dependencies**: F-CORE-05
- **Legal/Compliance**: CFTC exclusive federal authority over event contracts. Dodd-Frank §745.

---

## Part II: Source Document → Feature Cross-Reference

| Document | Feature IDs |
|----------|-------------|
| `research--behavioral-economics.md` | F-CORE-05, F-CORE-10, F-CORE-13, F-UX-02, F-UX-03, F-UX-06, F-AEGIS-09 |
| `research--psychology-behavior.md` | F-CORE-08, F-UX-05, F-UX-06, F-UX-07, F-SOCIAL-01 |
| `research--habit-application.md` | F-VERIFY-02, F-VERIFY-04, F-VERIFY-07, F-WEB-05, F-FURY-01 |
| `research--competitor-teardown.md` | F-FURY-01, F-FURY-02, F-CORE-03, F-SOCIAL-05, F-SOCIAL-06, F-CORE-14, F-MARKET-05 |
| `research--differentiation-competitor.md` | F-CORE-03, F-VERIFY-01, F-AEGIS-05, F-CORE-14 |
| `research--behavioral-physics-manifesto.md` | F-CORE-05 (design philosophy — 7 design rules) |
| `research--behavioral-engineering-masters.md` | F-CORE-09, F-CORE-10, F-UX-01, F-UX-04, F-UX-08, F-AEGIS-08 |
| `research--market-analysis.md` | F-B2B-04, F-B2B-07, F-CORE-15, F-SOCIAL-05 |
| `research--breakup-psychology-loss-aversion.md` | F-CORE-10, F-CORE-11, F-AEGIS-04, F-SOCIAL-01 |
| `research--app-verification-tech-privacy-law.md` | F-VERIFY-08, F-VERIFY-09, F-VERIFY-10, F-VERIFY-11, F-VERIFY-13 |
| `research--b2b-expansion-heartbreak-niche.md` | F-B2B-04, F-B2B-05, F-B2B-08 |
| `research--behavior-change-app-design.md` | F-CORE-15, F-UX-09 |
| `research--bounty-shame-protocol-safety-legality.md` | F-MARKET-04, F-FURY-04 |
| `research--digital-exhaust-no-contact-contracts.md` | F-VERIFY-12 |
| `research--gamified-behavior-change-app-design.md` | F-VERIFY-13, F-MARKET-01, F-MARKET-02, F-CORE-12 |
| `research--prediction-markets-regulation-finance.md` | F-MARKET-01, F-INFRA-09, F-LEGAL-05 |
| `research--smart-contracts-behavioral-wagers.md` | F-MARKET-03, F-MARKET-04, F-CORE-13 |
| `research--commitment-device-market-analysis.md` | F-VERIFY-11, F-UX-11 |
| `research--evaluation-to-growth--behavioral-physics.md` | F-FURY-04, F-MARKET-06 |
| `research--evaluation-to-growth--strategic-review.md` | F-FURY-03, F-FURY-07, F-FURY-08, F-AEGIS-07, F-LEGAL-04, F-B2B-09, F-INFRA-10 |
| `architecture--feasibility-stack.md` | F-VERIFY-02, F-VERIFY-07, F-FURY-01, F-INFRA-03, F-WEB-05 |
| `architecture--truth-blockchain.md` | F-CORE-02, F-VERIFY-01, F-INFRA-03 |
| `architecture--technical-feasibility.md` | F-CORE-01, F-VERIFY-07, F-FURY-01 |
| `architecture--alpha-to-omega-plan.md` | F-INFRA-02, F-INFRA-04, F-INFRA-05, F-B2B-06 |
| `legal--aegis-protocol.md` | F-AEGIS-01, F-CORE-04, F-AEGIS-03 |
| `legal--compliance-guardrails.md` | F-AEGIS-02, F-AEGIS-05, F-AEGIS-06, F-LEGAL-01, F-LEGAL-03, F-CORE-12 |
| `legal--gatekeeper-compliance.md` | F-INFRA-01, F-UX-10, F-LEGAL-06 |
| `legal--performance-wagering.md` | F-CORE-04, F-LEGAL-05, F-LEGAL-08 |
| `planning--roadmap.md` | F-CORE-01 through F-CORE-07, F-FURY-01 through F-FURY-06, F-AEGIS-01, F-AEGIS-02, F-B2B-01 through F-B2B-03 |
| `planning--roadmap--ai-workstreams.md` | F-WEB-02, F-WEB-03, F-WEB-04, F-DESKTOP-01 through F-DESKTOP-05 |
| `planning--phase1-private-beta-scope.md` | F-VERIFY-06, F-AEGIS-04, F-MOBILE-01 |
| `planning--ship-baseline-report.md` | F-INFRA-02 |
| `planning--implementation-status.md` | F-AEGIS-02, F-AEGIS-03, F-AEGIS-05, F-WEB-01 |
| `brainstorm--motivation-validation.md` | F-CORE-13, F-UX-02, F-LEGAL-08 |
| `adr/001-dual-layer-services-modules.md` | (Architecture — dual-layer services/modules pattern) |
| `api/spec.md` | F-CORE-06, F-CORE-07, F-FURY-02, F-SOCIAL-04, F-MOBILE-06 |
| `MANIFEST.md` | (Documentation catalog — no features) |

---

## Part III: Phase 1 Private Beta Readiness Checklist

Based on `planning--phase1-private-beta-scope.md`: iOS TestFlight, No-Contact recovery, test-money, US-only.

### P0 Go/No-Go Items

| # | Requirement | Feature ID | Status | Go? |
|---|-------------|-----------|--------|-----|
| 1 | Double-entry ledger prevents phantom money | F-CORE-01 | IMPLEMENTED | YES |
| 2 | Hash-chained audit trail | F-CORE-02 | IMPLEMENTED | YES |
| 3 | Integrity score algorithm | F-CORE-03 | IMPLEMENTED | YES |
| 4 | Behavioral logic (7 oath categories) | F-CORE-05 | IMPLEMENTED | YES |
| 5 | Contract lifecycle state machine | F-CORE-07 | IMPLEMENTED | YES |
| 6 | Linguistic cloaker (no gambling terms) | F-UX-10 | IMPLEMENTED | YES |
| 7 | Terminology sanitization CI gate | F-LEGAL-06 | IMPLEMENTED | YES |
| 8 | Fury Router (peer audit distribution) | F-FURY-01 | IMPLEMENTED | YES |
| 9 | Fury accuracy + demotion | F-FURY-02 | IMPLEMENTED | YES |
| 10 | Consensus engine | F-FURY-06 | IMPLEMENTED | YES |
| 11 | Honeypot injection | F-FURY-05 | IMPLEMENTED | YES |
| 12 | pHash duplicate detection | F-VERIFY-01 | IMPLEMENTED | YES |
| 13 | R2 zero-egress storage | F-INFRA-03 | IMPLEMENTED | YES |
| 14 | Whistleblower bounty (anonymous links) | F-SOCIAL-02 | IMPLEMENTED | YES |
| 15 | CI/CD pipeline | F-INFRA-02 | IMPLEMENTED | YES |
| 16 | Aegis Protocol (BMI/velocity) | F-AEGIS-01 | IMPLEMENTED | YES |
| 17 | Stripe FBO escrow (real-money settlement) | F-CORE-04 | PARTIAL | **NO** — test-money only |
| 18 | Geofencing by jurisdiction | F-AEGIS-02 | PARTIAL | **PARTIAL** — code exists, behavior incomplete |
| 19 | Native iOS camera module | F-MOBILE-01 | STUB | **NO** — placeholder only |
| 20 | Daily attestation flow (No-Contact) | F-VERIFY-06 | IMPLEMENTED | **YES** — API + web + mobile attestation screens |
| 21 | Age gate (18+ runtime) | F-AEGIS-03 | IMPLEMENTED | **YES** — auth service + migration 008 + web/mobile UI |
| 22 | HttpOnly cookie auth | F-WEB-01 | IMPLEMENTED | **YES** — cookie-based auth implemented |
| 23 | Contest official rules | F-LEGAL-01 | IMPLEMENTED | **YES** — `/legal/rules` page |
| 24 | Responsible use disclosures | F-LEGAL-02 | IMPLEMENTED | **YES** — `/legal/responsible-use` page |

### Phase 1 Readiness Score

- **YES**: 21/24 (88%)
- **PARTIAL**: 3/24 (12%)
- **NO**: 0/24 (0%)

### Critical Blockers to Resolve

1. **F-MOBILE-01** (Native Camera): Without native capture, No-Contact proof verification is text-only — acceptable for Phase 1 (attestation-based, not photo-based).
2. ~~**F-AEGIS-03** (Age Gate)~~: **RESOLVED** — Implemented in Sprint 1 (auth service + migration 008 + web/mobile UI).
3. ~~**F-WEB-01** (HttpOnly Auth)~~: **RESOLVED** — Cookie-based auth implemented.
4. ~~**F-LEGAL-01** (Contest Rules)~~: **RESOLVED** — `/legal/rules` page implemented in Sprint 4.
5. ~~**F-LEGAL-02** (Responsible Use)~~: **RESOLVED** — `/legal/responsible-use` page implemented in Sprint 4.
6. **F-CORE-04** (Real-Money FBO): Test-money is acceptable for Phase 1 per scope doc — but real-money path must be validated before Phase 2.

### Phase 1 Scope Reminder

Per `planning--phase1-private-beta-scope.md`:
- Primary surface: iOS (TestFlight)
- Primary journey: No-Contact recovery only
- Money mode: **Test-money pilot** (no real settlement)
- Region: US allowlist only
- Web: Admin/support companion (internal)
- Desktop: Internal judge tool only
- B2B/HR: Internal demo only
- Deferred: Non-recovery categories, consumer web parity, Android beta, KYC runtime

---

*Generated by Claude Code from 37 source documents + codebase analysis. All features cite at least one source document. Implementation status verified against `docs/planning/planning--implementation-status.md` and direct codebase inspection.*
