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

*Last synced: 2026-05-17T20:53:33Z*

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

Plans: 269 indexed | Chains: 5 available | SOPs: 8 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `/Users/4jp/Code/organvm/praxis-perpetua/library`


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | atomic-clock | The Atomic Clock |
| system | any | execution-sequence | Execution Sequence |
| system | any | multi-agent-dispatch | Multi-Agent Dispatch |
| system | any | session-handoff-avalanche | Session Handoff Avalanche |
| system | any | system-loops | System Loops |
| system | any | prompting-standards | Prompting Standards |
| system | any | background-task-resilience | background-task-resilience |
| system | any | context-window-conservation | context-window-conservation |
| system | any | session-self-critique | session-self-critique |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | triangulation-protocol | triangulation-protocol |

Linked skills: SOP-TRIADIC-REVIEW-PROTOCOL, cicd-resilience-and-recovery, continuous-learning-agent, evaluation-to-growth, genesis-dna, multi-agent-workforce-planner, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, session-self-critique, structural-integrity-audit, the-membrane-protocol, triple-reference


**Prompting (Google)**: context 1M tokens (Gemini 1.5 Pro), format: markdown, thinking: thinking mode (thinkingConfig)


## Atomization Pipeline

Run `organvm atoms pipeline --write && organvm atoms fanout --write` to generate task queue.


## System Density (auto-generated)

AMMOI: 25% | Edges: 0 | Tensions: 0 | Clusters: 0 | Adv: 27 | Events(24h): 37445
Structure: 8 organs / 148 repos / 1654 components (depth 17) | Inference: 0% | Organs: META-ORGANVM:63%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:54% +5 more
Last pulse: 2026-05-17T20:53:14 | Δ24h: n/a | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** EXECUTABLE_ALGORITHM | **Classical Parallel:** Arithmetic | **Translation Role:** The Engineering — proves that proofs compute

Strongest translations: I (formal), II (structural), VII (structural)

Scan: `organvm trivium scan III <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`


## Logos Documentation Layer

**Status:** ACTIVE | **Symmetry:** 1.0 (ALIGNED)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.

- **[Public Essay](https://organvm-v-logos.github.io/public-process/)** — System-wide narrative entry.

*Compliance: Formation is currently void.*

<!-- ORGANVM:AUTO:END -->
