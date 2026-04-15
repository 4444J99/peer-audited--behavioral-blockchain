# Styx: The Blockchain of Truth - Context & Instructions

This document provides instructional context for AI agents working on the **Styx** project. It outlines the project's purpose, architecture, core mechanics, and development standards.

## Project Overview

**Styx** is a decentralized, peer-audited behavioral market focused on **relationship recovery** and the **No Contact** rule. It weaponizes **loss aversion** (using a validated coefficient of 1.955) by requiring users to stake financial deposits into behavioral contracts.

### Core Mechanics

1. **The Fury Bounty**: A decentralized anti-cheat system where users are financially incentivized to audit and expose fraudulent claims of their peers.
2. **Digital Exhaust Verification**: Server-side analysis of whistleblower-submitted communication artifacts (texts, call logs) to prove No Contact breaches.
3. **The Recovery Protocol**: Psychological guardrails for No Contact contracts — 30-day max duration, 3-target cap, mandatory accountability partner, and 4-way safety acknowledgments (voluntary, no minors, no dependents, no legal obligations).
4. **The Aegis Protocol**: A suite of hardcoded legal and psychological guardrails (18+ age gate, weekend volatility multipliers, dynamic penalty scaling) to ensure regulatory compliance and behavioral stability.
5. **Double-Entry Ledger**: A strict PostgreSQL-based bookkeeping system that ensures absolute financial integrity for all stakes, bounties, and platform fees.

## Architecture

Styx is implemented as a **Monorepo** managed by Turborepo.

* **`src/api`**: NestJS backend. Responsible for the ledger, escrow (Stripe FBO), and the Fury Router (BullMQ/Redis).
* **`src/web`**: Next.js web application for consumer dashboards and the "Fury Audit" workbench.
* **`src/mobile`**: React Native mobile application for iOS and Android. Contains deep linking for Whistleblower intake loops, camera module for digital exhaust capture.
* **`src/desktop`**: Tauri 2.0 admin dashboard for "The Judge" (dispute resolution).
* **`src/pitch`**: Vite + React interactive pitch deck (builds to `docs/` for GitHub Pages).
* **`src/shared`**: Shared TypeScript types, utility libraries (Integrity Score algorithm, behavioral logic constants), and shared UI components.

## Building and Running

The project uses a `Makefile` for high-level operations and **npm** (with workspaces + Turborepo) for package management.

### Key Commands

* `make install`: Install dependencies for the entire monorepo (`npm ci`).
* `make dev`: Start all services in development mode (`turbo run dev`).
* `make build`: Build all services for production.
* `make test`: Run the full test suite (Unit, Integration, and E2E).
* `make docker-up`: Spin up local infrastructure (PostgreSQL + Redis).

## Development Conventions

* **Modular Theory**: Every element should be one function logically. Small, focused, and testable modules are mandatory.
* **Privacy-First Verification**: Digital Exhaust verification (Texts/Logs) must prioritize privacy. Research and prioritize Zero-Knowledge Proofs (ZKPs) or local-only processing to prevent server-side exposure of sensitive metadata.
* **Zero Trust**: Never trust client-side data. All critical validation (Whistleblower artifacts, Financial status) must occur server-side.
* **Auditor Integrity**: The Fury Network is the system's "Shatter Point." Implementation must include anti-collusion logic, honeypot injection, and aggressive slashing for dishonest reviewers.
* **Conventional Commits**: All git commits must follow the Conventional Commits 1.0.0 specification.
* **Test-Driven Development (TDD)**: No feature implementation is complete without corresponding test coverage.
* **Naming Convention**: Use kebab-case for filenames and functional descriptors (e.g., `research--behavioral-economics.md`).

## Key Technology Stack

* **Languages**: TypeScript (Strict Mode), Swift, Kotlin.
* **Backend**: NestJS, PostgreSQL (ACID compliant), Redis (Sorted Sets for leaderboards).
* **Frontend**: Next.js, React Native, Tauri 2.0.
* **Infrastructure**: Cloudflare R2 (Storage), Stripe (FBO Escrow), BullMQ (Queueing).
* **AI**: Gemini 2.5 Flash (goal ethics screening, VC questions, ELI5).

## Documentation Reference

Comprehensive documentation is located in the `docs/` directory:

* `docs/architecture/`: Technical specs and feasibility reports.
* `docs/legal/`: Regulatory guardrails and compliance analysis.
* `docs/research/`: Scientific foundation and market analysis.
* `docs/roadmap.md`: 5-month Alpha-to-Omega sprint plan.

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-III (Commerce) | **Tier:** flagship | **Status:** GRADUATED
**Org:** `organvm-iii-ergon` | **Repo:** `peer-audited--behavioral-blockchain`

### Edges
- **Produces** → `unspecified`: product
- **Produces** → `organvm-vi-koinonia/community-hub`: community_signal
- **Produces** → `organvm-vii-kerygma/kerygma-pipeline`: distribution_signal
- **Produces** → `organvm-v-logos/essay-pipeline`: essay_material
- **Consumes** ← `organvm-i-theoria/styx-behavioral-economics-theory`: theory
- **Consumes** ← `organvm-ii-poiesis/styx-behavioral-art`: creative-artifact
- **Consumes** ← `organvm-iv-taxis/orchestration-start-here`: governance-rules

### Siblings in Commerce
`classroom-rpg-aetheria`, `gamified-coach-interface`, `trade-perpetual-future`, `fetch-familiar-friends`, `sovereign-ecosystem--real-estate-luxury`, `public-record-data-scrapper`, `search-local--happy-hour`, `multi-camera--livestream--framework`, `universal-mail--automation`, `mirror-mirror`, `the-invisible-ledger`, `enterprise-plugin`, `virgil-training-overlay`, `tab-bookmark-manager`, `a-i-chat--exporter` ... and 16 more

### Governance
- Strictly unidirectional flow: I→II→III. No dependencies on Theory (I).

*Last synced: 2026-04-14T21:31:57Z*

## Active Handoff Protocol

If `.conductor/active-handoff.md` exists, **READ IT FIRST** before doing any work.
It contains constraints, locked files, conventions, and completed work from the
originating agent. You MUST honor all constraints listed there.

If the handoff says "CROSS-VERIFICATION REQUIRED", your self-assessment will
NOT be trusted. A different agent will verify your output against these constraints.

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## System Library

Plans: 269 indexed | Chains: 5 available | SOPs: 121 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `meta-organvm/praxis-perpetua/library/`


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | atomic-clock | The Atomic Clock |
| system | any | execution-sequence | Execution Sequence |
| system | any | multi-agent-dispatch | Multi-Agent Dispatch |
| system | any | session-handoff-avalanche | Session Handoff Avalanche |
| system | any | system-loops | System Loops |
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | phase-closing-and-forward-plan | METADOC: Phase-Closing Commemoration & Forward Attack Plan |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | any | autonomous-content-syndication | SOP: Autonomous Content Syndication (The Broadcast Protocol) |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | background-task-resilience | background-task-resilience |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | community-event-facilitation | SOP: Community Event Facilitation (The Dialectic Crucible) |
| system | any | context-window-conservation | context-window-conservation |
| system | any | conversation-to-content-pipeline | SOP — Conversation-to-Content Pipeline |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | cross-channel-publishing-metrics | SOP: Cross-Channel Publishing Metrics (The Echo Protocol) |
| system | any | data-migration-and-backup | SOP: Data Migration and Backup Protocol (The Memory Vault) |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | dynamic-lens-assembly | SOP: Dynamic Lens Assembly |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | formal-methods-applied-protocols | SOP: Formal Methods Applied Protocols |
| system | any | formal-methods-master-taxonomy | SOP: Formal Methods Master Taxonomy (The Blueprint of Proof) |
| system | any | formal-methods-tla-pluscal | SOP: Formal Methods — TLA+ and PlusCal Verification (The Blueprint Verifier) |
| system | any | generative-art-deployment | SOP: Generative Art Deployment (The Gallery Protocol) |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | mcp-server-fleet-management | SOP: MCP Server Fleet Management (The Server Protocol) |
| system | any | multi-agent-swarm-orchestration | SOP: Multi-Agent Swarm Orchestration (The Polymorphic Swarm) |
| system | any | network-testament-protocol | SOP: Network Testament Protocol (The Mirror Protocol) |
| system | any | open-source-licensing-and-ip | SOP: Open Source Licensing and IP (The Commons Protocol) |
| system | any | performance-interface-design | SOP: Performance Interface Design (The Stage Protocol) |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | polymorphic-agent-testing | SOP: Polymorphic Agent Testing (The Adversarial Protocol) |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | any | recursive-study-feedback | SOP: Recursive Study & Feedback Loop (The Ouroboros) |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | smart-contract-audit-and-legal-wrap | SOP: Smart Contract Audit and Legal Wrap (The Ledger Protocol) |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | styx-pipeline-traversal | SOP: Styx Pipeline Traversal (The 7-Organ Transmutation) |
| system | any | system-dashboard-telemetry | SOP: System Dashboard Telemetry (The Panopticon Protocol) |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theoretical-concept-versioning | SOP: Theoretical Concept Versioning (The Epistemic Protocol) |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |
| unknown | any | SOP-SS-ATM-001_001-atomic-decomposition | SOP-SS-ATM-001_001: Atomic Decomposition & Coverage Proof |
| unknown | any | SOP-SS-CLT-001_001-ontology_client_decisions | SOP-SS-CLT-001_001-ontology_client_decisions |
| unknown | any | SOP-SS-CNT-001_001-content-extraction-and-node-injection | SOP-SS-CNT-001_001: Content Extraction & Node Injection |
| unknown | any | SOP-SS-ISS-001-001-ontology-issue-specification | SOP-SS-ISS-001-001-ontology-issue-specification |
| unknown | any | SOP-SS-PRC-001_001-ontology_meta_process | SOP-SS-PRC-001-001-ontology-meta-process |
| unknown | any | SOP-SS-QAB-001_001-project-board-qa | SOP-SS-QAB-001_001-project-board-qa |
| unknown | any | SOP-SS-TRK-001_001-ontology_issue_tracking | SOP-SS-TRK-001_001-ontology_issue_tracking |
| unknown | any | registry | SOP Registry — Sovereign Systems |

Linked skills: cicd-resilience-and-recovery, continuous-learning-agent, evaluation-to-growth, genesis-dna, multi-agent-workforce-planner, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, structural-integrity-audit


**Prompting (Google)**: context 1M tokens (Gemini 1.5 Pro), format: markdown, thinking: thinking mode (thinkingConfig)


## Ecosystem Status

- **delivery**: 0/5 live, 3 planned
- **revenue**: 0/2 live, 2 planned
- **marketing**: 0/3 live, 2 planned
- **community**: 0/1 live, 0 planned
- **content**: 0/2 live, 1 planned
- **listings**: 0/1 live, 1 planned

Run: `organvm ecosystem show peer-audited--behavioral-blockchain` | `organvm ecosystem validate --organ III`


## External Mirrors (Network Testament)

- **technical** (3): eslint/eslint, prettier/prettier, microsoft/TypeScript

Convergences: 20 | Run: `organvm network map --repo peer-audited--behavioral-blockchain` | `organvm network suggest`


## Task Queue (from pipeline)

**246** pending tasks | Last pipeline: unknown

- `648328e8cbaf` Plan: 30-Day GTM Strike Plan
- `ad6bb8bb3bb6` #563 `Add adverse authority analysis section to whitepaper` [graphql]
- `a47ed8fbde6b` #562 `Expand case law coverage to 15-25 cases in whitepaper and supporting docs` [graphql]
- `02ae89f21ff6` Plan: Market Attack Plan
- `357b5cdbdfd7` Untitled Plan
- `de0237f83aa9` Plan: Phase 1 Copy Pack
- `7562b9c482c4` Plan: Positioning Core
- `21f701276a66` Untitled Plan
- ... and 238 more

Cross-organ links: 132 | Top tags: `bash`, `react`, `typescript`, `python`, `node`

Run: `organvm atoms pipeline --write && organvm atoms fanout --write`


## Entity Identity (Ontologia)

**UID:** `ent_repo_01KKKX3RVP5HZ63E8FCT65RBYR` | **Matched by:** primary_name

Resolve: `organvm ontologia resolve peer-audited--behavioral-blockchain` | History: `organvm ontologia history ent_repo_01KKKX3RVP5HZ63E8FCT65RBYR`


## Live System Variables (Ontologia)

| Variable | Value | Scope | Updated |
|----------|-------|-------|---------|
| `active_repos` | 89 | global | 2026-04-14 |
| `archived_repos` | 54 | global | 2026-04-14 |
| `ci_workflows` | 107 | global | 2026-04-14 |
| `code_files` | 0 | global | 2026-04-14 |
| `dependency_edges` | 60 | global | 2026-04-14 |
| `operational_organs` | 10 | global | 2026-04-14 |
| `published_essays` | 29 | global | 2026-04-14 |
| `repos_with_tests` | 0 | global | 2026-04-14 |
| `sprints_completed` | 33 | global | 2026-04-14 |
| `test_files` | 0 | global | 2026-04-14 |
| `total_organs` | 10 | global | 2026-04-14 |
| `total_repos` | 145 | global | 2026-04-14 |
| `total_words_formatted` | 0 | global | 2026-04-14 |
| `total_words_numeric` | 0 | global | 2026-04-14 |
| `total_words_short` | 0K+ | global | 2026-04-14 |

Metrics: 9 registered | Observations: 32128 recorded
Resolve: `organvm ontologia status` | Refresh: `organvm refresh`


## System Density (auto-generated)

AMMOI: 58% | Edges: 42 | Tensions: 33 | Clusters: 5 | Adv: 23 | Events(24h): 32336
Structure: 8 organs / 145 repos / 1654 components (depth 17) | Inference: 98% | Organs: META-ORGANVM:65%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:54% +5 more
Last pulse: 2026-04-14T21:31:36 | Δ24h: -1.0% | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** EXECUTABLE_ALGORITHM | **Classical Parallel:** Arithmetic | **Translation Role:** The Engineering — proves that proofs compute

Strongest translations: I (formal), II (structural), VII (structural)

Scan: `organvm trivium scan III <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`


## Logos Documentation Layer

**Status:** MISSING | **Symmetry:** 0.5 (GHOST)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](../docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](../docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](../docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](../docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](../docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.

- **[Public Essay](https://organvm-v-logos.github.io/public-process/)** — System-wide narrative entry.

*Compliance: Implementation exists without record.*

<!-- ORGANVM:AUTO:END -->
